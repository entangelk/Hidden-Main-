type Props = { lines: string[] }

export function Terminal({ lines }: Props) {
  return (
    <section className="terminal">
      <div className="panel-title">TERMINAL</div>
      <pre className="terminal-body">{lines.join('\n')}</pre>
    </section>
  )
}
