import { useState, type FocusEvent, type KeyboardEvent } from 'react'
import { buildFileTree, type TreeNode } from './fileTree'

type Props = {
  paths: string[]
  activeFile: string | null
  onOpen: (path: string) => void
}

// Visible tree items in document order: the order arrow keys move through.
function visibleItems(from: HTMLElement): HTMLElement[] {
  const tree = from.closest('[role=tree]')
  return tree ? Array.from(tree.querySelectorAll<HTMLElement>('[role=treeitem]')) : []
}

export function Explorer({ paths, activeFile, onOpen }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  // Roving tab stop: one item is reachable with Tab, arrow keys move between items.
  const [focusedPath, setFocusedPath] = useState<string | null>(null)

  const setOpen = (path: string, open: boolean) =>
    setCollapsed((prev) => {
      if (prev.has(path) === !open) return prev
      const next = new Set(prev)
      if (open) next.delete(path)
      else next.add(path)
      return next
    })

  const tree = buildFileTree(paths)
  const visible: string[] = []
  const collectVisible = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      visible.push(n.path)
      if (n.kind === 'folder' && !collapsed.has(n.path)) collectVisible(n.children)
    }
  }
  collectVisible(tree)
  // The remembered item can be hidden by collapsing its folder; fall back so Tab still lands.
  const tabStop = [focusedPath, activeFile].find((p) => p && visible.includes(p)) ?? visible[0]

  // Plain keys only: Ctrl/Cmd+Enter is left to the global run shortcut.
  const onKeyDown = (node: TreeNode) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return
    const isFolder = node.kind === 'folder'
    const open = isFolder && !collapsed.has(node.path)
    const items = visibleItems(e.currentTarget)
    const index = items.indexOf(e.currentTarget)
    const focusAt = (i: number) => items[Math.max(0, Math.min(items.length - 1, i))]?.focus()

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (isFolder) setOpen(node.path, !open)
        else onOpen(node.path)
        break
      case 'ArrowDown':
        focusAt(index + 1)
        break
      case 'ArrowUp':
        focusAt(index - 1)
        break
      case 'Home':
        focusAt(0)
        break
      case 'End':
        focusAt(items.length - 1)
        break
      case 'ArrowRight':
        if (isFolder && !open) setOpen(node.path, true)
        else if (open) focusAt(index + 1)
        break
      case 'ArrowLeft':
        if (open) setOpen(node.path, false)
        else e.currentTarget.parentElement?.closest<HTMLElement>('[role=treeitem]')?.focus()
        break
      default:
        return
    }
    e.preventDefault()
  }

  const renderNodes = (nodes: TreeNode[], depth: number) =>
    nodes.map((node) => {
      const indent = { paddingLeft: 8 + depth * 12 }
      const itemProps = {
        className: 'explorer-item',
        role: 'treeitem',
        'aria-label': node.name,
        tabIndex: node.path === tabStop ? 0 : -1,
        onFocus: (e: FocusEvent<HTMLElement>) => {
          if (e.target === e.currentTarget) setFocusedPath(node.path)
        },
        onKeyDown: onKeyDown(node),
      }
      if (node.kind === 'folder') {
        const open = !collapsed.has(node.path)
        return (
          <li key={node.path} {...itemProps} aria-expanded={open}>
            <div className="explorer-row" style={indent} onClick={() => setOpen(node.path, !open)}>
              <span className="explorer-chevron" aria-hidden="true">
                {open ? '▾' : '▸'}
              </span>
              {node.name}
            </div>
            {open && <ul role="group">{renderNodes(node.children, depth + 1)}</ul>}
          </li>
        )
      }
      return (
        <li key={node.path} {...itemProps} aria-selected={node.path === activeFile}>
          <div
            className={`explorer-row${node.path === activeFile ? ' is-active' : ''}`}
            style={indent}
            onClick={() => onOpen(node.path)}
          >
            <span className="explorer-chevron" aria-hidden="true" />
            {node.name}
          </div>
        </li>
      )
    })

  return (
    <aside className="explorer">
      <div className="panel-title">EXPLORER</div>
      <ul className="explorer-tree" role="tree" aria-label="Files">
        {renderNodes(tree, 0)}
      </ul>
    </aside>
  )
}
