type Props = {
  openFiles: string[]
  activeFile: string | null
  dirtyFiles: Set<string>
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export function Tabs({ openFiles, activeFile, dirtyFiles, onSelect, onClose }: Props) {
  return (
    <div className="tabs" role="tablist">
      {openFiles.map((path) => (
        <div
          key={path}
          className={`tab${path === activeFile ? ' is-active' : ''}${dirtyFiles.has(path) ? ' is-dirty' : ''}`}
          title={path}
        >
          <button
            className="tab-label"
            role="tab"
            aria-selected={path === activeFile}
            onClick={() => onSelect(path)}
          >
            {path.split('/').pop()}
          </button>
          <button className="tab-close" aria-label={`Close ${path}`} onClick={() => onClose(path)}>
            <span className="tab-close-x">×</span>
            <span className="tab-dirty-dot">●</span>
          </button>
        </div>
      ))}
    </div>
  )
}
