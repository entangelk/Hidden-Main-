import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Choice } from '../engine/types'
import { miniScenario as scenario } from '../scenario/mini'
import { ACTIVE_KEY, choose, cleanWorkspace, createSaver, readActive, restore, saveKey, snapshot, type KeyValueStore } from './save'

const fresh = { openFiles: ['main.py'], activeFile: 'main.py' }
const key = saveKey(scenario.id)
const memory = (initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } => {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] }
}
const c = (sceneId: string, values: Choice['values']): Choice => ({ sceneId, values })
const twoSteps = [c('triage', { action: 2 }), c('contain', { isolate: true })]
const saved = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    ...snapshot(
      scenario,
      { choices: twoSteps },
      { report: { action: '2' } },
      { openFiles: ['main.py', 'incidents/report.py'], activeFile: 'incidents/report.py' },
      new Date('2026-10-22T00:00:00Z'),
    ),
    ...over,
  })

describe('restore', () => {
  it('restores progress, edits and tabs from a save of the same version', () => {
    const r = restore(memory({ [key]: saved() }), scenario, fresh)
    expect(r.progress.choices).toEqual(twoSteps)
    expect(r.playerEdits).toEqual({ report: { action: '2' } })
    expect(r.workspace).toEqual({ openFiles: ['main.py', 'incidents/report.py'], activeFile: 'incidents/report.py' })
    expect(r.notice).toBeUndefined()
  })

  it('starts a new game without a notice when nothing is saved or storage is unavailable', () => {
    expect(restore(memory(), scenario, fresh)).toEqual({ progress: { choices: [] }, playerEdits: {}, workspace: fresh, notice: undefined })
    const throwing: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {},
      removeItem: () => {},
    }
    expect(restore(throwing, scenario, fresh).progress.choices).toEqual([])
    expect(restore(null, scenario, fresh).progress.choices).toEqual([])
  })

  it('starts over with a notice for corrupt JSON or another schema version', () => {
    for (const raw of ['{not json', saved({ schemaVersion: 2 }), saved({ progress: null }), 'null']) {
      const r = restore(memory({ [key]: raw }), scenario, fresh)
      expect(r.progress.choices).toEqual([])
      expect(r.workspace).toEqual(fresh)
      expect(r.notice).toContain('처음부터')
    }
  })

  it('treats valid JSON with a broken shape as corrupt instead of throwing (page must not go blank)', () => {
    const base = JSON.parse(saved())
    const broken = [
      { ...base, progress: { choices: [null] } },
      { ...base, progress: { choices: [{ sceneId: 'triage' }] } },
      { ...base, progress: { choices: [{ sceneId: 1, values: {} }] } },
      { ...base, progress: { choices: [{ sceneId: 'triage', values: { action: [1] } }] } },
      { ...base, workspace: { openFiles: 'main.py', activeFile: 'main.py' } },
      { ...base, workspace: { openFiles: [1], activeFile: null } },
      { ...base, workspace: null },
      { ...base, playerEdits: { report: { action: 2 } } },
      { ...base, playerEdits: [] },
      { ...base, scenarioVersion: '1' },
      [],
      42,
    ]
    for (const snap of broken) {
      const r = restore(memory({ [key]: JSON.stringify(snap) }), scenario, fresh)
      expect(r).toEqual({ progress: { choices: [] }, playerEdits: {}, workspace: fresh, notice: '저장된 진행을 읽을 수 없어 처음부터 시작합니다.' })
    }
  })

  it('accepts what the app itself writes: empty edits, no open tab, null active file (round trip)', () => {
    const own = snapshot(scenario, { choices: twoSteps }, {}, { openFiles: [], activeFile: null }, new Date())
    const r = restore(memory({ [key]: JSON.stringify(own) }), scenario, fresh)
    expect(r.notice).toBeUndefined()
    expect(r.progress.choices).toEqual(twoSteps)
    expect(r.playerEdits).toEqual({})
    expect(r.workspace).toEqual(fresh) // nothing open → the start file
    const fresh0 = snapshot(scenario, { choices: [] }, {}, fresh, new Date())
    expect(restore(memory({ [key]: JSON.stringify(fresh0) }), scenario, fresh).notice).toBeUndefined()
  })

  it('accepts decimal values in the shape check (they are valid number-field values)', () => {
    const raw = saved({ progress: { choices: [c('triage', { action: 2 }), c('contain', { isolate: 0.5 })] } })
    const r = restore(memory({ [key]: raw }), scenario, fresh)
    expect(r.notice).not.toContain('처음부터') // not treated as corrupt; replay stops at the bad value instead
    expect(r.progress.choices).toEqual([c('triage', { action: 2 })])
  })

  it('opens the start file when no saved tab survives (contract §8)', () => {
    const raw = saved({ workspace: { openFiles: ['gone.py'], activeFile: 'gone.py' } })
    expect(restore(memory({ [key]: raw }), scenario, fresh).workspace).toEqual(fresh)
  })

  it('a same-version save that no longer replays keeps the valid prefix with its own notice', () => {
    const raw = saved({ progress: { choices: [c('triage', { action: 2 }), c('contain', { isolate: true, extra: 1 })] } })
    const r = restore(memory({ [key]: raw }), scenario, fresh)
    expect(r.progress.choices).toEqual([c('triage', { action: 2 })])
    expect(r.playerEdits).toEqual({})
    expect(r.notice).toBe('저장된 진행 일부를 읽을 수 없어 그 앞까지만 이어갑니다.')
  })

  it('on a scenario version change keeps the replayable prefix, drops all edits, and cleans tabs', () => {
    const raw = saved({
      scenarioVersion: 0,
      progress: { choices: [c('triage', { action: 2 }), c('contain', { isolate: 'yes' }), c('report', { action: 1 })] },
    })
    const r = restore(memory({ [key]: raw }), scenario, fresh)
    expect(r.progress.choices).toEqual([c('triage', { action: 2 })])
    expect(r.playerEdits).toEqual({})
    // incidents/report.py is not unlocked at that point, so its tab goes.
    expect(r.workspace).toEqual({ openFiles: ['main.py'], activeFile: 'main.py' })
    expect(r.notice).toContain('되돌렸')
  })

  it('drops edits on a version change even when every choice still replays', () => {
    const r = restore(memory({ [key]: saved({ scenarioVersion: 0 }) }), scenario, fresh)
    expect(r.progress.choices).toEqual(twoSteps)
    expect(r.playerEdits).toEqual({})
    expect(r.notice).toBeUndefined()
  })
})

describe('cleanWorkspace', () => {
  it('keeps visible tabs in order and falls back to the first tab, then null', () => {
    expect(cleanWorkspace({ openFiles: ['a', 'x', 'b'], activeFile: 'x' }, ['a', 'b'])).toEqual({ openFiles: ['a', 'b'], activeFile: 'a' })
    expect(cleanWorkspace({ openFiles: ['a', 'b'], activeFile: 'b' }, ['a', 'b'])).toEqual({ openFiles: ['a', 'b'], activeFile: 'b' })
    expect(cleanWorkspace({ openFiles: ['x'], activeFile: 'x' }, ['a'])).toEqual({ openFiles: [], activeFile: null })
    expect(cleanWorkspace({ openFiles: ['a', 'a'], activeFile: 'a' }, ['a'])).toEqual({ openFiles: ['a'], activeFile: 'a' })
  })
})

describe('createSaver', () => {
  afterEach(() => vi.useRealTimers())
  const snap = (n: number) => snapshot(scenario, { choices: twoSteps.slice(0, n) }, {}, fresh, new Date(0))

  it('debounces: only the latest snapshot is written, after the delay', () => {
    vi.useFakeTimers()
    const store = memory()
    const saver = createSaver(store, key, 300)
    saver.schedule(snap(0))
    saver.schedule(snap(1))
    vi.advanceTimersByTime(299)
    expect(store.data[key]).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(JSON.parse(store.data[key]).progress.choices).toHaveLength(1)
  })

  it('flush (pagehide) writes a pending snapshot immediately and cancels the timer', () => {
    vi.useFakeTimers()
    const store = memory()
    const saver = createSaver(store, key, 300)
    saver.schedule(snap(2))
    saver.flush()
    expect(JSON.parse(store.data[key]).progress.choices).toHaveLength(2)
    store.data[key] = 'sentinel'
    vi.advanceTimersByTime(1000)
    expect(store.data[key]).toBe('sentinel') // no second write from the cancelled timer
  })

  it('saveNow writes at once; write failures are swallowed', () => {
    const store = memory()
    createSaver(store, key, 300).saveNow(snap(1))
    expect(JSON.parse(store.data[key]).progress.choices).toHaveLength(1)
    const failing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    }
    expect(() => createSaver(failing, key, 300).saveNow(snap(1))).not.toThrow()
  })
})

describe('shared files and scenario choice (SoT §3.7)', () => {
  const tabs = { openFiles: ['hub.py', 'main.py', 'gone.py'], activeFile: 'hub.py' }
  const saved = () => memory({ [key]: JSON.stringify(snapshot(scenario, { choices: [] }, {}, tabs, new Date(0))) })

  it('keeps tabs of shared files next to the scenario files, and only those (both directions)', () => {
    expect(restore(saved(), scenario, fresh, ['hub.py']).workspace).toEqual({ openFiles: ['hub.py', 'main.py'], activeFile: 'hub.py' })
    expect(restore(saved(), scenario, fresh).workspace).toEqual({ openFiles: ['main.py'], activeFile: 'main.py' })
  })

  it('remembers the chosen id and reads back only known ids', () => {
    const store = memory()
    choose(store, 'mini', false)
    expect(store.data[ACTIVE_KEY]).toBe('mini')
    expect(readActive(store, ['mini'])).toBe('mini')
    expect(readActive(store, ['other'])).toBeNull()
    expect(readActive(memory(), ['mini'])).toBeNull()
  })

  it('deletes only the chosen scenario save on restart, and keeps it otherwise', () => {
    const other = saveKey('other')
    const keep = memory({ [key]: 'x', [other]: 'y' })
    choose(keep, 'mini', false)
    expect(keep.data[key]).toBe('x')
    const wipe = memory({ [key]: 'x', [other]: 'y' })
    choose(wipe, 'mini', true)
    expect(wipe.data[key]).toBeUndefined()
    expect(wipe.data[other]).toBe('y')
  })

  it('never throws when storage is blocked', () => {
    const blocked: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readActive(blocked, ['mini'])).toBeNull()
    expect(() => choose(blocked, 'mini', true)).not.toThrow()
    expect(readActive(null, ['mini'])).toBeNull()
  })
})
