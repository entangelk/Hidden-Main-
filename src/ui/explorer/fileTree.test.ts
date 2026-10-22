import { describe, expect, it } from 'vitest'
import { buildFileTree } from './fileTree'

describe('buildFileTree', () => {
  it('groups nested paths under a single folder node (under-strict guard: no duplicate folders)', () => {
    const tree = buildFileTree(['incidents/b.py', 'incidents/a.py'])
    expect(tree).toEqual([
      {
        kind: 'folder',
        name: 'incidents',
        path: 'incidents',
        children: [
          { kind: 'file', name: 'a.py', path: 'incidents/a.py' },
          { kind: 'file', name: 'b.py', path: 'incidents/b.py' },
        ],
      },
    ])
  })

  it('keeps root-level files beside folders, folders first (over-strict guard: root files are not dropped or nested)', () => {
    const tree = buildFileTree(['main.py', 'config/settings.py', 'README.md'])
    expect(tree.map((n) => `${n.kind}:${n.path}`)).toEqual([
      'folder:config',
      'file:main.py',
      'file:README.md',
    ])
  })

  it('builds intermediate folders for deep paths', () => {
    const [top] = buildFileTree(['a/b/c.py'])
    expect(top.kind === 'folder' && top.children[0]).toMatchObject({
      kind: 'folder',
      path: 'a/b',
      children: [{ kind: 'file', path: 'a/b/c.py' }],
    })
  })

  it('sorts names case-insensitively (code-unit order would put B.py first)', () => {
    const tree = buildFileTree(['B.py', 'c.py', 'a.py'])
    expect(tree.map((n) => n.name)).toEqual(['a.py', 'B.py', 'c.py'])
  })

  it('sorts with English collation (Lithuanian would put y.py before j.py)', () => {
    const tree = buildFileTree(['y.py', 'j.py', 'i.py'])
    expect(tree.map((n) => n.name)).toEqual(['i.py', 'j.py', 'y.py'])
  })

  it('orders names differing only in case the same way regardless of input order', () => {
    expect(buildFileTree(['b.py', 'B.py']).map((n) => n.name)).toEqual(['B.py', 'b.py'])
    expect(buildFileTree(['B.py', 'b.py']).map((n) => n.name)).toEqual(['B.py', 'b.py'])
  })

  it('keeps folders whose names differ only in case separate (paths are case-sensitive)', () => {
    const tree = buildFileTree(['A/x.py', 'a/y.py'])
    expect(tree.map((n) => n.path)).toEqual(['A', 'a'])
  })

  it('collapses an exact duplicate path into one node', () => {
    expect(buildFileTree(['main.py', 'main.py'])).toEqual([
      { kind: 'file', name: 'main.py', path: 'main.py' },
    ])
  })

  it('rejects a path that is both a file and a folder, in either order', () => {
    expect(() => buildFileTree(['a', 'a/b.py'])).toThrow('both a file and a folder: a')
    expect(() => buildFileTree(['a/b.py', 'a'])).toThrow('both a file and a folder: a')
  })

  it('returns an empty tree for no paths', () => {
    expect(buildFileTree([])).toEqual([])
  })
})
