import { describe, expect, it } from 'vitest'
import { derive } from '../engine/derive'
import type { Progress } from '../engine/types'
import { miniScenario as scenario } from '../scenario/mini'
import { runScene } from './run'

const start = { choices: [] }
const text = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text)

describe('runScene', () => {
  it('solves the current scene with the edited value (no transient lines; the log comes from derive)', () => {
    const r = runScene(scenario, start, { triage: { action: '2' } }, 'main.py')
    expect(r.lines).toEqual([])
    expect(r.progress).toEqual({ choices: [{ sceneId: 'triage', values: { action: 2 } }] })
  })

  it('uses the template default when the value was not edited', () => {
    expect(runScene(scenario, start, {}, 'main.py').progress?.choices[0].values).toEqual({ action: 1 })
  })

  it('reports invalid values with the line number and leaves progress alone (AC-07)', () => {
    const r = runScene(scenario, start, { triage: { action: '4' } }, 'main.py')
    expect(r.progress).toBeUndefined()
    expect(text(r)).toEqual([
      '$ python main.py',
      'Traceback (most recent call last):',
      '  File "main.py", line 18, in triage_alert',
      'ValueError: action 값은 1, 2, 3 중 하나여야 합니다 (입력: 4)',
    ])
    expect(r.lines.slice(1).every((l) => l.level === 'error')).toBe(true)
  })

  it('only names the file to run from another tab or with no tab (SoT §3.5)', () => {
    expect(runScene(scenario, start, {}, 'config/settings.py')).toEqual({
      lines: [{ level: 'info', text: '실행할 파일: main.py (현재 탭: config/settings.py)' }],
    })
    expect(text(runScene(scenario, start, {}, null))).toEqual(['실행할 파일: main.py'])
  })

  it('follows next_file() from a file play has left, and only from there (SoT §3.5)', () => {
    const left: Progress = { choices: [{ sceneId: 'triage', values: { action: 1 } }, { sceneId: 'contain', values: { isolate: true } }] }
    expect(runScene(scenario, left, {}, 'main.py')).toEqual({
      lines: [{ level: 'info', text: '[workspace] main.py: next_file() → incidents/report.py' }],
      open: 'incidents/report.py',
    })
    // The file play is in still runs its scene; a file with no pointer still only names the file.
    expect(runScene(scenario, left, {}, 'incidents/report.py').progress?.choices).toHaveLength(3)
    expect(runScene(scenario, left, {}, 'config/settings.py').open).toBeUndefined()
    // Before play leaves, main.py has no pointer and runs its scene.
    expect(runScene(scenario, start, {}, 'main.py').open).toBeUndefined()
  })

  it('runs a later function of the same file once it is current', () => {
    const p = runScene(scenario, start, {}, 'main.py').progress!
    const r = runScene(scenario, p, { contain: { isolate: 'True' } }, 'main.py')
    expect(r.progress?.choices.at(-1)).toEqual({ sceneId: 'contain', values: { isolate: true } })
  })

  it('a second run on the updated progress does not solve the same scene again', () => {
    const p = runScene(scenario, start, {}, 'main.py').progress!
    const again = runScene(scenario, p, {}, 'main.py')
    expect(again.progress?.choices.map((c) => c.sceneId)).toEqual(['triage', 'contain'])
  })

  it('changes nothing when the engine refuses a value the parser accepted (no transition matches)', () => {
    const stuck = {
      ...scenario,
      scenes: scenario.scenes.map((s) =>
        s.id === 'triage' ? { ...s, transitions: s.transitions.filter((t) => t.when.length > 0) } : s,
      ),
    }
    // action 3 parses (allowed option) but only the default transition handled it; without it apply refuses.
    expect(runScene(stuck, start, { triage: { action: '3' } }, 'main.py')).toEqual({ lines: [] })
  })

  it('after an ending only prints a notice', () => {
    let p = start as { choices: { sceneId: string; values: Record<string, number | boolean | string> }[] }
    p = runScene(scenario, p, {}, 'main.py').progress!
    p = runScene(scenario, p, {}, 'main.py').progress!
    p = runScene(scenario, p, {}, 'incidents/report.py').progress!
    expect(derive(scenario, p).ending).toBe('escalated')
    expect(runScene(scenario, p, {}, 'incidents/report.py')).toEqual({
      lines: [{ level: 'info', text: '처리할 사건이 없습니다.' }],
    })
  })
})
