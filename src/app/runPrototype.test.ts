import { describe, expect, it } from 'vitest'
import { runPrototype } from './runPrototype'

describe('runPrototype', () => {
  it('solves the current scene with a valid value and announces the new file', () => {
    const r = runPrototype([], { triage: { action: '2' } }, 'main.py')
    expect(r.choice).toEqual({ sceneId: 'triage', values: { action: 2 } })
    expect(r.lines[0]).toBe('$ python main.py')
    expect(r.lines.at(-1)).toBe('[workspace] event_002.py 생성됨')
  })

  it('uses the template default when the value was not edited', () => {
    expect(runPrototype([], {}, 'main.py').choice).toEqual({ sceneId: 'triage', values: { action: 1 } })
  })

  it('returns no choice for an invalid value, with a traceback that names the line', () => {
    const r = runPrototype([], { triage: { action: '4' } }, 'main.py')
    expect(r.choice).toBeUndefined()
    expect(r.lines).toEqual([
      '$ python main.py',
      'Traceback (most recent call last):',
      '  File "main.py", line 18, in triage_alert',
      'ValueError: action 값은 1, 2, 3 중 하나여야 합니다 (입력: 4)',
    ])
  })

  it('only prints the file to run when another tab is active (no choice)', () => {
    expect(runPrototype([], {}, 'other.py')).toEqual({ lines: ['실행할 파일: main.py (현재 탭: other.py)'] })
    expect(runPrototype([], {}, null)).toEqual({ lines: ['실행할 파일: main.py'] })
  })

  it('a second run on the updated record does not solve the same scene again', () => {
    const first = runPrototype([], {}, 'main.py')
    const second = runPrototype([first.choice!], {}, 'main.py')
    expect(second).toEqual({ lines: ['실행할 파일: event_002.py (현재 탭: main.py)'] })
  })

  it('only prints a notice once every scene is solved', () => {
    const choices = [
      { sceneId: 'triage', values: { action: 1 } },
      { sceneId: 'trace', values: { action: 1 } },
    ]
    expect(runPrototype(choices, {}, 'event_002.py')).toEqual({ lines: ['처리할 사건이 없습니다.'] })
  })
})
