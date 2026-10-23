import { describe, expect, it } from 'vitest'
import type { Scenario } from '../engine/types'
import { incident0214 } from './incident-0214'
import { miniScenario } from './mini'
import { thermalDrift } from './thermal-drift'
import { unloggedRun } from './unlogged-run'
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
    // Exhaustive play grows with every flag; keep an eye on it (8,650 states at version 3).
    expect(exploration.states).toBeLessThan(20_000)
  }, 60_000) // exhaustive play over every distinct (scene, flags) state takes a few seconds

  it.each([
    [thermalDrift.title, thermalDrift, ['patched', 'traced']],
    [unloggedRun.title, unloggedRun, ['erased', 'preserved']],
  ] as const)('passes %s: every scene and both endings reachable, all screens clean', (_, scenario, endings) => {
    const { problems, exploration } = validateScenario(scenario)
    expect(problems).toEqual([])
    expect([...exploration.endings].sort()).toEqual(endings)
    expect(exploration.reachedScenes.size).toBe(scenario.scenes.length)
  })

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
    // Listing report.py first makes contain → report a move back to an earlier file, with no scene cycle.
    ['back to an earlier file', (s) => s.stages.reverse(), 'contain: goes back to an earlier stage file (report)'],
    ['run hint missing', (s) => (s.stages[1].template = s.stages[1].template.replace(/\n *# Ctrl\+Enter\(macOS는 Cmd\+Enter\)로 실행한다\./, '')), 'report: run hint missing under the value line'],
    ['reserved next_file()', (s) => (s.stages[1].template += '\n    def next_file(self):\n        pass\n'), 'incidents/report.py: next_file() is reserved for the engine'],
    ['missing function', (s) => (s.stages[1].template = s.stages[1].template.replace('def write_report', 'def write_rep0rt')), 'incidents/report.py: scene function missing (write_report)'],
    ['field without a literal slot', (s) => (s.stages[1].template = s.stages[1].template.replace('        action = 1\n', '        action = int("1")\n')), 'report: a field has no literal slot (default must be a plain literal)'],
    ['string option not explained', (s) => {
      s.scenes[2].editableFields = [{ name: 'action', type: 'string', options: ['x', 'y'] }]
      s.stages[1].template = s.stages[1].template.replace('        action = 1\n', '        action = "x"  # "x"\n')
      s.scenes[2].transitions = [{ when: [], effects: [], log: [], next: { ending: 'escalated' } }, ...s.scenes[2].transitions.slice(0, 0)]
      s.scenes[2].transitions.unshift({ when: [{ ref: { flag: 'isolated' }, op: '==', value: true }], effects: [], log: [], next: { ending: 'contained' } })
    }, 'report.action: option "y" not explained in comments'],
    ['number range not explained', (s) => {
      s.scenes[1].editableFields = [{ name: 'isolate', type: 'number', min: 0, max: 9 }]
      s.stages[0].template = s.stages[0].template.replace('isolate = False', 'isolate = 0')
      s.scenes[1].transitions = [s.scenes[1].transitions[1]]
      s.scenes[1].transitions[0].effects = [{ flag: 'isolated', value: true }]
    }, 'contain.isolate: range 0~9 not explained in comments'],
    ['comment variant that is never true', (s) => (s.stages[1].template = s.stages[1].template.replace('@if isolated == True', '@if isolated == False')), 'report: # @if isolated == False is never true when the scene is reached'],
    ['missing start scene', (s) => (s.startSceneId = 'nowhere'), 'start scene nowhere missing'],
    ['scene not listed in its stage', (s) => (s.stages[0].sceneIds = ['triage']), 'contain: not listed in its stage'],
    ['@else that is never shown', (s) => {
      // contain's variant reads `analyzed`; make every triage choice set it, so the @else never shows.
      s.scenes[0].transitions.forEach((t) => (t.effects = [{ flag: 'analyzed', value: true }]))
    }, 'contain: # @if analyzed == True is never false, so its @else is never shown'],
    [
      'transition never taken',
      (s) => s.scenes[1].transitions.unshift({ when: [{ ref: { choice: 'isolate' }, op: '==', value: 'yes' }], effects: [], log: [], next: { scene: 'report' } }),
      'contain: transition 0 can never be taken',
    ],
  ] as [string, (s: Scenario) => void, string][])('reports %s', (_, edit, expected) => {
    expect(problemsOf(edit)).toContain(expected)
  })

  it('explores the values next to a number condition, so a branch reachable only there is taken', () => {
    // Only a value other than 0, 50 and 100 takes the first transition: 49 or 51 must be tried.
    const problems = problemsOf((s) => {
      s.scenes[1].editableFields = [{ name: 'isolate', type: 'number', min: 0, max: 100 }]
      s.stages[0].template = s.stages[0].template
        .replace('isolate = False', 'isolate = 0')
        .replace('        # 서버를 격리하려면', '        # isolate 범위: 0~100\n        # 서버를 격리하려면')
      s.scenes[1].transitions = [
        {
          when: [0, 50, 100].map((v) => ({ ref: { choice: 'isolate' }, op: '!=' as const, value: v })),
          effects: [{ flag: 'isolated', value: true }],
          log: [],
          next: { scene: 'report' },
        },
        { when: [], effects: [], log: [], next: { scene: 'report' } },
      ]
    })
    expect(problems).toEqual([])
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
