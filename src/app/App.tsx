import { useCallback, useEffect, useState } from 'react'
import { CodeEditor } from '../ui/editor/CodeEditor'
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
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set())
  const [terminalLines, setTerminalLines] = useState<string[]>([])

  const setDirty = useCallback((path: string, dirty: boolean) => {
    setDirtyFiles((prev) => {
      if (prev.has(path) === dirty) return prev
      const next = new Set(prev)
      if (dirty) next.add(path)
      else next.delete(path)
      return next
    })
  }, [])

  // P01 wiring check only: P02 replaces this with the parser/engine run.
  const run = useCallback(() => {
    if (activeFile) setTerminalLines((prev) => [...prev, `$ python ${activeFile}`])
  }, [activeFile])

  // Ctrl/Cmd+Enter outside the editor; inside it, Monaco's own command handles the key.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return
      if (e.target instanceof Element && e.target.closest('.monaco-editor')) return
      e.preventDefault()
      run()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [run])

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
        <Tabs
          openFiles={openFiles}
          activeFile={activeFile}
          dirtyFiles={dirtyFiles}
          onSelect={setActiveFile}
          onClose={close}
        />
        <CodeEditor files={sampleFiles} activeFile={activeFile} onDirtyChange={setDirty} onRun={run} />
        <Terminal lines={terminalLines} />
      </main>
      <StatusBar activeFile={activeFile} />
    </div>
  )
}
