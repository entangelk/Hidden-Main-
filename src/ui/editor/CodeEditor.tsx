import { useEffect, useRef } from 'react'
import { applyEdits, shiftSlots } from '../../engine/slots'
import type { FileView, PlayerEdits, SceneId, ValueSlot } from '../../engine/types'
import { acceptChange } from './acceptChange'
import { gainedHandoff, HANDOFF_DEF } from './handoffReveal'
import { monaco } from './monaco'

type Props = {
  /** Engine views before player edits (DerivedState.files). */
  files: Record<string, FileView>
  edits: PlayerEdits
  /** Changes whenever progress changes (a scene solved, a restore), even if no engine text did. */
  revision: number
  activeFile: string | null
  onEdit: (sceneId: SceneId, field: string, literal: string) => void
  onRun: () => void
}

export function CodeEditor({ files, edits, revision, activeFile, onEdit, onRun }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)
  const modelsRef = useRef(new Map<string, monaco.editor.ITextModel>())
  const viewStatesRef = useRef(new Map<string, monaco.editor.ICodeEditorViewState | null>())
  const shownPathRef = useRef<string | null>(null)
  // Slots of the shown file. The editor keeps them current itself while the player types (React
  // may re-render with edits a few keystrokes behind); they are recomputed only when the engine
  // text changes or another file is shown.
  const slotsRef = useRef<ValueSlot[]>([])
  // Engine text (and progress revision) each model was last built from. A model is rewritten only
  // when this changes, never because the edits React passes in lag behind what is already in it.
  // The revision matters when a scene is solved with another spelling of its default value
  // (`50.0` for `50`): the engine text stays the same, but the screen must show the engine's form.
  const baseRef = useRef(new Map<string, string>())
  // Set while this component itself changes a model, so its change handler ignores the event.
  const writingRef = useRef(false)
  // Files whose engine text changed (or that were never shown) since they were last on screen:
  // the next time they are shown, the current scene's value is scrolled into view.
  const revealRef = useRef(new Set<string>())
  // Files that just gained the pointer to the next file; it is scrolled into view (architecture §5.2).
  const revealHandoffRef = useRef(new Set<string>())
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
    const revealHandoff = revealHandoffRef.current
    const bases = baseRef.current
    return () => {
      editor.dispose()
      for (const model of models.values()) model.dispose()
      models.clear()
      viewStates.clear()
      reveal.clear()
      revealHandoff.clear()
      bases.clear()
      shownPathRef.current = null
      editorRef.current = null
      decorationsRef.current = null
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // setValue also clears the undo history, so the player cannot undo into a solved value. The
    // shown model keeps its cursor and scroll.
    const write = (model: monaco.editor.ITextModel, text: string) => {
      const shown = editor.getModel() === model ? editor.saveViewState() : null
      writingRef.current = true
      try {
        model.setValue(text)
      } finally {
        writingRef.current = false
      }
      if (shown) editor.restoreViewState(shown)
    }

    const paint = (model: monaco.editor.ITextModel) =>
      decorationsRef.current?.set(
        slotsRef.current.map((s) => {
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

    // Follow engine-side changes (a scene solved, a function added, a restore). Only these rewrite
    // a model; the player's own typing is already in it.
    const engineChanged = new Set<string>()
    for (const [path, model] of modelsRef.current) {
      const base = files[path]
      const key = `${revision}\n${base?.text}`
      const previous = baseRef.current.get(path)
      if (!base || previous === key) continue
      baseRef.current.set(path, key)
      if (gainedHandoff(previous, base.text)) revealHandoffRef.current.add(path)
      // Rewritten even when the text already matches (solved with the engine's own spelling): the
      // undo history must not reach back past the solve (architecture §6.2).
      write(model, applyEdits(base, edits).text)
      engineChanged.add(path)
      revealRef.current.add(path)
    }

    const pathChanged = shownPathRef.current !== activeFile
    if (pathChanged && shownPathRef.current) {
      viewStatesRef.current.set(shownPathRef.current, editor.saveViewState())
    }
    shownPathRef.current = activeFile
    const base = activeFile ? files[activeFile] : undefined
    if (!activeFile || !base) {
      editor.setModel(null)
      slotsRef.current = []
      return
    }

    let model = modelsRef.current.get(activeFile)
    if (!model) {
      const created = monaco.editor.createModel(applyEdits(base, edits).text, 'python', monaco.Uri.file(activeFile))
      baseRef.current.set(activeFile, `${revision}\n${base.text}`)
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
        // The shift rule itself lives in the engine (shiftSlots); the editor only applies it.
        const slots = shiftSlots(slotsRef.current, index, change.text.length - change.rangeLength)
        slotsRef.current = slots
        paint(created)
        const slot = slots[index]
        callbacksRef.current.onEdit(slot.sceneId, slot.field, created.getValue().slice(slot.start, slot.end))
      })
      modelsRef.current.set(activeFile, created)
      revealRef.current.add(activeFile)
      engineChanged.add(activeFile)
      model = created
    }

    if (pathChanged) {
      editor.setModel(model)
      const viewState = viewStatesRef.current.get(activeFile)
      if (viewState) editor.restoreViewState(viewState)
      editor.focus()
    }
    // Slots come from the engine only when the shown file changed or its engine text did; while the
    // player types, the editor's own slots are newer than anything React passes in.
    if (pathChanged || engineChanged.has(activeFile)) {
      slotsRef.current = applyEdits(base, edits).valueSlots
      paint(model)
    }
    // A newly added scene function lands at the bottom of the file; scroll it into view (no cursor
    // move, no animation) so the player sees what changed.
    if (revealRef.current.delete(activeFile) && slotsRef.current.length) {
      editor.revealLineInCenterIfOutsideViewport(model.getPositionAt(slotsRef.current[0].start).lineNumber)
    } else if (revealHandoffRef.current.delete(activeFile)) {
      editor.revealLineInCenterIfOutsideViewport(model.getPositionAt(model.getValue().indexOf(HANDOFF_DEF)).lineNumber)
    }
  }, [activeFile, files, edits, revision])

  return <div className="code-editor" ref={containerRef} />
}
