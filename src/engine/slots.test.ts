import { describe, expect, it } from 'vitest'
import { applyEdits, findValueSlots, functionBlock } from './slots'
import type { EditableField } from './types'

const template = [
  'class Responder:',
  '',
  '    def triage(self):',
  '        # 1. analyze',
  '        # 2. action = 2 isolates the host',
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

  it('ignores lines that are not editable fields', () => {
    expect(findValueSlots(template, 's1', 'triage', [{ name: 'alert_id', type: 'int', options: [] }])[0]?.defaultLiteral).toBe('2048')
    expect(findValueSlots(template, 's1', 'triage', [{ name: 'missing', type: 'bool' }])).toEqual([])
  })

  it('returns slots sorted by position regardless of field order', () => {
    const reversed = findValueSlots(template, 's1', 'triage', [...fields].reverse())
    expect(reversed.map((s) => s.field)).toEqual(['action', 'target'])
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

  it('ignores edits for other scenes', () => {
    expect(applyEdits(view, { other: { action: '2' } })).toEqual(view)
  })
})
