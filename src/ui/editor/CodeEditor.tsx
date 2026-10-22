import { useEffect, useRef } from 'react'
import { monaco } from './monaco'

type Props = {
  files: Record<string, string>
  activeFile: string | null
  onDirtyChange: (path: string, dirty: boolean) => void
  onRun: () => void
}

export function CodeEditor({ files, activeFile, onDirtyChange, onRun }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const modelsRef = useRef(new Map<string, monaco.editor.ITextModel>())
  const viewStatesRef = useRef(new Map<string, monaco.editor.ICodeEditorViewState | null>())
  // Content each model was created from (or last reset to); the dirty marker compares against it.
  const originalsRef = useRef(new Map<string, string>())
  const shownPathRef = useRef<string | null>(null)
  // Latest callbacks, so the editor created once never calls stale closures.
  const callbacksRef = useRef({ onDirtyChange, onRun })
  useEffect(() => {
    callbacksRef.current = { onDirtyChange, onRun }
  })

  useEffect(() => {
    const editor = monaco.editor.create(containerRef.current!, {
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false },
      folding: true,
      showFoldingControls: 'always',
      scrollBeyondLastLine: false,
    })
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => callbacksRef.current.onRun())
    editorRef.current = editor
    const models = modelsRef.current
    const viewStates = viewStatesRef.current
    const originals = originalsRef.current
    return () => {
      editor.dispose()
      for (const model of models.values()) model.dispose()
      models.clear()
      viewStates.clear()
      originals.clear()
      shownPathRef.current = null
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (shownPathRef.current) viewStatesRef.current.set(shownPathRef.current, editor.saveViewState())
    shownPathRef.current = activeFile
    if (!activeFile) {
      editor.setModel(null)
      return
    }
    let model = modelsRef.current.get(activeFile)
    if (!model) {
      const created = monaco.editor.createModel(files[activeFile], 'python', monaco.Uri.file(activeFile))
      originalsRef.current.set(activeFile, files[activeFile])
      created.onDidChangeContent(() =>
        callbacksRef.current.onDirtyChange(
          activeFile,
          created.getValue() !== originalsRef.current.get(activeFile),
        ),
      )
      modelsRef.current.set(activeFile, created)
      model = created
    }
    editor.setModel(model)
    const viewState = viewStatesRef.current.get(activeFile)
    if (viewState) editor.restoreViewState(viewState)
    editor.focus()
  }, [activeFile, files])

  // When a file's source content changes (P02+: the engine supplies new text), reset its model.
  // This discards in-memory edits for that file; how edits survive is the DB-02 value-slot flow.
  useEffect(() => {
    for (const [path, model] of modelsRef.current) {
      const next = files[path]
      if (next === undefined || next === originalsRef.current.get(path)) continue
      originalsRef.current.set(path, next)
      model.setValue(next)
    }
  }, [files])

  return <div className="code-editor" ref={containerRef} />
}
