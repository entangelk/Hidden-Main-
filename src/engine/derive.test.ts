import { describe, expect, it } from 'vitest'
import { miniScenario as scenario } from '../scenario/mini'
import { apply, derive, validPrefix } from './derive'
import type { Choice, Progress, Scenario } from './types'

const c = (sceneId: string, values: Choice['values']): Choice => ({ sceneId, values })
const at = (...choices: Choice[]): Progress => ({ choices })
const texts = (p: Progress) => derive(scenario, p).log.map((l) => l.text)

describe('derive — start', () => {
  const st = derive(scenario, at())

  it('starts at the start scene with the initial files and the first stage only', () => {
    expect(st.currentSceneId).toBe('triage')
    expect(Object.keys(st.files).sort()).toEqual(['config/settings.py', 'main.py'])
    expect(st.ending).toBeNull()
    expect(st.log).toEqual([])
  })

  it('shows only the reached function of a stage file (later functions are hidden, DB-03)', () => {
    const main = st.files['main.py'].text
    expect(main).toContain('def triage_alert')
    expect(main).not.toContain('def contain')
    expect(main).toContain('if __name__ == "__main__":')
    expect(main).not.toMatch(/\n\n\n\n/) // removing the hidden function leaves no extra gap
  })

  it('exposes the current scene slot only', () => {
    const view = st.files['main.py']
    expect(view.valueSlots.map((s) => [s.sceneId, s.field, view.text.slice(s.start, s.end)])).toEqual([
      ['triage', 'action', '1'],
    ])
    expect(st.files['config/settings.py'].valueSlots).toEqual([])
  })
})

describe('derive — transitions, flags and reveal', () => {
  it('takes the first matching transition, sets flags, and appends the next function to the same file', () => {
    const st = derive(scenario, at(c('triage', { action: 1 })))
    expect(st.currentSceneId).toBe('contain')
    expect(st.flags).toEqual({ analyzed: true })
    const main = st.files['main.py'].text
    expect(main.indexOf('def triage_alert')).toBeLessThan(main.indexOf('def contain'))
    expect(main).toContain('        action = 1\n') // solved value shown fixed
    expect(st.files['main.py'].valueSlots.map((s) => s.sceneId)).toEqual(['contain'])
    expect(texts(at(c('triage', { action: 1 })))).toEqual([
      '$ python main.py',
      '[02:14:07] 접근 기록 분석 시작',
      '[02:14:09] 외부 전송 412MB — 출발지 10.0.2.14',
      '[workspace] main.py: contain() 추가됨',
    ])
  })

  it('falls through to the default transition when no earlier condition holds', () => {
    const st = derive(scenario, at(c('triage', { action: 3 })))
    expect(st.flags).toEqual({})
    expect(st.log.find((l) => l.level === 'warn')?.text).toContain('같은 경보')
  })

  it('resolves comment variants with the flags at the moment the scene was reached (DB-01)', () => {
    const analyzed = derive(scenario, at(c('triage', { action: 1 }))).files['main.py'].text
    expect(analyzed).toContain('출발지 10.0.2.14를 찾아냈다')
    expect(analyzed).not.toContain('출발지를 아직 모른다')
    expect(analyzed).not.toContain('@if')
    expect(analyzed).not.toContain('@end')
    const unknown = derive(scenario, at(c('triage', { action: 3 }))).files['main.py'].text
    expect(unknown).toContain('출발지를 아직 모른다')
    expect(unknown).not.toContain('찾아냈다')
  })

  it('unlocks a new stage file only when its scene is reached, and announces it', () => {
    const p = at(c('triage', { action: 2 }), c('contain', { isolate: false }))
    const st = derive(scenario, p)
    expect(st.currentSceneId).toBe('report')
    expect(Object.keys(st.files)).toContain('incidents/report.py')
    expect(texts(p).at(-1)).toBe('[workspace] incidents/report.py 생성됨')
    expect(st.files['incidents/report.py'].text).toContain('서버는 격리되었다') // isolated by triage action 2
  })
})

describe('derive — solved values and flag timing', () => {
  it('shows a solved value as chosen, not the template default', () => {
    const main = derive(scenario, at(c('triage', { action: 2 }))).files['main.py'].text
    expect(main).toContain('        action = 2\n')
    expect(main).not.toContain('        action = 1\n')
  })

  // A small inline scenario where a flag changes after a scene is shown and is set twice.
  const timing: Scenario = {
    id: 't',
    title: 't',
    summary: '',
    version: 1,
    initialFiles: [],
    stages: [
      {
        id: 's',
        filePath: 'f.py',
        template: [
          'class T:',
          '',
          '    def a(self):',
          '        x = 1',
          '',
          '    def b(self):',
          '        # @if seen == True',
          '        # seen before',
          '        # @else',
          '        # first time',
          '        # @end',
          '        x = 1',
          '',
          '    def c(self):',
          '        x = 1',
          '',
        ].join('\n'),
        sceneIds: ['a', 'b', 'c'],
      },
    ],
    scenes: (['a', 'b', 'c'] as const).map((id, i) => ({
      id,
      stageId: 's',
      functionName: id,
      editableFields: [{ name: 'x', type: 'int' as const, options: [1] }],
      transitions: [
        {
          when: [],
          effects: [
            { flag: 'level', value: i + 1 },
            ...(id === 'b' ? [{ flag: 'seen', value: true }] : []),
          ],
          log: [],
          next: id === 'c' ? { ending: 'end' } : { scene: id === 'a' ? 'b' : 'c' },
        },
      ],
    })),
    endings: [{ id: 'end', log: [] }],
    startSceneId: 'a',
  }

  it('keeps a comment variant as it was when the scene was reached, even after the flag changes', () => {
    const shown = derive(timing, at(c('a', { x: 1 }))).files['f.py'].text
    expect(shown).toContain('# first time')
    const later = derive(timing, at(c('a', { x: 1 }), c('b', { x: 1 }))) // b sets seen = True
    expect(later.flags.seen).toBe(true)
    expect(later.files['f.py'].text).toContain('# first time')
    expect(later.files['f.py'].text).not.toContain('# seen before')
  })

  it('a later effect overwrites an earlier value of the same flag', () => {
    expect(derive(timing, at(c('a', { x: 1 }))).flags.level).toBe(1)
    expect(derive(timing, at(c('a', { x: 1 }), c('b', { x: 1 }))).flags.level).toBe(2)
  })
})

describe('derive — pointer to the next file (architecture §5.2)', () => {
  const left = at(c('triage', { action: 1 }), c('contain', { isolate: true }))

  it('adds next_file() below the last function of the file play just left, pointing at the new file', () => {
    const main = derive(scenario, left).files['main.py'].text
    expect(main).toContain('    def next_file(self):\n')
    expect(main).toContain('return "incidents/report.py"')
    // Inside the class, right after contain(), before the module code at the bottom.
    expect(main.indexOf('return monitor.contain(isolate)')).toBeLessThan(main.indexOf('def next_file'))
    expect(main.indexOf('def next_file')).toBeLessThan(main.indexOf('if __name__'))
    expect(main).toMatch(/return monitor\.contain\(isolate\)\n\n    def next_file/)
  })

  it('does not add it while play is still in the file, nor to the file play moved into, nor at an ending', () => {
    expect(derive(scenario, at(c('triage', { action: 1 }))).files['main.py'].text).not.toContain('next_file')
    expect(derive(scenario, left).files['incidents/report.py'].text).not.toContain('next_file')
    const ended = derive(scenario, at(...left.choices, c('report', { action: 1 })))
    expect(ended.files['incidents/report.py'].text).not.toContain('next_file')
    expect(ended.files['main.py'].text.match(/def next_file/g)).toHaveLength(1)
  })

  it('lists the pointer in handoffs (from the left file to the new one), and nothing before', () => {
    expect(derive(scenario, left).handoffs).toEqual({ 'main.py': 'incidents/report.py' })
    expect(derive(scenario, at(c('triage', { action: 1 }))).handoffs).toEqual({})
  })

  it('leaves the new file\'s slots where they are', () => {
    const view = derive(scenario, left).files['incidents/report.py']
    expect(view.valueSlots.map((s) => view.text.slice(s.start, s.end))).toEqual(['1'])
  })
})

describe('derive — retries in a search scene (SoT §3.8)', () => {
  // triage becomes a search scene: action 3 is the miss, two runs in all.
  const search: Scenario = structuredClone(scenario)
  search.scenes[0].attempts = 2
  search.scenes[0].transitions[2].miss = true
  const miss = c('triage', { action: 3 })

  it('stays on the scene after a miss with runs left: log plus a retry line, nothing else changes', () => {
    const st = derive(search, at(miss))
    expect(st.currentSceneId).toBe('triage')
    expect(st.missesOnCurrent).toBe(1)
    expect(st.flags).toEqual({})
    expect(st.files['main.py'].text).not.toContain('def contain')
    expect(st.files['main.py'].valueSlots.map((s) => s.sceneId)).toEqual(['triage'])
    expect(st.log.map((l) => l.text).slice(-1)).toEqual(['[workspace] triage_alert(): 남은 기회 1번. 다른 값으로 다시 실행할 수 있다.'])
  })

  it('takes the miss like any transition on the last run, and says so', () => {
    const st = derive(search, at(miss, miss))
    expect(st.currentSceneId).toBe('contain')
    expect(st.missesOnCurrent).toBe(0)
    expect(st.log.map((l) => l.text)).toContain('[workspace] triage_alert(): 기회를 다 썼다. 다음으로 넘어간다.')
  })

  it('advances on a hit after a miss, and on a first-run hit (over-strict guard)', () => {
    const afterMiss = derive(search, at(miss, c('triage', { action: 1 })))
    expect(afterMiss.currentSceneId).toBe('contain')
    expect(afterMiss.flags).toEqual({ analyzed: true })
    expect(afterMiss.missesOnCurrent).toBe(0)
    expect(derive(search, at(c('triage', { action: 1 }))).currentSceneId).toBe('contain')
  })

  it('ignores miss on a scene without attempts (it then advances at once)', () => {
    const plain: Scenario = structuredClone(scenario)
    plain.scenes[0].transitions[2].miss = true
    expect(derive(plain, at(miss)).currentSceneId).toBe('contain')
  })

  it('replays a save with misses the same way (apply accepts the retry)', () => {
    const once = apply(search, at(), miss)
    expect(once.choices).toHaveLength(1)
    expect(apply(search, once, miss).choices).toHaveLength(2)
  })
})

describe('derive — endings', () => {
  it('reaches "contained" only when isolated and reporting as closed', () => {
    const st = derive(scenario, at(c('triage', { action: 1 }), c('contain', { isolate: true }), c('report', { action: 1 })))
    expect(st.ending).toBe('contained')
    expect(st.currentSceneId).toBeNull()
    expect(st.log.at(-1)?.text).toBe('사건 종결. 전송은 멈췄다.')
    expect(Object.values(st.files).every((f) => f.valueSlots.length === 0)).toBe(true)
  })

  it('reaches "escalated" otherwise (both the flag and the choice matter)', () => {
    const notIsolated = derive(scenario, at(c('triage', { action: 1 }), c('contain', { isolate: false }), c('report', { action: 1 })))
    expect(notIsolated.ending).toBe('escalated')
    const handedOver = derive(scenario, at(c('triage', { action: 2 }), c('contain', { isolate: true }), c('report', { action: 2 })))
    expect(handedOver.ending).toBe('escalated')
  })
})

describe('apply', () => {
  const start = at()

  it('appends a choice for the current scene', () => {
    expect(apply(scenario, start, c('triage', { action: 2 }))).toEqual(at(c('triage', { action: 2 })))
  })

  it('returns the same progress for a choice of another scene, wrong values, or after the end (AC-07)', () => {
    expect(apply(scenario, start, c('contain', { isolate: true }))).toBe(start)
    expect(apply(scenario, start, c('triage', { action: 9 }))).toBe(start)
    expect(apply(scenario, start, c('triage', { action: '1' }))).toBe(start)
    expect(apply(scenario, start, c('triage', {}))).toBe(start)
    const ended = at(c('triage', { action: 1 }), c('contain', { isolate: true }), c('report', { action: 1 }))
    expect(apply(scenario, ended, c('report', { action: 1 }))).toBe(ended)
  })
})

describe('replay', () => {
  it('renders a CRLF template exactly like its LF version', () => {
    const crlf = {
      ...scenario,
      stages: scenario.stages.map((st) => ({ ...st, template: st.template.replace(/\n/g, '\r\n') })),
      initialFiles: scenario.initialFiles.map((f) => ({ ...f, content: f.content.replace(/\n/g, '\r\n') })),
    }
    const p = at(c('triage', { action: 1 }))
    expect(derive(crlf, p)).toEqual(derive(scenario, p))
  })

  it('is deterministic: the same choices give the same state', () => {
    const p = at(c('triage', { action: 1 }), c('contain', { isolate: true }))
    expect(derive(scenario, p)).toEqual(derive(scenario, structuredClone(p)))
  })

  it('validPrefix keeps the choices that still replay and drops the rest from the first bad one', () => {
    const good = [c('triage', { action: 1 }), c('contain', { isolate: true })]
    expect(validPrefix(scenario, good)).toEqual(good)
    expect(validPrefix(scenario, [...good, c('missing', { action: 1 }), c('report', { action: 1 })])).toEqual(good)
    expect(validPrefix(scenario, [c('triage', { action: 7 }), ...good.slice(1)])).toEqual([])
    // A field the scenario no longer has also stops the replay at that choice.
    expect(validPrefix(scenario, [good[0], c('contain', { isolate: true, extra: 1 })])).toEqual([good[0]])
  })
})
