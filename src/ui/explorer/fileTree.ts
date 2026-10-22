export type TreeNode =
  | { kind: 'folder'; name: string; path: string; children: TreeNode[] }
  | { kind: 'file'; name: string; path: string }

// Folders first, then files; each group sorted by name.
function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort((a, b) =>
    a.kind !== b.kind ? (a.kind === 'folder' ? -1 : 1) : a.name.localeCompare(b.name),
  )
}

export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []
  for (const path of paths) {
    const parts = path.split('/')
    let level = root
    parts.forEach((name, i) => {
      const nodePath = parts.slice(0, i + 1).join('/')
      if (i === parts.length - 1) {
        level.push({ kind: 'file', name, path: nodePath })
        return
      }
      let folder = level.find(
        (n): n is Extract<TreeNode, { kind: 'folder' }> => n.kind === 'folder' && n.name === name,
      )
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
