import type { TreeNode } from './fileTree'

// Paths of the items currently shown, in display order (children of collapsed folders hidden).
export function visiblePaths(tree: TreeNode[], collapsed: Set<string>): string[] {
  const out: string[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      out.push(n.path)
      if (n.kind === 'folder' && !collapsed.has(n.path)) walk(n.children)
    }
  }
  walk(tree)
  return out
}

// The single item reachable with Tab: the last focused one, else the active file, else the first
// visible item. A remembered item hidden by a collapsed folder is skipped.
export function tabStopPath(
  visible: string[],
  focused: string | null,
  active: string | null,
): string | undefined {
  return [focused, active].find((p) => p !== null && visible.includes(p)) ?? visible[0]
}

export type TreeKeyAction =
  | { type: 'focus'; path: string }
  | { type: 'setOpen'; open: boolean }
  | { type: 'openFile' }

type ItemState = { path: string; isFolder: boolean; open: boolean }

const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : null)

// What a plain key press on a tree item does (WAI-ARIA tree pattern). null: key not handled.
export function treeKeyAction(key: string, item: ItemState, visible: string[]): TreeKeyAction | null {
  const index = visible.indexOf(item.path)
  const focusAt = (i: number): TreeKeyAction => ({
    type: 'focus',
    path: visible[Math.max(0, Math.min(visible.length - 1, i))],
  })
  switch (key) {
    case 'Enter':
    case ' ':
      return item.isFolder ? { type: 'setOpen', open: !item.open } : { type: 'openFile' }
    case 'ArrowDown':
      return focusAt(index + 1)
    case 'ArrowUp':
      return focusAt(index - 1)
    case 'Home':
      return focusAt(0)
    case 'End':
      return focusAt(visible.length - 1)
    case 'ArrowRight':
      if (item.isFolder && !item.open) return { type: 'setOpen', open: true }
      return item.open ? focusAt(index + 1) : null
    case 'ArrowLeft': {
      if (item.open) return { type: 'setOpen', open: false }
      const parent = parentOf(item.path)
      return parent ? { type: 'focus', path: parent } : null
    }
    default:
      return null
  }
}
