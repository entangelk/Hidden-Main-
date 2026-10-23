import { holds } from './condition'
import { formatLiteral, readLiteral } from './parser'
import { applyEdits, findValueSlots, functionBlock } from './slots'
import type { Choice, Clause, FileView, PlayerEdits, Scene, SceneId, Stage, Value } from './types'

// Comment-variant directives inside a scene function (DB-01). They are template-only lines and
// never reach the screen:
//     # @if <flag> <op> <literal>
//     # ...comment shown when the condition held when the scene was reached...
//     # @else
//     # ...otherwise...
//     # @end
export const DIRECTIVE = /^ *# @(if|else|end)\b(.*)$/
const IF_ARGS = /^ +([A-Za-z_]\w*) *(==|!=|>=|<=) *(.+?) *$/

export function parseIf(args: string, line: string): Clause {
  const m = IF_ARGS.exec(args)
  const lit = m && readLiteral(m[3])
  if (!m || !lit) throw new Error(`Bad @if directive: ${line.trim()}`)
  return { ref: { flag: m[1] }, op: m[2] as Clause['op'], value: lit.value }
}

/** Keeps the branch whose condition held for `flags`; drops directive lines. No nesting. */
export function resolveVariants(text: string, flags: Record<string, Value>): string {
  const out: string[] = []
  let state: 'outside' | 'taken' | 'skipped' | 'else-taken' | 'else-skipped' = 'outside'
  for (const line of text.split('\n')) {
    const d = DIRECTIVE.exec(line)
    if (!d) {
      if (state === 'outside' || state === 'taken' || state === 'else-taken') out.push(line)
      continue
    }
    const [, kind, args] = d
    if (kind === 'if') {
      if (state !== 'outside') throw new Error(`Nested @if: ${line.trim()}`)
      state = holds([parseIf(args, line)], {}, flags) ? 'taken' : 'skipped'
    } else if (args.trim() !== '') {
      throw new Error(`@${kind} takes no arguments: ${line.trim()}`)
    } else if (kind === 'else') {
      if (state !== 'taken' && state !== 'skipped') throw new Error(`@else without @if: ${line.trim()}`)
      state = state === 'taken' ? 'else-skipped' : 'else-taken'
    } else {
      if (state === 'outside') throw new Error(`@end without @if: ${line.trim()}`)
      state = 'outside'
    }
  }
  if (state !== 'outside') throw new Error('Unclosed @if')
  return out.join('\n')
}

/** Start of the blank lines directly above `offset` (so removing a block leaves no extra gap). */
function blankLinesAbove(text: string, offset: number): number {
  let start = offset
  while (start > 0) {
    const prevLineStart = text.lastIndexOf('\n', start - 2) + 1
    if (text.slice(prevLineStart, start - 1).trim() !== '') break
    start = prevLineStart
  }
  return start
}

export type SceneRender = {
  /** Flags as they were when the scene became current: its comment variants never change later. */
  flagsAtReach: Record<string, Value>
  /** Set once the scene is solved; its values are then shown fixed. */
  solved?: Choice
}

/** Name of the engine-made function that points to the next file; templates must not use it. */
export const HANDOFF_FUNCTION = 'next_file'

/** The pointer added to a stage file once play has moved on to `nextFile` (architecture §5.2). */
export function handoffBlock(indent: string, nextFile: string): string {
  return [
    `${indent}def ${HANDOFF_FUNCTION}(self):`,
    `${indent}    # 이 파일의 사건은 여기까지다.`,
    `${indent}    # 다음 사건 파일이 생성됐다: ${nextFile}`,
    '',
    `${indent}    return "${nextFile}"`,
    `${indent}    # Ctrl+Enter(macOS는 Cmd+Enter)로 실행하면 다음 파일로 넘어간다. 왼쪽 Explorer에서 열어도 된다.`,
  ].join('\n')
}

/**
 * The stage file as the player sees it before their own edits (architecture §5): only reached
 * scene functions, comment variants resolved, solved values fixed, the current scene's slots, and
 * the pointer to `handoffTo` once play has left this file for it.
 */
export function renderStage(
  stage: Stage,
  scenes: Scene[],
  reached: Map<SceneId, SceneRender>,
  currentSceneId: SceneId | null,
  handoffTo: string | null,
): FileView {
  // Offsets and directives assume LF; a template saved with CRLF must render the same.
  let text = stage.template.replace(/\r\n?/g, '\n')

  for (const scene of [...scenes].reverse()) {
    if (reached.has(scene.id)) continue
    const block = functionBlock(text, scene.functionName)
    if (!block) throw new Error(`Function ${scene.functionName} not found in ${stage.filePath}`)
    text = text.slice(0, blankLinesAbove(text, block[0])) + text.slice(block[1] + 1)
  }

  for (const scene of scenes) {
    const info = reached.get(scene.id)
    if (!info) continue
    const [start, end] = functionBlock(text, scene.functionName)!
    text = text.slice(0, start) + resolveVariants(text.slice(start, end), info.flagsAtReach) + text.slice(end)
  }

  const fixed: PlayerEdits = {}
  const slots = scenes.flatMap((scene) => {
    const info = reached.get(scene.id)
    if (!info) return []
    if (info.solved) {
      fixed[scene.id] = Object.fromEntries(
        Object.entries(info.solved.values).map(([field, value]) => [field, formatLiteral(value)]),
      )
    }
    return findValueSlots(text, scene.id, scene.functionName, scene.editableFields)
  })
  const view = applyEdits({ text, valueSlots: slots.sort((a, b) => a.start - b.start) }, fixed)
  let shown = view.text
  if (handoffTo !== null) {
    // Right below the last reached scene function, at its indent: after every slot, so no offset
    // moves, and inside the same class even when module code follows.
    const last = scenes.filter((s) => reached.has(s.id)).at(-1)!
    const [start, end] = functionBlock(shown, last.functionName)!
    const indent = shown.slice(start).match(/^ */)![0]
    shown = `${shown.slice(0, end)}\n\n${handoffBlock(indent, handoffTo)}${shown.slice(end)}`
  }
  return { text: shown, valueSlots: view.valueSlots.filter((s) => s.sceneId === currentSceneId) }
}
