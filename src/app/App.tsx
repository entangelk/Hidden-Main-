import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { derive } from '../engine/derive'
import type { DerivedState, FileView, LogLine, PlayerEdits, Progress, Scenario, SceneId } from '../engine/types'
import {
  choose,
  createSaver,
  readActive,
  restore,
  saveKey,
  snapshot,
  type KeyValueStore,
  type Restored,
  type WorkspaceView,
} from '../persistence/save'
import { scenarios } from '../scenario'
import { CodeEditor } from '../ui/editor/CodeEditor'
import { Explorer } from '../ui/explorer/Explorer'
import { StatusBar } from '../ui/statusbar/StatusBar'
import { Tabs } from '../ui/tabs/Tabs'
import { Terminal } from '../ui/terminal/Terminal'
import { HUB_FILE, HUB_SCENE, hubView, runHub, statusOf, type HubStatus } from './hub/hub'
import { runScene } from './run'
import './App.css'

const startFileOf = (scenario: Scenario) =>
  scenario.stages.find((st) => st.sceneIds.includes(scenario.startSceneId))!.filePath
// A chosen scenario opens its first incident file next to main.py.
const freshWorkspace = (scenario: Scenario): WorkspaceView => ({
  openFiles: [HUB_FILE, startFileOf(scenario)],
  activeFile: startFileOf(scenario),
})
const restoreOf = (storage: KeyValueStore | null, scenario: Scenario) =>
  restore(storage, scenario, freshWorkspace(scenario), [HUB_FILE])
// Before any scenario is chosen there is only main.py.
const LOBBY: Restored = { progress: { choices: [] }, playerEdits: {}, workspace: { openFiles: [HUB_FILE], activeFile: HUB_FILE } }
const NO_STATE: DerivedState = { currentSceneId: null, flags: {}, ending: null, log: [], files: {} }

function browserStorage(): KeyValueStore | null {
  try {
    return window.localStorage
  } catch {
    return null // storage blocked: play without saving
  }
}

const info = (text: string): LogLine => ({ level: 'info', text })

type Selection = { id: string | null; intro: LogLine[]; generation: number }

/** Holds which scenario is open; a new choice remounts the workspace from that scenario's save. */
export default function App() {
  const [storage] = useState(browserStorage)
  const [selection, setSelection] = useState<Selection>(() => ({
    id: readActive(storage, scenarios.map((s) => s.id)),
    intro: [],
    generation: 0,
  }))
  const onChoose = useCallback(
    (id: string, intro: LogLine[]) => setSelection((prev) => ({ id, intro, generation: prev.generation + 1 })),
    [],
  )
  return (
    <Workspace
      key={selection.generation}
      storage={storage}
      scenario={scenarios.find((s) => s.id === selection.id) ?? null}
      intro={selection.intro}
      onChoose={onChoose}
    />
  )
}

/** Transient Terminal output (notices, errors) shown after the first `at` lines of the log. */
type TransientLine = { at: number; line: LogLine }

type WorkspaceProps = {
  storage: KeyValueStore | null
  /** null until a scenario is chosen in main.py. */
  scenario: Scenario | null
  /** Lines from the main.py run that opened this scenario. */
  intro: LogLine[]
  onChoose: (id: string, intro: LogLine[]) => void
}

function Workspace({ storage, scenario, intro, onChoose }: WorkspaceProps) {
  const [initial] = useState(() => (scenario ? restoreOf(storage, scenario) : LOBBY))
  // Statuses of the other scenarios as saved when this workspace opened; the open one's is live.
  const [savedStatuses] = useState<HubStatus[]>(() =>
    scenarios.map((s) => (s === scenario ? 'new' : statusOf(s, restoreOf(storage, s).progress))),
  )

  const [progress, setProgress] = useState<Progress>(initial.progress)
  const [edits, setEdits] = useState<PlayerEdits>(initial.playerEdits)
  // main.py's values: kept while the workspace is open, never saved.
  const [hubEdits, setHubEdits] = useState<Record<string, string>>({})
  // Mirrors of progress and edits, updated synchronously: a run fired right after a keystroke, or
  // a second run fired before React re-renders, must see the latest values.
  const progressRef = useRef(initial.progress)
  const editsRef = useRef<PlayerEdits>({ ...initial.playerEdits, [HUB_SCENE]: {} })
  const updateEdits = useCallback((change: (prev: PlayerEdits) => PlayerEdits) => {
    const { [HUB_SCENE]: hub, ...rest } = editsRef.current
    const next = change(rest)
    editsRef.current = { ...next, [HUB_SCENE]: hub }
    setEdits(next)
  }, [])
  const [openFiles, setOpenFiles] = useState<string[]>(initial.workspace.openFiles)
  const [activeFile, setActiveFile] = useState<string | null>(initial.workspace.activeFile)
  const [transient, setTransient] = useState<TransientLine[]>(() => [
    ...intro.map((line) => ({ at: 0, line })),
    ...(initial.notice ? [{ at: 0, line: { level: 'warn' as const, text: initial.notice } }] : []),
  ])

  const state = useMemo(() => (scenario ? derive(scenario, progress) : NO_STATE), [scenario, progress])
  const hub = useMemo(
    () =>
      hubView(
        scenarios,
        scenarios.map((s, i) => (s === scenario ? statusOf(s, progress) : savedStatuses[i])),
        scenario?.id ?? null,
      ),
    [scenario, progress, savedStatuses],
  )
  const files = useMemo<Record<string, FileView>>(() => ({ [HUB_FILE]: hub, ...state.files }), [hub, state])
  const shownEdits = useMemo<PlayerEdits>(() => ({ ...edits, [HUB_SCENE]: hubEdits }), [edits, hubEdits])

  // A file is modified while its current scene holds a value different from the template's.
  const dirtyFiles = useMemo(() => {
    const dirty = new Set<string>()
    for (const [path, view] of Object.entries(files)) {
      if (view.valueSlots.some((s) => (shownEdits[s.sceneId]?.[s.field] ?? s.defaultLiteral) !== s.defaultLiteral)) {
        dirty.add(path)
      }
    }
    return dirty
  }, [files, shownEdits])

  const terminalLines = useMemo(() => {
    const out: LogLine[] = []
    state.log.forEach((line, i) => {
      for (const t of transient) if (t.at === i) out.push(t.line)
      out.push(line)
    })
    for (const t of transient) if (t.at >= state.log.length) out.push(t.line)
    return out
  }, [state, transient])

  // Saving (data contract §9): progress right away, edits and tabs debounced, everything on pagehide.
  const saver = useMemo(() => (scenario ? createSaver(storage, saveKey(scenario.id), 400) : null), [storage, scenario])
  const workspace = useMemo(() => ({ openFiles, activeFile }), [openFiles, activeFile])
  const latest = useRef({ edits, workspace })
  useEffect(() => {
    latest.current = { edits, workspace }
  })
  // Writes the newest state from the refs: an edit typed just before leaving may not have reached
  // the debounced snapshot yet (its effect runs after the next paint).
  const saveLatest = useCallback(() => {
    if (!scenario || !saver) return
    const { [HUB_SCENE]: _hub, ...sceneEdits } = editsRef.current
    saver.saveNow(snapshot(scenario, progressRef.current, sceneEdits, latest.current.workspace, new Date()))
  }, [scenario, saver])
  useEffect(() => {
    if (scenario && saver) saver.saveNow(snapshot(scenario, progress, latest.current.edits, latest.current.workspace, new Date()))
  }, [scenario, saver, progress])
  useEffect(() => {
    if (scenario && saver) saver.schedule(snapshot(scenario, progressRef.current, edits, workspace, new Date()))
  }, [scenario, saver, edits, workspace])
  useEffect(() => {
    window.addEventListener('pagehide', saveLatest)
    return () => window.removeEventListener('pagehide', saveLatest)
  }, [saveLatest])

  const onEdit = useCallback(
    (sceneId: SceneId, field: string, literal: string) => {
      if (sceneId === HUB_SCENE) {
        const hubValues = { ...editsRef.current[HUB_SCENE], [field]: literal }
        editsRef.current = { ...editsRef.current, [HUB_SCENE]: hubValues }
        setHubEdits(hubValues)
        return
      }
      updateEdits((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], [field]: literal } }))
    },
    [updateEdits],
  )

  const say = useCallback(
    (lines: LogLine[]) => {
      if (!lines.length) return
      const at = scenario ? derive(scenario, progressRef.current).log.length : 0
      setTransient((prev) => [...prev, ...lines.map((line) => ({ at, line }))])
    },
    [scenario],
  )

  const runMain = useCallback(() => {
    const result = runHub(hub, editsRef.current, scenarios.length)
    say(result.lines)
    if (!result.pick) return
    const { index, restart } = result.pick
    const target = scenarios[index]
    // Save this scenario first: with restart on the same scenario, the wipe must come after it.
    saveLatest()
    const before = target === scenario ? statusOf(target, progressRef.current) : savedStatuses[index]
    choose(storage, target.id, restart)
    const how = restart ? '저장을 지우고 처음부터 시작' : before === 'new' ? '새로 시작' : '이어서 진행'
    onChoose(target.id, [info(`$ python ${HUB_FILE}`), info(`[workspace] ${target.title} — ${how}`)])
  }, [hub, say, saveLatest, scenario, savedStatuses, storage, onChoose])

  const run = useCallback(() => {
    if (activeFile === HUB_FILE) return runMain()
    if (!scenario) return say([info(`${HUB_FILE}에서 시나리오를 골라 실행하세요.`)])
    const before = progressRef.current
    const result = runScene(scenario, before, editsRef.current, activeFile)
    say(result.lines)
    if (!result.progress) return
    const solved = result.progress.choices.at(-1)!.sceneId
    progressRef.current = result.progress
    setProgress(result.progress)
    updateEdits((prev) => {
      const rest = { ...prev }
      delete rest[solved]
      return rest
    })
  }, [activeFile, scenario, runMain, say, updateEdits])

  // Ctrl/Cmd+Enter outside the editor. Inside it, Monaco's command handles the key and stops
  // the event, so it never reaches this listener.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      run()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [run])

  const open = (path: string) => {
    setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActiveFile(path)
  }

  const close = (path: string) => {
    const index = openFiles.indexOf(path)
    const remaining = openFiles.filter((p) => p !== path)
    setOpenFiles(remaining)
    if (path === activeFile) setActiveFile(remaining[Math.min(index, remaining.length - 1)] ?? null)
  }

  return (
    <div className="workbench">
      <Explorer paths={Object.keys(files)} activeFile={activeFile} onOpen={open} />
      <main className="editor-group">
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          dirtyFiles={dirtyFiles}
          onSelect={setActiveFile}
          onClose={close}
        />
        <CodeEditor
          files={files}
          edits={shownEdits}
          revision={progress.choices.length}
          activeFile={activeFile}
          onEdit={onEdit}
          onRun={run}
        />
        <Terminal lines={terminalLines} />
      </main>
      <StatusBar activeFile={activeFile} />
    </div>
  )
}
