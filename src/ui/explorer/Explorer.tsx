import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { buildFileTree, type TreeNode } from './fileTree'
import { tabStopPath, treeKeyAction, visiblePaths } from './treeNav'

type Props = {
  paths: string[]
  activeFile: string | null
  onOpen: (path: string) => void
}

export function Explorer({ paths, activeFile, onOpen }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  // Roving tab stop: one item is reachable with Tab, arrow keys move between items.
  const [focusedPath, setFocusedPath] = useState<string | null>(null)
  const treeRef = useRef<HTMLUListElement>(null)

  const setOpen = (path: string, open: boolean) =>
    setCollapsed((prev) => {
      if (prev.has(path) === !open) return prev
      const next = new Set(prev)
      if (open) next.delete(path)
      else next.add(path)
      return next
    })

  const tree = buildFileTree(paths)
  const visible = visiblePaths(tree, collapsed)
  const tabStop = tabStopPath(visible, focusedPath, activeFile)

  // Plain keys only: Ctrl/Cmd+Enter is left to the global run shortcut.
  const onKeyDown = (node: TreeNode) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return
    const isFolder = node.kind === 'folder'
    const action = treeKeyAction(
      e.key,
      { path: node.path, isFolder, open: isFolder && !collapsed.has(node.path) },
      visible,
    )
    if (!action) return
    e.preventDefault()
    if (action.type === 'setOpen') setOpen(node.path, action.open)
    else if (action.type === 'openFile') onOpen(node.path)
    else
      treeRef.current
        ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(action.path)}"]`)
        ?.focus()
  }

  const renderNodes = (nodes: TreeNode[], depth: number) =>
    nodes.map((node) => {
      const indent = { paddingLeft: 8 + depth * 12 }
      const itemProps = {
        className: 'explorer-item',
        role: 'treeitem',
        'aria-label': node.name,
        'data-path': node.path,
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
      <ul className="explorer-tree" role="tree" aria-label="Files" ref={treeRef}>
        {renderNodes(tree, 0)}
      </ul>
    </aside>
  )
}
