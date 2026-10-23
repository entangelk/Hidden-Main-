type Props = { activeFile: string | null }

export function StatusBar({ activeFile }: Props) {
  return (
    <footer className="statusbar">
      <span>{activeFile ?? ''}</span>
      <span className="statusbar-right">
        <span>UTF-8</span>
        <span>Python</span>
      </span>
    </footer>
  )
}
