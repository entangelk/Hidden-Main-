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

  it('returns an empty tree for no paths', () => {
    expect(buildFileTree([])).toEqual([])
  })
})
