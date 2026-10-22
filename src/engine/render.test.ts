import { describe, expect, it } from 'vitest'
import { resolveVariants } from './render'

const block = [
  '    def f(self):',
  '        # @if seen == True',
  '        # seen it',
  '        # @else',
  '        # not yet',
  '        # @end',
  '        # always',
  '        x = 1',
].join('\n')

describe('resolveVariants', () => {
  it('keeps the taken branch and drops directive lines', () => {
    expect(resolveVariants(block, { seen: true })).toBe(
      ['    def f(self):', '        # seen it', '        # always', '        x = 1'].join('\n'),
    )
    expect(resolveVariants(block, {})).toBe(
      ['    def f(self):', '        # not yet', '        # always', '        x = 1'].join('\n'),
    )
  })

  it('supports @if without @else, and numeric comparisons', () => {
    const t = ['# @if n >= 2', '# many', '# @end', '# done'].join('\n')
    expect(resolveVariants(t, { n: 2 })).toBe('# many\n# done')
    expect(resolveVariants(t, { n: 1 })).toBe('# done')
  })

  it('leaves text without directives unchanged', () => {
    expect(resolveVariants('# @iffy not a directive\nx = 1', {})).toBe('# @iffy not a directive\nx = 1')
  })

  it('rejects malformed directives', () => {
    expect(() => resolveVariants('# @if seen\n# @end', {})).toThrow('Bad @if')
    expect(() => resolveVariants('# @if a == 1\n# @if b == 1\n# @end\n# @end', {})).toThrow('Nested')
    expect(() => resolveVariants('# @else', {})).toThrow('@else without @if')
    expect(() => resolveVariants('# @end', {})).toThrow('@end without @if')
    expect(() => resolveVariants('# @if a == 1', {})).toThrow('Unclosed')
  })
})
