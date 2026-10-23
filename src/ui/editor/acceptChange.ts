import type { ValueSlot } from '../../engine/types'

export type TextChange = { start: number; end: number; text: string }

/**
 * Index of the slot a change may edit, or -1 to reject it (DB-02: only literal values are
 * editable). Accepted: the replaced range lies within one slot, end included, and the inserted
 * text has no line break.
 */
export function acceptChange(slots: ValueSlot[], change: TextChange): number {
  if (/[\r\n]/.test(change.text)) return -1
  return slots.findIndex((s) => change.start >= s.start && change.end <= s.end)
}
