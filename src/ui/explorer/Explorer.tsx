import { useState, type KeyboardEvent } from 'react'
import { buildFileTree, type TreeNode } from './fileTree'

type Props = {
  paths: string[]
  activeFile: string | null
  onOpen: (path: string) => void
}

// Rows act like buttons: Enter or Space activates them.
const activateOnKey = (action: () => void) => (e: KeyboardEvent) => {
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
          <li key={node.path}>
            <div
              className="explorer-row"
              style={indent}
              role="treeitem"
              aria-expanded={open}
              tabIndex={0}
              onClick={() => toggle(node.path)}
              onKeyDown={activateOnKey(() => toggle(node.path))}
            >
              <span className="explorer-chevron">{open ? '▾' : '▸'}</span>
              {node.name}
            </div>
            {open && <ul role="group">{renderNodes(node.children, depth + 1)}</ul>}
          </li>
        )
      }
      return (
        <li key={node.path}>
          <div
            className={`explorer-row${node.path === activeFile ? ' is-active' : ''}`}
            style={indent}
            role="treeitem"
            aria-selected={node.path === activeFile}
            tabIndex={0}
            onClick={() => onOpen(node.path)}
            onKeyDown={activateOnKey(() => onOpen(node.path))}
          >
            <span className="explorer-chevron" />
            {node.name}
          </div>
        </li>
      )
    })

  return (
    <aside className="explorer">
      <div className="panel-title">EXPLORER</div>
      <ul className="explorer-tree" role="tree" aria-label="Files">{renderNodes(buildFileTree(paths), 0)}</ul>
    </aside>
  )
}
