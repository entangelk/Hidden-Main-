import { describe, expect, it } from 'vitest'
import type { Scenario } from '../engine/types'
import { incident0214 } from './incident-0214'
import { miniScenario } from './mini'
import { validateScenario } from './validate'

describe('validateScenario', () => {
  it('passes the mini scenario and reaches both endings', () => {
    const { problems, exploration } = validateScenario(miniScenario)
    expect(problems).toEqual([])
    expect([...exploration.endings].sort()).toEqual(['contained', 'escalated'])
  })

  it('passes Incident 02:14: every scene reachable, both endings reachable, all screens clean', () => {
    const { problems, exploration } = validateScenario(incident0214)
    expect(problems).toEqual([])
    expect([...exploration.endings].sort()).toEqual(['resolved', 'sealed'])
    expect(exploration.reachedScenes.size).toBe(incident0214.scenes.length)
  }, 60_000) // exhaustive play over every distinct (scene, flags) state takes a few seconds

  it('reports broken data and templates (the checks bite)', () => {
    const broken = structuredClone(miniScenario)
    broken.scenes[0].transitions = broken.scenes[0].transitions.slice(0, 1) // no default transition
    broken.scenes[1].transitions[0].next = { scene: 'triage' } // a loop back
    broken.scenes[2].editableFields = [{ name: 'action', type: 'int', options: [1, 2, 3] }] // comments list 2
    broken.stages[0].template = broken.stages[0].template.replace('        action = 1\n', '        action = 1\n        action = 2\n')
    broken.endings.push({ id: 'never', log: [] })
    const { problems } = validateScenario(broken)
    expect(problems).toEqual(
      expect.arrayContaining([
        'triage: last transition must have an empty condition',
        'transition graph has a cycle',
        'report.action: comment options [1,2] ≠ field options [1,2,3]',
        'triage.action: 2 assignment lines (need exactly 1)',
        'ending never: unreachable',
      ]),
    )
  })

  // One case per check, so removing any single check fails a test.
  const problemsOf = (edit: (s: Scenario) => void) => {
    const broken: Scenario = structuredClone(miniScenario)
    edit(broken)
    return validateScenario(broken).problems
  }

  it.each([
    ['tab character', (s) => (s.stages[0].template = s.stages[0].template.replace('    def contain', '\tdef contain')), 'main.py: tab character'],
    ['triple quote', (s) => (s.stages[1].template += '\nNOTE = """x"""\n'), 'incidents/report.py: triple-quoted string'],
    ['function order', (s) => (s.stages[0].sceneIds = ['contain', 'triage']), 'main.py: function order differs from sceneIds'],
    ['unknown next scene', (s) => (s.scenes[1].transitions[1].next = { scene: 'nowhere' }), 'contain: unknown next scene nowhere'],
    ['unknown ending', (s) => (s.scenes[2].transitions[1].next = { ending: 'nowhere' }), 'report: unknown ending nowhere'],
    ['ordering a non-number', (s) => (s.scenes[1].transitions[0].when = [{ ref: { choice: 'isolate' }, op: '>=', value: true }]), 'contain: >= on a non-number'],
    ['condition on unknown field', (s) => (s.scenes[1].transitions[0].when = [{ ref: { choice: 'nope' }, op: '==', value: 1 }]), 'contain: condition on unknown field nope'],
    ['invalid default', (s) => (s.scenes[0].editableFields = [{ name: 'action', type: 'int', options: [2, 3] }]), 'triage: template default is not a valid value'],
    ['unreachable scene', (s) => s.scenes[0].transitions.forEach((t) => (t.next = { scene: 'report' })), 'contain: unreachable'],
    ['@if on a flag nothing sets', (s) => (s.stages[1].template = s.stages[1].template.replace('@if isolated', '@if isolatd')), 'incidents/report.py: @if on flag "isolatd" that no transition sets'],
    ['flag never read', (s) => s.scenes[1].transitions[1].effects.push({ flag: 'unused', value: 1 }), 'flag "unused" is set but never read'],
    [
      'transition never taken',
      (s) => s.scenes[1].transitions.unshift({ when: [{ ref: { choice: 'isolate' }, op: '==', value: 'yes' }], effects: [], log: [], next: { scene: 'report' } }),
      'contain: transition 0 can never be taken',
    ],
  ] as [string, (s: Scenario) => void, string][])('reports %s', (_, edit, expected) => {
    expect(problemsOf(edit)).toContain(expected)
  })

  it('checks option explanations on the rendered screen, not the raw template', () => {
    // The option line goes; "2." still appears inside an @else branch that this path does not show.
    const problems = problemsOf((s) => {
      s.stages[1].template = s.stages[1].template
        .replace('        #   2. 상위 부서로 넘긴다.\n', '')
        .replace('        # @else\n        # 서버는 아직', '        # @else\n        #   2. 보이지 않는 줄\n        # 서버는 아직')
    })
    expect(problems).toContain('report.action: comment options [1] ≠ field options [1,2]')
  })

  it('flags a directive left outside a function and a nested def', () => {
    const broken = structuredClone(miniScenario)
    broken.stages[1].template = '# @if x == 1\n# @end\n' + broken.stages[1].template.replace(
      '        action = 1\n',
      '        def helper():\n            pass\n        action = 1\n',
    )
    const { problems } = validateScenario(broken)
    expect(problems).toContain('incidents/report.py: a # @if/@else/@end line is visible on screen')
    expect(problems).toContain('report: nested def inside the scene function')
  })
})
