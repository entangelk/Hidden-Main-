type Props = {
  openFiles: string[]
  activeFile: string | null
  onSelect: (path: string) => void
  onClose: (path: string) => void
}

export function Tabs({ openFiles, activeFile, onSelect, onClose }: Props) {
  return (
    <div className="tabs">
      {openFiles.map((path) => (
        <div
          key={path}
          className={`tab${path === activeFile ? ' is-active' : ''}`}
          title={path}
          onClick={() => onSelect(path)}
        >
          <span>{path.split('/').pop()}</span>
          <button
            className="tab-close"
            aria-label={`Close ${path}`}
            onClick={(e) => {
              e.stopPropagation()
              onClose(path)
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
