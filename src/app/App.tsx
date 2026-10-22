import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseChoice } from '../engine/parser'
import { applyEdits } from '../engine/slots'
import type { Choice, FileView, PlayerEdits, SceneId } from '../engine/types'
import { CodeEditor } from '../ui/editor/CodeEditor'
import { Explorer } from '../ui/explorer/Explorer'
import { StatusBar } from '../ui/statusbar/StatusBar'
import { Tabs } from '../ui/tabs/Tabs'
import { Terminal } from '../ui/terminal/Terminal'
import { derivePrototype } from './prototype'
import { parseErrorLine } from './terminalMessages'
import './App.css'

const lineOf = (text: string, offset: number) => text.slice(0, offset).split('\n').length

export default function App() {
  const [choices, setChoices] = useState<Choice[]>([])
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

  // Architecture §3: every early exit only prints; state changes happen after validation passes.
  const run = useCallback(() => {
    const print = (...lines: string[]) => setTerminalLines((prev) => [...prev, ...lines])
    const scene = state.currentScene
    if (!scene) {
      print('처리할 사건이 없습니다.')
      return
    }
    if (activeFile !== scene.file) {
      print(`실행할 파일: ${scene.file}${activeFile ? ` (현재 탭: ${activeFile})` : ''}`)
      return
    }
    const edits = editsRef.current
    const view = state.views[scene.file]
    const literals = Object.fromEntries(
      view.valueSlots.map((s) => [s.field, edits[scene.id]?.[s.field] ?? s.defaultLiteral]),
    )
    const result = parseChoice(scene.id, scene.fields, literals)
    if (!result.ok) {
      const shown = applyEdits(view, edits)
      print(
        `$ python ${scene.file}`,
        'Traceback (most recent call last):',
        ...result.errors.flatMap((error) => {
          const slot = shown.valueSlots.find((s) => s.field === error.field)
          const field = scene.fields.find((f) => f.name === error.field)!
          return [
            `  File "${scene.file}", line ${slot ? lineOf(shown.text, slot.start) : '?'}, in ${scene.functionName}`,
            parseErrorLine(error, field),
          ]
        }),
      )
      return
    }
    const next = derivePrototype([...choices, result.choice])
    const created = next.unlockedFiles.filter((f) => !state.unlockedFiles.includes(f))
    print(
      `$ python ${scene.file}`,
      ...scene.outcomes[result.choice.values.action as number],
      ...created.map((f) => `[workspace] ${f} 생성됨`),
    )
    setChoices((prev) => [...prev, result.choice])
    updateEdits((prev) => {
      const rest = { ...prev }
      delete rest[scene.id]
      return rest
    })
  }, [state, activeFile, choices, updateEdits])

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
