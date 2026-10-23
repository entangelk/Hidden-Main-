import { describe, expect, it } from 'vitest'
import { buildFileTree } from './fileTree'
import { tabStopPath, treeKeyAction, visiblePaths } from './treeNav'

const tree = buildFileTree(['config/settings.py', 'incidents/event_001.py', 'main.py'])
const all = ['config', 'config/settings.py', 'incidents', 'incidents/event_001.py', 'main.py']

describe('visiblePaths', () => {
  it('lists every item in display order when nothing is collapsed', () => {
    expect(visiblePaths(tree, new Set())).toEqual(all)
  })

  it('hides only the children of collapsed folders (the folder itself stays)', () => {
    expect(visiblePaths(tree, new Set(['config']))).toEqual([
      'config',
      'incidents',
      'incidents/event_001.py',
      'main.py',
    ])
  })
})

describe('tabStopPath', () => {
  it('prefers the focused item, then the active file, then the first item', () => {
    expect(tabStopPath(all, 'incidents', 'main.py')).toBe('incidents')
    expect(tabStopPath(all, null, 'main.py')).toBe('main.py')
    expect(tabStopPath(all, null, null)).toBe('config')
  })

  it('skips a remembered item hidden by a collapsed folder (never leaves zero tab stops)', () => {
    const visible = visiblePaths(tree, new Set(['config']))
    expect(tabStopPath(visible, 'config/settings.py', 'config/settings.py')).toBe('config')
  })
})

describe('treeKeyAction', () => {
  const file = (path: string) => ({ path, isFolder: false, open: false })
  const folder = (path: string, open: boolean) => ({ path, isFolder: true, open })

  it('moves focus up/down/home/end within visible items, clamped at the ends', () => {
    expect(treeKeyAction('ArrowDown', file('config/settings.py'), all)).toEqual({ type: 'focus', path: 'incidents' })
    expect(treeKeyAction('ArrowUp', folder('config', true), all)).toEqual({ type: 'focus', path: 'config' })
    expect(treeKeyAction('ArrowDown', file('main.py'), all)).toEqual({ type: 'focus', path: 'main.py' })
    expect(treeKeyAction('Home', file('main.py'), all)).toEqual({ type: 'focus', path: 'config' })
    expect(treeKeyAction('End', folder('config', true), all)).toEqual({ type: 'focus', path: 'main.py' })
  })

  it('Enter/Space toggle folders and open files', () => {
    expect(treeKeyAction('Enter', folder('config', true), all)).toEqual({ type: 'setOpen', open: false })
    expect(treeKeyAction(' ', folder('config', false), all)).toEqual({ type: 'setOpen', open: true })
    expect(treeKeyAction('Enter', file('main.py'), all)).toEqual({ type: 'openFile' })
  })

  it('ArrowRight expands a closed folder, enters an open one, and ignores files', () => {
    expect(treeKeyAction('ArrowRight', folder('config', false), all)).toEqual({ type: 'setOpen', open: true })
    expect(treeKeyAction('ArrowRight', folder('config', true), all)).toEqual({
      type: 'focus',
      path: 'config/settings.py',
    })
    expect(treeKeyAction('ArrowRight', file('main.py'), all)).toBeNull()
  })

  it('ArrowLeft collapses an open folder, goes to the parent from a child, and ignores top-level items', () => {
    expect(treeKeyAction('ArrowLeft', folder('config', true), all)).toEqual({ type: 'setOpen', open: false })
    expect(treeKeyAction('ArrowLeft', file('config/settings.py'), all)).toEqual({ type: 'focus', path: 'config' })
    expect(treeKeyAction('ArrowLeft', file('main.py'), all)).toBeNull()
    expect(treeKeyAction('ArrowLeft', folder('incidents', false), all)).toBeNull()
  })

  it('ArrowLeft from a deeply nested item focuses its immediate parent folder, not the top one', () => {
    const nested = visiblePaths(buildFileTree(['a/b/c.py']), new Set())
    expect(treeKeyAction('ArrowLeft', file('a/b/c.py'), nested)).toEqual({ type: 'focus', path: 'a/b' })
    expect(treeKeyAction('ArrowLeft', folder('a/b', false), nested)).toEqual({ type: 'focus', path: 'a' })
  })

  it('does not handle other keys', () => {
    expect(treeKeyAction('a', file('main.py'), all)).toBeNull()
  })
})
