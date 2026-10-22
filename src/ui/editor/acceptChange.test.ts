import { describe, expect, it } from 'vitest'
import type { ValueSlot } from '../../engine/types'
import { acceptChange } from './acceptChange'

const slot = (start: number, end: number, field = 'f'): ValueSlot => ({
  sceneId: 's',
  field,
  start,
  end,
  defaultLiteral: '',
})
const slots = [slot(10, 11, 'a'), slot(20, 23, 'b')]

describe('acceptChange', () => {
  it('accepts edits inside a slot, at its start and at its end (over-strict guard)', () => {
    expect(acceptChange(slots, { start: 10, end: 11, text: '3' })).toBe(0)
    expect(acceptChange(slots, { start: 10, end: 10, text: '1' })).toBe(0)
    expect(acceptChange(slots, { start: 11, end: 11, text: '2' })).toBe(0)
    expect(acceptChange(slots, { start: 21, end: 22, text: '' })).toBe(1)
    expect(acceptChange([slot(5, 5)], { start: 5, end: 5, text: 'x' })).toBe(0)
  })

  it('rejects edits outside slots, across slot edges or slots, and line breaks (under-strict guard)', () => {
    expect(acceptChange(slots, { start: 9, end: 9, text: 'x' })).toBe(-1)
    expect(acceptChange(slots, { start: 12, end: 12, text: 'x' })).toBe(-1)
    expect(acceptChange(slots, { start: 9, end: 11, text: '' })).toBe(-1)
    expect(acceptChange(slots, { start: 10, end: 12, text: '' })).toBe(-1)
    expect(acceptChange(slots, { start: 10, end: 23, text: '' })).toBe(-1)
    expect(acceptChange(slots, { start: 11, end: 11, text: '\n' })).toBe(-1)
    expect(acceptChange(slots, { start: 11, end: 11, text: '1\r\n' })).toBe(-1)
    expect(acceptChange([], { start: 0, end: 0, text: 'x' })).toBe(-1)
  })
})
