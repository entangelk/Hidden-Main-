import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyEdits } from '../engine/slots'
import type { Choice, FileView, PlayerEdits, SceneId } from '../engine/types'
import { CodeEditor } from '../ui/editor/CodeEditor'
import { Explorer } from '../ui/explorer/Explorer'
import { StatusBar } from '../ui/statusbar/StatusBar'
import { Tabs } from '../ui/tabs/Tabs'
import { Terminal } from '../ui/terminal/Terminal'
import { derivePrototype } from './prototype'
import { runPrototype } from './runPrototype'
import './App.css'

export default function App() {
  const [choices, setChoices] = useState<Choice[]>([])
  // Mirrors `choices` synchronously, like editsRef below: two runs fired before a re-render must
  // not both solve the same scene.
  const choicesRef = useRef<Choice[]>([])
  const [edits, setEdits] = useState<PlayerEdits>({})
  // Same value as `edits`, updated synchronously: a run fired right after a keystroke (before
  // React re-renders) must still see that keystroke.
  const editsRef = useRef<PlayerEdits>({})
  const updateEdits = useCallback((change: (prev: PlayerEdits) => PlayerEdits) => {
    editsRef.current = change(editsRef.current)
    setEdits(editsRef.current)
  }, [])
  const [openFiles, setOpenFiles] = useState<string[]>(['main.py'])
  const [activeFile, setActiveFile] = useState<string | null>('main.py')
  const [terminalLines, setTerminalLines] = useState<string[]>([])

  const state = useMemo(() => derivePrototype(choices), [choices])
  const views = useMemo(() => {
    const out: Record<string, FileView> = {}
    for (const [path, view] of Object.entries(state.views)) out[path] = applyEdits(view, edits)
    return out
  }, [state, edits])

  // A file is modified while its current scene holds a value different from the template's.
  const dirtyFiles = useMemo(() => {
    const dirty = new Set<string>()
    for (const [path, view] of Object.entries(state.views)) {
      if (view.valueSlots.some((s) => (edits[s.sceneId]?.[s.field] ?? s.defaultLiteral) !== s.defaultLiteral)) {
        dirty.add(path)
      }
    }
    return dirty
  }, [state, edits])

  const onEdit = useCallback(
    (sceneId: SceneId, field: string, literal: string) =>
      updateEdits((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], [field]: literal } })),
    [updateEdits],
  )

  const run = useCallback(() => {
    const { lines, choice } = runPrototype(choicesRef.current, editsRef.current, activeFile)
    setTerminalLines((prev) => [...prev, ...lines])
    if (!choice) return
    choicesRef.current = [...choicesRef.current, choice]
    setChoices(choicesRef.current)
    updateEdits((prev) => {
      const rest = { ...prev }
      delete rest[choice.sceneId]
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
      <Explorer paths={state.unlockedFiles} activeFile={activeFile} onOpen={open} />
      <main className="editor-group">
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          dirtyFiles={dirtyFiles}
          onSelect={setActiveFile}
          onClose={close}
        />
        <CodeEditor views={views} activeFile={activeFile} onEdit={onEdit} onRun={run} />
        <Terminal lines={terminalLines} />
      </main>
      <StatusBar activeFile={activeFile} />
    </div>
  )
}
