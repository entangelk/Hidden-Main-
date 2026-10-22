// Canonical engine contracts (docs/architecture/01_data_contracts.md). P02 holds only the subset
// the core loop needs; P03 adds the scenario, progress and derived-state types.

export type SceneId = string

/** The only definition of an editable value's type. */
export type Value = number | boolean | string

export type EditableField =
  | { name: string; type: 'int'; options: number[] }
  | { name: string; type: 'bool' }
  | { name: string; type: 'number'; min: number; max: number }
  | { name: string; type: 'string'; options: string[] }

export type Choice = {
  sceneId: SceneId
  values: Record<string, Value>
}

export type ParseError = {
  field: string
  raw: string
  kind: 'not_literal' | 'type_mismatch' | 'out_of_range'
}

export type ParseResult = { ok: true; choice: Choice } | { ok: false; errors: ParseError[] }

/** Scene → field → raw literal the player is editing. */
export type PlayerEdits = Record<SceneId, Record<string, string>>

export type ValueSlot = {
  sceneId: SceneId
  field: string
  /** Offsets into FileView.text (UTF-16 code units). The slot covers the literal only. */
  start: number
  end: number
  /** Projection of the template's literal; the template text is canonical. */
  defaultLiteral: string
}

export type FileView = {
  text: string
  /** Editable spans of the current scene, sorted by start. Empty when it is not in this file. */
  valueSlots: ValueSlot[]
}
