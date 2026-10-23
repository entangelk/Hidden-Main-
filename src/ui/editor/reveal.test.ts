import { describe, expect, it } from 'vitest'
import { handoffBlock } from '../../engine/render'
import { baseKey, gainedHandoff, handoffCursorOffset, textChanged } from './reveal'

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

describe('textChanged', () => {
  it('is true when the text differs or nothing was built yet (under-strict guard: cursor follows a new function)', () => {
    expect(textChanged(baseKey(1, 'a\nb'), 'a\nb\nc')).toBe(true)
    expect(textChanged(undefined, 'a')).toBe(true)
  })

  it('is false when only the revision moved (over-strict guard: no jump on every solve elsewhere)', () => {
    expect(textChanged(baseKey(1, 'a\nb'), 'a\nb')).toBe(false)
    expect(textChanged(baseKey(1, 'a'), 'a')).toBe(false)
  })
})

describe('handoffCursorOffset', () => {
  it('is the end of the return line of next_file(), not of an earlier return', () => {
    const text = `${before}\n${handoffBlock('    ', 'b.py')}\n\nif __name__ == "__main__":\n    main()\n`
    const at = handoffCursorOffset(text)
    const lineStart = text.lastIndexOf('\n', at - 1) + 1
    expect(text.slice(lineStart, at)).toBe('        return "b.py"')
    expect(text[at]).toBe('\n')
  })
})
