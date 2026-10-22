type Props = {
  openFiles: string[]
  activeFile: string | null
  dirtyFiles: Set<string>
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

// Plain buttons rather than ARIA tabs: each tab carries its own close button, which the tab
// role does not allow inside a tablist.
export function Tabs({ openFiles, activeFile, dirtyFiles, onSelect, onClose }: Props) {
  return (
    <div className="tabs" aria-label="Open editors">
      {openFiles.map((path) => (
        <div
          key={path}
          className={`tab${path === activeFile ? ' is-active' : ''}${dirtyFiles.has(path) ? ' is-dirty' : ''}`}
          title={path}
          onClick={() => onSelect(path)}
        >
          <button className="tab-label" aria-current={path === activeFile ? 'true' : undefined}>
            {path.split('/').pop()}
          </button>
          <button
            className="tab-close"
            aria-label={`Close ${path}`}
            onClick={(e) => {
              e.stopPropagation()
              onClose(path)
            }}
          >
            <span className="tab-close-x">×</span>
            <span className="tab-dirty-dot">●</span>
          </button>
        </div>
      ))}
    </div>
  )
}
