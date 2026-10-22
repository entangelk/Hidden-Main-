import { describe, expect, it } from 'vitest'
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
