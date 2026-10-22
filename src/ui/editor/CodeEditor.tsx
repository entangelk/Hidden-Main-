import { useEffect, useRef } from 'react'
import { shiftSlots } from '../../engine/slots'
import type { FileView, SceneId, ValueSlot } from '../../engine/types'
import { acceptChange } from './acceptChange'
import { monaco } from './monaco'

type Props = {
  views: Record<string, FileView>
  activeFile: string | null
  onEdit: (sceneId: SceneId, field: string, literal: string) => void
  onRun: () => void
}

export function CodeEditor({ views, activeFile, onEdit, onRun }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const modelsRef = useRef(new Map<string, monaco.editor.ITextModel>())
  const viewStatesRef = useRef(new Map<string, monaco.editor.ICodeEditorViewState | null>())
  const shownPathRef = useRef<string | null>(null)
  // Slots of the shown file. Updated right after an accepted edit, before React re-renders.
  const slotsRef = useRef<ValueSlot[]>([])
  // Set while this component itself changes a model, so its change handler ignores the event.
  const writingRef = useRef(false)
  // Files whose engine text changed (or that were never shown) since they were last on screen:
  // the next time they are shown, the current scene's value is scrolled into view.
  const revealRef = useRef(new Set<string>())
  // Latest callbacks, so the editor created once never calls stale closures.
  const callbacksRef = useRef({ onEdit, onRun })
  useEffect(() => {
    callbacksRef.current = { onEdit, onRun }
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
      // Only literal values are editable (DB-02). Auto-inserted pairs and suggestions would arrive
      // as extra or multi-range edits that the slot guard rejects, eating what the player typed.
      autoClosingBrackets: 'never',
      autoClosingQuotes: 'never',
      autoClosingOvertype: 'never',
      autoSurround: 'never',
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      wordBasedSuggestions: 'off',
    })
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => callbacksRef.current.onRun())
    editorRef.current = editor
    decorationsRef.current = editor.createDecorationsCollection()
    const models = modelsRef.current
    const viewStates = viewStatesRef.current
    const reveal = revealRef.current
    return () => {
      editor.dispose()
      for (const model of models.values()) model.dispose()
      models.clear()
      viewStates.clear()
      reveal.clear()
      shownPathRef.current = null
      editorRef.current = null
      decorationsRef.current = null
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const write = (model: monaco.editor.ITextModel, text: string) => {
      writingRef.current = true
      try {
        model.setValue(text)
      } finally {
        writingRef.current = false
      }
    }

    // Follow engine-side content changes (a scene solved, a value fixed). When the model already
    // holds the text — the player's own accepted edit — it is left alone so cursor and undo survive.
    for (const [path, model] of modelsRef.current) {
      const view = views[path]
      if (view && model.getValue() !== view.text) {
        write(model, view.text)
        revealRef.current.add(path)
      }
    }

    const pathChanged = shownPathRef.current !== activeFile
    if (pathChanged && shownPathRef.current) {
      viewStatesRef.current.set(shownPathRef.current, editor.saveViewState())
    }
    shownPathRef.current = activeFile
    const view = activeFile ? views[activeFile] : undefined
    if (!activeFile || !view) {
      editor.setModel(null)
      slotsRef.current = []
      return
    }

    let model = modelsRef.current.get(activeFile)
    if (!model) {
      const created = monaco.editor.createModel(view.text, 'python', monaco.Uri.file(activeFile))
      created.onDidChangeContent((e) => {
        if (writingRef.current) return
        const change = e.changes.length === 1 ? e.changes[0] : null
        const index = change
          ? acceptChange(slotsRef.current, {
              start: change.rangeOffset,
              end: change.rangeOffset + change.rangeLength,
              text: change.text,
            })
          : -1
        if (!change || index === -1) {
          // DB-02: only literal values are editable. Undo exactly this change; every accepted
          // change closes its own undo element, so nothing else is reverted.
          queueMicrotask(() => {
            writingRef.current = true
            try {
              created.undo()
            } finally {
              writingRef.current = false
            }
          })
          return
        }
        created.pushStackElement()
        // Keeps slots right for the next keystroke until React re-renders with applyEdits' view;
        // the shift rule itself lives in the engine.
        const slots = shiftSlots(slotsRef.current, index, change.text.length - change.rangeLength)
        slotsRef.current = slots
        const slot = slots[index]
        callbacksRef.current.onEdit(slot.sceneId, slot.field, created.getValue().slice(slot.start, slot.end))
      })
      modelsRef.current.set(activeFile, created)
      revealRef.current.add(activeFile)
      model = created
    }

    if (pathChanged) {
      editor.setModel(model)
      const viewState = viewStatesRef.current.get(activeFile)
      if (viewState) editor.restoreViewState(viewState)
      editor.focus()
    }
    slotsRef.current = view.valueSlots
    // A newly added scene function lands at the bottom of the file; scroll it into view (no cursor
    // move, no animation) so the player sees what changed.
    if (revealRef.current.delete(activeFile) && view.valueSlots.length) {
      editor.revealLineInCenterIfOutsideViewport(model.getPositionAt(view.valueSlots[0].start).lineNumber)
    }
    decorationsRef.current?.set(
      view.valueSlots.map((s) => {
        const from = model.getPositionAt(s.start)
        const to = model.getPositionAt(s.end)
        return {
          range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
          options:
            s.start === s.end
              ? // An empty value has no text to underline; show a blank underlined placeholder.
                { after: { content: '\u00a0', inlineClassName: 'value-slot' }, showIfCollapsed: true }
              : { inlineClassName: 'value-slot', stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges },
        }
      }),
    )
  }, [activeFile, views])

  return <div className="code-editor" ref={containerRef} />
}
