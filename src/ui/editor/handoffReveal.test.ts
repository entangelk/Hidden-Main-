import { describe, expect, it } from 'vitest'
import { gainedHandoff } from './handoffReveal'

const before = '    def escalate(self):\n        return 1\n'
const after = `${before}\n    def next_file(self):\n        return "b.py"\n`

describe('gainedHandoff', () => {
  it('is true when the pointer first appears (under-strict guard: no scroll without it)', () => {
    expect(gainedHandoff(before, after)).toBe(true)
  })

  it('is false when the pointer was already there or is absent (over-strict guard: no scroll on every solve)', () => {
    expect(gainedHandoff(after, after)).toBe(false)
    expect(gainedHandoff(before, before)).toBe(false)
    expect(gainedHandoff(undefined, before)).toBe(false)
  })
})
