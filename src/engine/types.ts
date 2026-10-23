// Canonical engine contracts (docs/architecture/01_data_contracts.md).

export type SceneId = string
export type StageId = string
export type EndingId = string

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

export type LogLine = { level: 'info' | 'warn' | 'error'; text: string }

// ---- Scenario (static, authored as plain data: no functions or closures, DB-04) ----

export type Scenario = {
  id: string
  /** Shown in the scenario list of main.py. */
  title: string
  /** One line under the title in that list. */
  summary: string
  /** Bumped whenever content changes; decides save compatibility. */
  version: number
  /** Files visible from the start that hold no scene (settings, ...). main.py belongs to the app. */
  initialFiles: StaticFile[]
  stages: Stage[]
  /** Every scene, once. Stages list their scenes by id. */
  scenes: Scene[]
  endings: Ending[]
  startSceneId: SceneId
}

export type StaticFile = { path: string; content: string }

export type Stage = {
  id: StageId
  filePath: string
  /** .py source. Scene functions are revealed one by one as they are reached (DB-03). */
  template: string
  /** Scene order inside the file. */
  sceneIds: SceneId[]
}

export type Scene = {
  id: SceneId
  stageId: StageId
  functionName: string
  editableFields: EditableField[]
  /** First transition whose condition holds wins; the last one must have an empty condition. */
  transitions: Transition[]
  /**
   * Search scenes only (SoT §3.8): how many runs the player gets. A `miss` transition keeps the
   * scene current until the last run, which then takes it like any other transition.
   */
  attempts?: number
}

export type Transition = {
  /** A wrong place to look: with runs left, only its log is shown and the scene stays current. */
  miss?: true
  when: Condition
  effects: Effect[]
  log: LogLine[]
  next: { scene: SceneId } | { ending: EndingId }
}

/** All clauses must hold (AND). Empty = always true. */
export type Condition = Clause[]

export type Clause = {
  ref: { choice: string } | { flag: string }
  /** `>=` and `<=` compare numbers only. */
  op: '==' | '!=' | '>=' | '<='
  value: Value
}

export type Effect = { flag: string; value: Value }

export type Ending = { id: EndingId; log: LogLine[] }

// ---- Progress (canonical, saved) and derived state ----

export type Progress = {
  /** Applied choices in order: the only canonical progress record. */
  choices: Choice[]
}

export type DerivedState = {
  /** null once an ending is reached. */
  currentSceneId: SceneId | null
  flags: Record<string, Value>
  ending: EndingId | null
  /** The whole Terminal history, rebuilt by replay. */
  log: LogLine[]
  /** Every visible file (initial + unlocked stages) as the engine renders it, before player edits. */
  files: Record<string, FileView>
  /** File play has left → the file its next_file() points to (architecture §5.2). */
  handoffs: Record<string, string>
  /** Runs already spent on the current scene by misses (0 when none or at an ending). */
  missesOnCurrent: number
}
