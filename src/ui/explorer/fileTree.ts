export type TreeNode =
  | { kind: 'folder'; name: string; path: string; children: TreeNode[] }
  | { kind: 'file'; name: string; path: string }

// Folders first, then files; each group sorted by name, case-insensitive. The locale is pinned
// so the order does not depend on the machine running it.
function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort((a, b) =>
    a.kind !== b.kind
      ? a.kind === 'folder'
        ? -1
        : 1
      : a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  )
}

export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []
  for (const path of new Set(paths)) {
    const parts = path.split('/')
    let level = root
    parts.forEach((name, i) => {
      const nodePath = parts.slice(0, i + 1).join('/')
      const existing = level.find((n) => n.name === name)
      if (i === parts.length - 1) {
        if (existing) throw new Error(`Path is both a file and a folder: ${nodePath}`)
        level.push({ kind: 'file', name, path: nodePath })
        return
      }
      if (existing?.kind === 'file') throw new Error(`Path is both a file and a folder: ${nodePath}`)
      let folder = existing
      if (!folder) {
        folder = { kind: 'folder', name, path: nodePath, children: [] }
        level.push(folder)
      }
      level = folder.children
    })
  }
  const sortDeep = (nodes: TreeNode[]): TreeNode[] => {
    for (const n of nodes) if (n.kind === 'folder') sortDeep(n.children)
    return sortNodes(nodes)
  }
  return sortDeep(root)
}
