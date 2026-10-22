import { describe, expect, it } from 'vitest'
import { formatLiteral, parse, readLiteral } from './parser'
import type { EditableField } from './types'

const action: EditableField = { name: 'action', type: 'int', options: [1, 2, 3] }

describe('parseChoice', () => {
  it('accepts every allowed option (over-strict guard: valid values are never rejected)', () => {
    for (const raw of ['1', '2', ' 3 ']) {
      const r = parse('s', [action], { action: raw })
      expect(r).toEqual({ ok: true, choice: { sceneId: 's', values: { action: Number(raw) } } })
    }
  })

  it('rejects out-of-range, non-literal and wrong-type input (under-strict guard)', () => {
    const kind = (raw: string) => {
      const r = parse('s', [action], { action: raw })
      return r.ok ? 'ok' : r.errors[0].kind
    }
    expect(kind('4')).toBe('out_of_range')
    expect(kind('0')).toBe('out_of_range')
    expect(kind('one')).toBe('not_literal')
    expect(kind('1 + 1')).toBe('not_literal')
    expect(kind('')).toBe('not_literal')
    expect(kind('2.0')).toBe('type_mismatch')
    expect(kind('"2"')).toBe('type_mismatch')
    expect(kind('True')).toBe('type_mismatch')
  })

  it('reports every failing field with its raw input', () => {
    const fields: EditableField[] = [action, { name: 'override', type: 'bool' }]
    expect(parse('s', fields, { action: '9', override: 'yes' })).toEqual({
      ok: false,
      errors: [
        { field: 'action', raw: '9', kind: 'out_of_range' },
        { field: 'override', raw: 'yes', kind: 'not_literal' },
      ],
    })
  })

  it('checks number ranges inclusively and accepts ints for number fields', () => {
    const limit: EditableField = { name: 'limit', type: 'number', min: 0, max: 100 }
    const ok = (raw: string) => parse('s', [limit], { limit: raw }).ok
    expect([ok('0'), ok('100'), ok('49.5'), ok('-1'), ok('100.1')]).toEqual([true, true, true, false, false])
  })

  it('checks string options and bools', () => {
    const target: EditableField = { name: 'target', type: 'string', options: ['A', 'B'] }
    expect(parse('s', [target], { target: "'A'" }).ok).toBe(true)
    expect(parse('s', [target], { target: '"C"' }).ok).toBe(false)
    expect(parse('s', [{ name: 'f', type: 'bool' }], { f: 'False' })).toEqual({
      ok: true,
      choice: { sceneId: 's', values: { f: false } },
    })
  })
})

describe('readLiteral', () => {
  it('reads quoted strings with escapes and rejects broken quoting', () => {
    expect(readLiteral(String.raw`"a\"b"`)).toEqual({ kind: 'str', value: 'a"b' })
    expect(readLiteral(`"a"b"`)).toBeNull()
    expect(readLiteral(`"a`)).toBeNull()
    expect(readLiteral(String.raw`"a\"`)).toBeNull()
    expect(readLiteral(`"`)).toBeNull()
    expect(readLiteral(`'x'`)).toEqual({ kind: 'str', value: 'x' })
  })

  it('follows Python for leading zeros and escapes', () => {
    expect(readLiteral('01')).toBeNull()
    expect(readLiteral('-01')).toBeNull()
    expect(readLiteral('0')).toEqual({ kind: 'int', value: 0 })
    expect(readLiteral('10')).toEqual({ kind: 'int', value: 10 })
    expect(readLiteral(String.raw`"a\nb"`)).toEqual({ kind: 'str', value: 'a\nb' })
    expect(readLiteral(String.raw`"a\tb"`)).toEqual({ kind: 'str', value: 'a\tb' })
    expect(readLiteral(String.raw`"a\qb"`)).toEqual({ kind: 'str', value: 'a\\qb' })
    expect(readLiteral(String.raw`'it\'s'`)).toEqual({ kind: 'str', value: "it's" })
  })

  it('reads numbers but not other words', () => {
    expect(readLiteral('-3')).toEqual({ kind: 'int', value: -3 })
    expect(readLiteral('.5')).toEqual({ kind: 'float', value: 0.5 })
    expect(readLiteral('true')).toBeNull()
    expect(readLiteral('1e3')).toBeNull()
  })
})

describe('formatLiteral', () => {
  it('writes Python literals that read back to the same value', () => {
    for (const v of [2, 0, 0.5, true, false, 'A', 'say "hi"', 'back\\slash', 'two\nlines', 'tab\there']) {
      const lit = readLiteral(formatLiteral(v))
      expect(lit?.value).toEqual(v)
    }
    expect(formatLiteral(true)).toBe('True')
    expect(formatLiteral('A')).toBe('"A"')
  })
})
