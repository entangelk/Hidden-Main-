import { useState } from 'react'
import { buildFileTree, type TreeNode } from './fileTree'

type Props = {
  paths: string[]
  activeFile: string | null
  onOpen: (path: string) => void
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
            <div className="explorer-row" style={indent} onClick={() => toggle(node.path)}>
              <span className="explorer-chevron">{open ? '▾' : '▸'}</span>
              {node.name}
            </div>
            {open && <ul>{renderNodes(node.children, depth + 1)}</ul>}
          </li>
        )
      }
      return (
        <li key={node.path}>
          <div
            className={`explorer-row${node.path === activeFile ? ' is-active' : ''}`}
            style={indent}
            onClick={() => onOpen(node.path)}
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
      <ul className="explorer-tree">{renderNodes(buildFileTree(paths), 0)}</ul>
    </aside>
  )
}
