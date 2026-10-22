import { derive, validPrefix } from '../engine/derive'
import type { PlayerEdits, Progress, Scenario } from '../engine/types'

export const SCHEMA_VERSION = 1
export const saveKey = (scenarioId: string) => `incident-workspace:save:${scenarioId}`

export type WorkspaceView = {
  openFiles: string[]
  activeFile: string | null
}

export type SaveSnapshot = {
  schemaVersion: typeof SCHEMA_VERSION
  scenarioId: string
  scenarioVersion: number
  progress: Progress
  playerEdits: PlayerEdits
  workspace: WorkspaceView
  savedAt: string
}

/** The part of the Web Storage API the adapter uses (localStorage in the app, a fake in tests). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

export type Restored = {
  progress: Progress
  playerEdits: PlayerEdits
  workspace: WorkspaceView
  /** One Terminal line when the save could not be used as is. */
  notice?: string
}

/** Drops tabs for files that are not visible (data contract §8). */
export function cleanWorkspace(workspace: WorkspaceView, visibleFiles: string[]): WorkspaceView {
  const openFiles = workspace.openFiles.filter((f) => visibleFiles.includes(f))
  const activeFile =
    workspace.activeFile && openFiles.includes(workspace.activeFile) ? workspace.activeFile : (openFiles[0] ?? null)
  return { openFiles, activeFile }
}

/**
 * Reads the save for `scenario` (data contract §9). Never throws: unreadable or incompatible saves
 * fall back to a new game, with a notice line.
 */
export function restore(store: KeyValueStore | null, scenario: Scenario, fresh: WorkspaceView): Restored {
  const newGame = (notice?: string): Restored => ({ progress: { choices: [] }, playerEdits: {}, workspace: fresh, notice })
  let raw: string | null
  try {
    raw = store?.getItem(saveKey(scenario.id)) ?? null
  } catch {
    return newGame()
  }
  if (raw === null) return newGame()

  let snap: SaveSnapshot
  try {
    snap = JSON.parse(raw)
    if (snap?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(snap.progress?.choices)) throw new Error()
  } catch {
    return newGame('저장된 진행을 읽을 수 없어 처음부터 시작합니다.')
  }

  const sameVersion = snap.scenarioVersion === scenario.version
  const choices = validPrefix(scenario, snap.progress.choices)
  const visible = Object.keys(derive(scenario, { choices }).files)
  const workspace = cleanWorkspace(snap.workspace ?? fresh, visible)
  const restored: Restored = {
    progress: { choices },
    // Edits only make sense against the same scenario text; on a version change they start over.
    playerEdits: sameVersion && choices.length === snap.progress.choices.length ? (snap.playerEdits ?? {}) : {},
    workspace: workspace.openFiles.length ? workspace : fresh,
  }
  if (choices.length < snap.progress.choices.length) {
    restored.notice = '시나리오가 바뀌어 일부 진행을 되돌렸습니다.'
  }
  return restored
}

export function snapshot(scenario: Scenario, progress: Progress, playerEdits: PlayerEdits, workspace: WorkspaceView, now: Date): SaveSnapshot {
  return {
    schemaVersion: SCHEMA_VERSION,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    progress,
    playerEdits,
    workspace,
    savedAt: now.toISOString(),
  }
}

/**
 * Debounced writer. `schedule` replaces any pending snapshot; `flush` writes it now (run success,
 * `pagehide`). Write failures (private mode, quota) are ignored: the game keeps working unsaved.
 */
export function createSaver(store: KeyValueStore | null, key: string, delayMs: number) {
  let pending: SaveSnapshot | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    if (!pending) return
    const snap = pending
    pending = null
    try {
      store?.setItem(key, JSON.stringify(snap))
    } catch {
      // Saving is best effort (data contract §9).
    }
  }

  return {
    schedule(snap: SaveSnapshot) {
      pending = snap
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    saveNow(snap: SaveSnapshot) {
      pending = snap
      flush()
    },
    flush,
  }
}
