import { describe, expect, it } from 'vitest'
import { holds } from './condition'

describe('holds', () => {
  it('is true for an empty condition and requires every clause (AND)', () => {
    expect(holds([], {}, {})).toBe(true)
    const both = [
      { ref: { choice: 'a' }, op: '==' as const, value: 1 },
      { ref: { flag: 'f' }, op: '==' as const, value: true },
    ]
    expect(holds(both, { a: 1 }, { f: true })).toBe(true)
    expect(holds(both, { a: 1 }, {})).toBe(false)
    expect(holds(both, { a: 2 }, { f: true })).toBe(false)
  })

  it('compares with == / != by value and treats a missing flag as unequal', () => {
    expect(holds([{ ref: { flag: 'f' }, op: '!=', value: true }], {}, {})).toBe(true)
    expect(holds([{ ref: { choice: 't' }, op: '==', value: 'A' }], { t: 'A' }, {})).toBe(true)
    expect(holds([{ ref: { choice: 't' }, op: '==', value: '1' }], { t: 1 }, {})).toBe(false)
  })

  it('orders numbers only, boundaries inclusive', () => {
    expect(holds([{ ref: { choice: 'n' }, op: '>=', value: 50 }], { n: 50 }, {})).toBe(true)
    expect(holds([{ ref: { choice: 'n' }, op: '>=', value: 50 }], { n: 49 }, {})).toBe(false)
    expect(holds([{ ref: { choice: 'n' }, op: '<=', value: 50 }], { n: 50 }, {})).toBe(true)
    expect(holds([{ ref: { choice: 'n' }, op: '<=', value: 50 }], { n: 51 }, {})).toBe(false)
    expect(holds([{ ref: { choice: 's' }, op: '>=', value: 'a' }], { s: 'b' }, {})).toBe(false)
  })
})
