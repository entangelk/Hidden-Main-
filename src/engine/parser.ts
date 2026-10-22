import type { Choice, EditableField, ParseError, ParseResult, SceneId, Value } from './types'

type Literal = { kind: 'int' | 'float'; value: number } | { kind: 'bool'; value: boolean } | { kind: 'str'; value: string }

const INT = /^-?\d+$/
const FLOAT = /^-?(\d+\.\d*|\.\d+)$/

/** Reads one Python literal: int, float, True/False, or a single/double-quoted string. */
export function readLiteral(raw: string): Literal | null {
  const s = raw.trim()
  if (INT.test(s)) return { kind: 'int', value: Number(s) }
  if (FLOAT.test(s)) return { kind: 'float', value: Number(s) }
  if (s === 'True' || s === 'False') return { kind: 'bool', value: s === 'True' }
  const quote = s[0]
  if ((quote === '"' || quote === "'") && s.length >= 2 && s.endsWith(quote)) {
    let out = ''
    for (let i = 1; i < s.length - 1; i++) {
      const c = s[i]
      if (c === '\\') {
        if (i + 1 >= s.length - 1) return null // a trailing backslash would escape the closing quote
        out += s[++i]
      } else if (c === quote) {
        return null // unescaped closing quote before the end: not a single literal
      } else {
        out += c
      }
    }
    return { kind: 'str', value: out }
  }
  return null
}

function check(field: EditableField, lit: Literal): { value: Value } | ParseError['kind'] {
  switch (field.type) {
    case 'int':
      if (lit.kind !== 'int') return 'type_mismatch'
      return field.options.includes(lit.value) ? { value: lit.value } : 'out_of_range'
    case 'number':
      if (lit.kind !== 'int' && lit.kind !== 'float') return 'type_mismatch'
      return lit.value >= field.min && lit.value <= field.max ? { value: lit.value } : 'out_of_range'
    case 'bool':
      return lit.kind === 'bool' ? { value: lit.value } : 'type_mismatch'
    case 'string':
      if (lit.kind !== 'str') return 'type_mismatch'
      return field.options.includes(lit.value) ? { value: lit.value } : 'out_of_range'
  }
}

/** Validates the raw literal of every field. All errors are reported, not just the first. */
export function parseChoice(
  sceneId: SceneId,
  fields: EditableField[],
  literals: Record<string, string>,
): ParseResult {
  const values: Choice['values'] = {}
  const errors: ParseError[] = []
  for (const field of fields) {
    const raw = literals[field.name] ?? ''
    const lit = readLiteral(raw)
    const result = lit ? check(field, lit) : 'not_literal'
    if (typeof result === 'string') errors.push({ field: field.name, raw, kind: result })
    else values[field.name] = result.value
  }
  return errors.length ? { ok: false, errors } : { ok: true, choice: { sceneId, values } }
}

/** Writes a value back as a Python literal (data contract §6, fixed display of solved scenes). */
export function formatLiteral(value: Value): string {
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  return `"${value.replace(/["\\]/g, '\\$&')}"`
}
