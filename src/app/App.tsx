import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { derive } from '../engine/derive'
import type { LogLine, PlayerEdits, Progress, SceneId } from '../engine/types'
import { createSaver, restore, saveKey, snapshot, type KeyValueStore, type WorkspaceView } from '../persistence/save'
import { incident0214 } from '../scenario/incident-0214'
import { CodeEditor } from '../ui/editor/CodeEditor'
import { Explorer } from '../ui/explorer/Explorer'
import { StatusBar } from '../ui/statusbar/StatusBar'
import { Tabs } from '../ui/tabs/Tabs'
import { Terminal } from '../ui/terminal/Terminal'
import { runScene } from './run'
import './App.css'

const scenario = incident0214
const startFile = scenario.stages.find((st) => st.sceneIds.includes(scenario.startSceneId))!.filePath
// A new game opens the instructions in main.py next to the first incident file.
const freshWorkspace: WorkspaceView = { openFiles: ['main.py', startFile], activeFile: 'main.py' }

function browserStorage(): KeyValueStore | null {
  try {
    return window.localStorage
  } catch {
    return null // storage blocked: play without saving
  }
}

/** Transient Terminal output (notices, errors) shown after the first `at` lines of the log. */
type TransientLine = { at: number; line: LogLine }

export default function App() {
  const [storage] = useState(browserStorage)
  const [initial] = useState(() => restore(storage, scenario, freshWorkspace))

  const [progress, setProgress] = useState<Progress>(initial.progress)
  const [edits, setEdits] = useState<PlayerEdits>(initial.playerEdits)
  // Mirrors of progress and edits, updated synchronously: a run fired right after a keystroke, or
  // a second run fired before React re-renders, must see the latest values.
  const progressRef = useRef(initial.progress)
  const editsRef = useRef(initial.playerEdits)
  const updateEdits = useCallback((change: (prev: PlayerEdits) => PlayerEdits) => {
    editsRef.current = change(editsRef.current)
    setEdits(editsRef.current)
  }, [])
  const [openFiles, setOpenFiles] = useState<string[]>(initial.workspace.openFiles)
  const [activeFile, setActiveFile] = useState<string | null>(initial.workspace.activeFile)
  const [transient, setTransient] = useState<TransientLine[]>(() =>
    initial.notice ? [{ at: 0, line: { level: 'warn', text: initial.notice } }] : [],
  )

  const state = useMemo(() => derive(scenario, progress), [progress])
  // A file is modified while its current scene holds a value different from the template's.
  const dirtyFiles = useMemo(() => {
    const dirty = new Set<string>()
    for (const [path, view] of Object.entries(state.files)) {
      if (view.valueSlots.some((s) => (edits[s.sceneId]?.[s.field] ?? s.defaultLiteral) !== s.defaultLiteral)) {
        dirty.add(path)
      }
    }
    return dirty
  }, [state, edits])

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
  const saver = useMemo(() => createSaver(storage, saveKey(scenario.id), 400), [storage])
  const workspace = useMemo(() => ({ openFiles, activeFile }), [openFiles, activeFile])
  const latest = useRef({ edits, workspace })
  useEffect(() => {
    latest.current = { edits, workspace }
  })
  useEffect(() => {
    saver.saveNow(snapshot(scenario, progress, latest.current.edits, latest.current.workspace, new Date()))
  }, [saver, progress])
  useEffect(() => {
    saver.schedule(snapshot(scenario, progressRef.current, edits, workspace, new Date()))
  }, [saver, edits, workspace])
  // On leaving the page, write the newest state from the refs: an edit typed just before a reload
  // may not have reached the debounced snapshot yet (its effect runs after the next paint).
  useEffect(() => {
    const onPageHide = () =>
      saver.saveNow(snapshot(scenario, progressRef.current, editsRef.current, latest.current.workspace, new Date()))
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [saver])

  const onEdit = useCallback(
    (sceneId: SceneId, field: string, literal: string) =>
      updateEdits((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], [field]: literal } })),
    [updateEdits],
  )

  const run = useCallback(() => {
    const before = progressRef.current
    const result = runScene(scenario, before, editsRef.current, activeFile)
    if (result.lines.length) {
      const at = derive(scenario, before).log.length
      setTransient((prev) => [...prev, ...result.lines.map((line) => ({ at, line }))])
    }
    if (!result.progress) return
    const solved = result.progress.choices.at(-1)!.sceneId
    progressRef.current = result.progress
    setProgress(result.progress)
    updateEdits((prev) => {
      const rest = { ...prev }
      delete rest[solved]
      return rest
    })
  }, [activeFile, updateEdits])

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
      <Explorer paths={Object.keys(state.files)} activeFile={activeFile} onOpen={open} />
      <main className="editor-group">
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          dirtyFiles={dirtyFiles}
          onSelect={setActiveFile}
          onClose={close}
        />
        <CodeEditor
          files={state.files}
          edits={edits}
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
