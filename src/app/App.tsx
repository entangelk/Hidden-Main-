import { useState } from 'react'
import { Explorer } from '../ui/explorer/Explorer'
import { StatusBar } from '../ui/statusbar/StatusBar'
import { Tabs } from '../ui/tabs/Tabs'
import { Terminal } from '../ui/terminal/Terminal'
import { sampleFiles } from './sampleFiles'
import './App.css'

const paths = Object.keys(sampleFiles)

export default function App() {
  const [openFiles, setOpenFiles] = useState<string[]>(['main.py'])
  const [activeFile, setActiveFile] = useState<string | null>('main.py')

  const open = (path: string) => {
    setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]))
    setActiveFile(path)
  }

  const close = (path: string) => {
    const index = openFiles.indexOf(path)
    const remaining = openFiles.filter((p) => p !== path)
    setOpenFiles(remaining)
    if (path === activeFile) setActiveFile(remaining[Math.min(index, remaining.length - 1)] ?? null)
  }

  return (
    <div className="workbench">
      <Explorer paths={paths} activeFile={activeFile} onOpen={open} />
      <main className="editor-group">
        <Tabs openFiles={openFiles} activeFile={activeFile} onSelect={setActiveFile} onClose={close} />
        <pre className="editor-placeholder">{activeFile ? sampleFiles[activeFile] : ''}</pre>
        <Terminal lines={[]} />
      </main>
      <StatusBar activeFile={activeFile} />
    </div>
  )
}
