import { useState, type KeyboardEvent } from 'react'
import { buildFileTree, type TreeNode } from './fileTree'

type Props = {
  paths: string[]
  activeFile: string | null
  onOpen: (path: string) => void
}

// Tree items act like buttons: plain Enter or Space activates them. Ctrl/Cmd+Enter is left to
// the global run shortcut.
const activateOnKey = (action: () => void) => (e: KeyboardEvent) => {
  if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    action()
  }
}

export function Explorer({ paths, activeFile, onOpen }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const renderNodes = (nodes: TreeNode[], depth: number) =>
    nodes.map((node) => {
      const indent = { paddingLeft: 8 + depth * 12 }
      if (node.kind === 'folder') {
        const open = !collapsed.has(node.path)
        return (
          <li
            key={node.path}
            className="explorer-item"
            role="treeitem"
            aria-expanded={open}
            aria-label={node.name}
            tabIndex={0}
            onKeyDown={activateOnKey(() => toggle(node.path))}
          >
            <div className="explorer-row" style={indent} onClick={() => toggle(node.path)}>
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
        <li
          key={node.path}
          className="explorer-item"
          role="treeitem"
          aria-selected={node.path === activeFile}
          aria-label={node.name}
          tabIndex={0}
          onKeyDown={activateOnKey(() => onOpen(node.path))}
        >
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
        {renderNodes(buildFileTree(paths), 0)}
      </ul>
    </aside>
  )
}
