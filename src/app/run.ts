import { apply, derive } from '../engine/derive'
import { parse } from '../engine/parser'
import { applyEdits } from '../engine/slots'
import type { LogLine, PlayerEdits, Progress, Scenario } from '../engine/types'
import { parseErrorLine } from './terminalMessages'

export type RunResult = {
  /** Transient Terminal lines (notices, errors). The engine's own log comes from derive. */
  lines: LogLine[]
  /** Set only when the run solved the scene. */
  progress?: Progress
}

const lineOf = (text: string, offset: number) => text.slice(0, offset).split('\n').length
const notice = (text: string): LogLine => ({ level: 'info', text })

/**
 * One Ctrl/Cmd+Enter (architecture §3, SoT §3.5). Pure. Every early exit returns lines only, so
 * nothing changes before validation passes.
 */
export function runScene(
  scenario: Scenario,
  progress: Progress,
  edits: PlayerEdits,
  activeFile: string | null,
): RunResult {
  const state = derive(scenario, progress)
  const scene = scenario.scenes.find((s) => s.id === state.currentSceneId)
  if (!scene) return { lines: [notice('처리할 사건이 없습니다.')] }
  const file = scenario.stages.find((st) => st.id === scene.stageId)!.filePath
  if (activeFile !== file) {
    return { lines: [notice(`실행할 파일: ${file}${activeFile ? ` (현재 탭: ${activeFile})` : ''}`)] }
  }
  const view = state.files[file]
  const literals = Object.fromEntries(
    view.valueSlots.map((s) => [s.field, edits[scene.id]?.[s.field] ?? s.defaultLiteral]),
  )
  const result = parse(scene.id, scene.editableFields, literals)
  if (!result.ok) {
    const shown = applyEdits(view, edits)
    return {
      lines: [
        notice(`$ python ${file}`),
        { level: 'error', text: 'Traceback (most recent call last):' },
        ...result.errors.flatMap((error): LogLine[] => {
          const slot = shown.valueSlots.find((s) => s.field === error.field)
          const field = scene.editableFields.find((f) => f.name === error.field)!
          return [
            { level: 'error', text: `  File "${file}", line ${slot ? lineOf(shown.text, slot.start) : '?'}, in ${scene.functionName}` },
            { level: 'error', text: parseErrorLine(error, field) },
          ]
        }),
      ],
    }
  }
  return { lines: [], progress: apply(scenario, progress, result.choice) }
}
