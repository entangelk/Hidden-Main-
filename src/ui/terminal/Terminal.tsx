import { useEffect, useRef } from 'react'
import type { LogLine } from '../../engine/types'

type Props = { lines: LogLine[] }

export function Terminal({ lines }: Props) {
  const bodyRef = useRef<HTMLPreElement>(null)

  // Keep the newest output in view, like a real terminal.
  useEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [lines])

  return (
    <section className="terminal">
      <div className="panel-title">TERMINAL</div>
      <pre className="terminal-body" ref={bodyRef}>
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line is-${line.level}`}>
            {line.text}
          </div>
        ))}
      </pre>
    </section>
  )
}
