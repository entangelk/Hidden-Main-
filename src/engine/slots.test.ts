import { describe, expect, it } from 'vitest'
import { applyEdits, findValueSlots, functionBlock, shiftSlots } from './slots'
import type { EditableField } from './types'

const template = [
  'class Responder:',
  '',
  '    def triage(self):',
  '        # 1. analyze',
  '        # 2. action = 2 isolates the host',
  '        # action = 3',
  '# column-0 comments do not end the function',
  '        alert_id = 2048',
  '',
  '        action = 1  # choose',
  '        target = "A"',
  '        return action',
  '',
  '    def later(self):',
  '        action = 3',
  '',
  'action = 9',
  '',
].join('\n')

const fields: EditableField[] = [
  { name: 'action', type: 'int', options: [1, 2, 3] },
  { name: 'target', type: 'string', options: ['A', 'B'] },
]

describe('functionBlock', () => {
  it('ends at the last line indented deeper than the def (blank lines do not end it)', () => {
    const [start, end] = functionBlock(template, 'triage')!
    const block = template.slice(start, end)
    expect(block.startsWith('    def triage(self):')).toBe(true)
    expect(block.endsWith('        return action')).toBe(true)
    expect(block).not.toContain('def later')
  })

  it('is not cut short by a column-0 comment, and ends at the next code line at the def indent', () => {
    const [, end] = functionBlock(template, 'triage')!
    expect(end).toBeGreaterThan(template.indexOf('# column-0 comments'))
    expect(end).toBeLessThan(template.indexOf('    def later'))
  })

  it('returns null for a missing function', () => {
    expect(functionBlock(template, 'missing')).toBeNull()
  })
})

describe('findValueSlots', () => {
  const slots = findValueSlots(template, 's1', 'triage', fields)

  it('finds each field literal inside the scene function only (not comments, other functions or module level)', () => {
    expect(slots.map((s) => [s.field, template.slice(s.start, s.end), s.defaultLiteral])).toEqual([
      ['action', '1', '1'],
      ['target', '"A"', '"A"'],
    ])
    const actionLine = template.indexOf('        action = 1')
    expect(slots[0].start).toBe(actionLine + '        action = '.length)
  })

  it('never takes a commented-out assignment, even one that is exactly `# field = literal`', () => {
    const commentLine = template.indexOf('        # action = 3')
    expect(slots[0].start).toBeGreaterThan(commentLine + 20)
    expect(template.slice(slots[0].start - '        action = '.length, slots[0].end)).toBe('        action = 1')
  })

  it('locates the literal after `=` even when the field name contains the same characters', () => {
    const text = '    def f(self):\n        a1 = 1\n'
    const [slot] = findValueSlots(text, 's', 'f', [{ name: 'a1', type: 'int', options: [1] }])
    expect(text.slice(slot.start, slot.end)).toBe('1')
    expect(slot.start).toBe(text.indexOf('= 1') + 2)
  })

  it('ignores lines that are not editable fields', () => {
    expect(findValueSlots(template, 's1', 'triage', [{ name: 'alert_id', type: 'int', options: [] }])[0]?.defaultLiteral).toBe('2048')
    expect(findValueSlots(template, 's1', 'triage', [{ name: 'missing', type: 'bool' }])).toEqual([])
  })

  it('returns slots sorted by position regardless of field order', () => {
    const reversed = findValueSlots(template, 's1', 'triage', [...fields].reverse())
    expect(reversed.map((s) => s.field)).toEqual(['action', 'target'])
  })
})

describe('shiftSlots', () => {
  const s = (start: number, end: number) => ({ sceneId: 's', field: 'f', start, end, defaultLiteral: '' })
  it('grows the edited slot, moves later ones, and leaves earlier ones', () => {
    expect(shiftSlots([s(0, 1), s(5, 6), s(9, 10)], 1, 2)).toEqual([s(0, 1), s(5, 8), s(11, 12)])
    expect(shiftSlots([s(0, 1), s(5, 6)], 0, -1)).toEqual([s(0, 0), s(4, 5)])
  })
})

describe('applyEdits', () => {
  const view = { text: template, valueSlots: findValueSlots(template, 's1', 'triage', fields) }

  it('replaces edited literals and shifts the slots after them', () => {
    const out = applyEdits(view, { s1: { action: '123' } })
    const [action, target] = out.valueSlots
    expect(out.text.slice(action.start, action.end)).toBe('123')
    expect(action.end - action.start).toBe(3)
    expect(out.text.slice(target.start, target.end)).toBe('"A"')
    expect(target.start).toBe(view.valueSlots[1].start + 2)
  })

  it('leaves text and slots unchanged without edits, and supports an empty literal', () => {
    expect(applyEdits(view, {})).toEqual(view)
    const out = applyEdits(view, { s1: { action: '' } })
    expect(out.valueSlots[0].start).toBe(out.valueSlots[0].end)
    expect(out.text.slice(out.valueSlots[1].start, out.valueSlots[1].end)).toBe('"A"')
  })

  it('applies edits to two slots at once, each in the right place', () => {
    const out = applyEdits(view, { s1: { action: '123', target: '"BB"' } })
    const [action, target] = out.valueSlots
    expect(out.text.slice(action.start, action.end)).toBe('123')
    expect(out.text.slice(target.start, target.end)).toBe('"BB"')
    expect(out.text).toContain('        action = 123  # choose\n        target = "BB"\n')
  })

  it('ignores edits for other scenes', () => {
    expect(applyEdits(view, { other: { action: '2' } })).toEqual(view)
  })
})
