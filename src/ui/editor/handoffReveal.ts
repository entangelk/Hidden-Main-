import { HANDOFF_FUNCTION } from '../../engine/render'

export const HANDOFF_DEF = `def ${HANDOFF_FUNCTION}(`

/** True when the engine text just gained the pointer to the next file (architecture §5.2). */
export function gainedHandoff(previousText: string | undefined, text: string): boolean {
  return text.includes(HANDOFF_DEF) && !previousText?.includes(HANDOFF_DEF)
}
