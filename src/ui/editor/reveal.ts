import { HANDOFF_FUNCTION } from '../../engine/render'

export const HANDOFF_DEF = `def ${HANDOFF_FUNCTION}(`

/** Offset of the end of next_file()'s `return` line, where the cursor goes when it appears. */
export function handoffCursorOffset(text: string): number {
  const ret = text.indexOf('return ', text.indexOf(HANDOFF_DEF))
  const end = text.indexOf('\n', ret)
  return end === -1 ? text.length : end
}

/** True when the engine text just gained the pointer to the next file (architecture §5.2). */
export function gainedHandoff(previousText: string | undefined, text: string): boolean {
  return text.includes(HANDOFF_DEF) && !previousText?.includes(HANDOFF_DEF)
}

/** Key under which the editor remembers the engine text a model was last built from. */
export const baseKey = (revision: number, text: string | undefined) => `${revision}\n${text}`

/**
 * True when the engine text itself changed since `previousKey`, not only the progress revision:
 * only then does the cursor move to the current value (SoT §3.2).
 */
export function textChanged(previousKey: string | undefined, text: string): boolean {
  return previousKey === undefined || previousKey.slice(previousKey.indexOf('\n') + 1) !== text
}
