import { describe, expect, it } from 'vitest'
import type { Scenario } from '../../engine/types'
import { miniScenario } from '../../scenario/mini'
import { scenarios } from '../../scenario'
import { HUB_FILE, HUB_SCENE, hubView, runHub, statusOf } from './hub'

const two: Scenario[] = [miniScenario, { ...miniScenario, id: 'mini-2', title: 'Mini 2', summary: '두 번째.' }]

describe('hubView', () => {
  it('lists every scenario with its number and status, and marks the open one', () => {
    const { text } = hubView(two, ['playing', 'done'], 'mini-2')
    expect(text).toContain('    #   1. Mini — 엔진 테스트용 소형 시나리오. [진행 중]')
    expect(text).toContain('    #   2. Mini 2 — 두 번째. [완료, 지금 열림]')
    expect(text).not.toContain('{scenarios}')
  })

  it('inserts titles literally, even with replacement patterns or the preset line in them', () => {
    const odd: Scenario[] = [{ ...miniScenario, title: "$& $' $1", summary: 'scenario = 1' }, two[1]]
    const view = hubView(odd, ['new', 'new'], 'mini-2')
    expect(view.text).toContain("    #   1. $& $' $1 — scenario = 1 [새 게임]")
    expect(view.valueSlots.map((s) => view.text.slice(s.start, s.end))).toEqual(['2', 'False'])
  })

  it('preselects the open scenario, or 1 when none is open', () => {
    const shown = (activeId: string | null) => {
      const view = hubView(two, ['new', 'new'], activeId)
      return view.valueSlots.map((s) => view.text.slice(s.start, s.end))
    }
    expect(shown('mini-2')).toEqual(['2', 'False'])
    expect(shown(null)).toEqual(['1', 'False'])
  })

  it('exposes exactly the two hub slots', () => {
    const view = hubView(two, ['new', 'new'], null)
    expect(view.valueSlots.map((s) => [s.sceneId, s.field])).toEqual([
      [HUB_SCENE, 'scenario'],
      [HUB_SCENE, 'restart'],
    ])
  })
})

describe('runHub', () => {
  const view = hubView(two, ['new', 'new'], null)
  const edits = (scenario: string, restart = 'False') => ({ [HUB_SCENE]: { scenario, restart } })

  it('picks the chosen scenario (0-based) and the restart flag', () => {
    expect(runHub(view, edits('2'), 2)).toEqual({ lines: [], pick: { index: 1, restart: false } })
    expect(runHub(view, edits('1', 'True'), 2)).toEqual({ lines: [], pick: { index: 0, restart: true } })
    expect(runHub(view, {}, 2)).toEqual({ lines: [], pick: { index: 0, restart: false } })
  })

  it('rejects a number outside the list with a Traceback in main.py and picks nothing', () => {
    const result = runHub(view, edits('3'), 2)
    expect(result.pick).toBeUndefined()
    expect(result.lines.map((l) => l.text)).toEqual([
      `$ python ${HUB_FILE}`,
      'Traceback (most recent call last):',
      expect.stringMatching(/^ {2}File "main\.py", line \d+, in select_scenario$/),
      'ValueError: scenario 값은 1, 2 중 하나여야 합니다 (입력: 3)',
    ])
  })
})

describe('statusOf', () => {
  it('is new without choices, playing mid-way, done at an ending', () => {
    const c = (sceneId: string, values: Record<string, number | boolean>) => ({ sceneId, values })
    expect(statusOf(miniScenario, { choices: [] })).toBe('new')
    expect(statusOf(miniScenario, { choices: [c('triage', { action: 1 })] })).toBe('playing')
    const done = [c('triage', { action: 1 }), c('contain', { isolate: true }), c('report', { action: 1 })]
    expect(statusOf(miniScenario, { choices: done })).toBe('done')
  })
})

describe('app scenarios', () => {
  it('have unique ids, never use main.py or the hub key, and the list explains every number', () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length)
    for (const s of scenarios) {
      const paths = [...s.initialFiles.map((f) => f.path), ...s.stages.map((st) => st.filePath)]
      expect(paths).not.toContain(HUB_FILE)
      expect(s.scenes.map((x) => x.id)).not.toContain(HUB_SCENE)
    }
    const { text } = hubView(scenarios, scenarios.map(() => 'new'), null)
    const listed = [...text.matchAll(/^ {4}# {3}(\d+)\. /gm)].map((m) => Number(m[1]))
    expect(listed).toEqual(scenarios.map((_, i) => i + 1))
  })
})
