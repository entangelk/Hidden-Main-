import { parse } from '../engine/parser'
import { applyEdits } from '../engine/slots'
import type { Choice, PlayerEdits } from '../engine/types'
import { derivePrototype } from './prototype'
import { parseErrorLine } from './terminalMessages'

export type RunResult = {
  /** Terminal lines to print. */
  lines: string[]
  /** Set only when validation passed: the choice to append to the progress record. */
  choice?: Choice
}

const lineOf = (text: string, offset: number) => text.slice(0, offset).split('\n').length

/**
 * One Ctrl/Cmd+Enter (architecture §3). Pure: the caller applies `choice` and prints `lines`.
 * Every early exit returns lines only, so nothing changes before validation passes.
 */
export function runPrototype(choices: Choice[], edits: PlayerEdits, activeFile: string | null): RunResult {
  const state = derivePrototype(choices)
  const scene = state.currentScene
  if (!scene) return { lines: ['처리할 사건이 없습니다.'] }
  if (activeFile !== scene.file) {
    return { lines: [`실행할 파일: ${scene.file}${activeFile ? ` (현재 탭: ${activeFile})` : ''}`] }
  }
  const view = state.views[scene.file]
  const literals = Object.fromEntries(
    view.valueSlots.map((s) => [s.field, edits[scene.id]?.[s.field] ?? s.defaultLiteral]),
  )
  const result = parse(scene.id, scene.editableFields, literals)
  if (!result.ok) {
    const shown = applyEdits(view, edits)
    return {
      lines: [
        `$ python ${scene.file}`,
        'Traceback (most recent call last):',
        ...result.errors.flatMap((error) => {
          const slot = shown.valueSlots.find((s) => s.field === error.field)
          const field = scene.editableFields.find((f) => f.name === error.field)!
          return [
            `  File "${scene.file}", line ${slot ? lineOf(shown.text, slot.start) : '?'}, in ${scene.functionName}`,
            parseErrorLine(error, field),
          ]
        }),
      ],
    }
  }
  const next = derivePrototype([...choices, result.choice])
  const created = next.unlockedFiles.filter((f) => !state.unlockedFiles.includes(f))
  return {
    lines: [
      `$ python ${scene.file}`,
      ...scene.outcomes[result.choice.values.action as number],
      ...created.map((f) => `[workspace] ${f} 생성됨`),
    ],
    choice: result.choice,
  }
}
