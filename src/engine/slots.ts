import type { EditableField, FileView, PlayerEdits, SceneId, ValueSlot } from './types'

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// One literal as the template may write it (architecture §6.1): number, True/False, or a quoted
// string without `#` or backslashes (so the end-of-line comment start is unambiguous).
const LITERAL = String.raw`-?\d+(?:\.\d*)?|-?\.\d+|True|False|"[^"#\\]*"|'[^'#\\]*'`

/**
 * [start, end) of the `def functionName(` block: through the last code line indented deeper than
 * the def. Blank and comment-only lines never end the block (Python allows a comment at any column).
 */
export function functionBlock(text: string, functionName: string): [number, number] | null {
  const def = new RegExp(`^( *)def ${escapeRe(functionName)}\\(`, 'm').exec(text)
  if (!def) return null
  const indent = def[1].length
  let end = text.indexOf('\n', def.index)
  if (end === -1) return [def.index, text.length]
  let cursor = end + 1
  while (cursor < text.length) {
    const lineEnd = text.indexOf('\n', cursor)
    const line = text.slice(cursor, lineEnd === -1 ? text.length : lineEnd)
    const code = line.trim()
    if (code !== '' && !code.startsWith('#')) {
      if (line.length - line.trimStart().length <= indent) break
      end = lineEnd === -1 ? text.length : lineEnd
    }
    if (lineEnd === -1) break
    cursor = lineEnd + 1
  }
  return [def.index, end]
}

/** Value slots of one scene: each field's `name = literal` line inside the scene's function. */
export function findValueSlots(
  text: string,
  sceneId: SceneId,
  functionName: string,
  fields: EditableField[],
): ValueSlot[] {
  const block = functionBlock(text, functionName)
  if (!block) return []
  const [from, to] = block
  const body = text.slice(from, to)
  const slots: ValueSlot[] = []
  for (const field of fields) {
    const line = new RegExp(`^ *${escapeRe(field.name)} *= *(${LITERAL}) *(?:#.*)?$`, 'm')
    const m = line.exec(body)
    if (!m) continue
    const start = from + m.index + m[0].indexOf(m[1], m[0].indexOf('='))
    slots.push({ sceneId, field: field.name, start, end: start + m[1].length, defaultLiteral: m[1] })
  }
  return slots.sort((a, b) => a.start - b.start)
}

/** Slots after an edit of `slots[index]` changed its length by `delta` (architecture §6.2). */
export function shiftSlots(slots: ValueSlot[], index: number, delta: number): ValueSlot[] {
  return slots.map((s, i) =>
    i < index ? s : i === index ? { ...s, end: s.end + delta } : { ...s, start: s.start + delta, end: s.end + delta },
  )
}

/**
 * Replaces each slot's literal with the player's edit (when there is one) and moves the slots
 * after it by the length difference (architecture §6.2).
 */
export function applyEdits(view: FileView, edits: PlayerEdits): FileView {
  let text = view.text
  let valueSlots = view.valueSlots
  valueSlots.forEach((_, index) => {
    const slot = valueSlots[index]
    const edit = edits[slot.sceneId]?.[slot.field]
    if (edit === undefined) return
    text = text.slice(0, slot.start) + edit + text.slice(slot.end)
    valueSlots = shiftSlots(valueSlots, index, edit.length - (slot.end - slot.start))
  })
  return { text, valueSlots }
}
