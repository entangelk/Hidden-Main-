import { derive } from '../../engine/derive'
import { parse } from '../../engine/parser'
import { findValueSlots } from '../../engine/slots'
import type { EditableField, FileView, LogLine, PlayerEdits, Progress, Scenario } from '../../engine/types'
import { failureLines } from '../run'
import template from './main.py?raw'

// main.py: the scenario list (SoT §3.7). It belongs to the app, not to any scenario, and its two
// values are edited and run like a scene's.
export const HUB_FILE = 'main.py'
/** Key of main.py's values in PlayerEdits and ValueSlot.sceneId; no scenario uses it as a scene id. */
export const HUB_SCENE = 'hub'
const FUNCTION = 'select_scenario'

export type HubStatus = 'new' | 'playing' | 'done'
const label: Record<HubStatus, string> = { new: '새 게임', playing: '진행 중', done: '완료' }

export function statusOf(scenario: Scenario, progress: Progress): HubStatus {
  if (!progress.choices.length) return 'new'
  return derive(scenario, progress).ending ? 'done' : 'playing'
}

export function hubFields(count: number): EditableField[] {
  return [
    { name: 'scenario', type: 'int', options: Array.from({ length: count }, (_, i) => i + 1) },
    { name: 'restart', type: 'bool' },
  ]
}

/** main.py as shown: every scenario with its status, the open one preselected in `scenario`. */
export function hubView(scenarios: Scenario[], statuses: HubStatus[], activeId: string | null): FileView {
  const list = scenarios
    .map((s, i) => `    #   ${i + 1}. ${s.title} — ${s.summary} [${label[statuses[i]]}${s.id === activeId ? ', 지금 열림' : ''}]`)
    .join('\n')
  const preset = scenarios.findIndex((s) => s.id === activeId) + 1 || 1
  const text = template
    .replace(/\r\n?/g, '\n')
    // Function replacers: a title with `$&` or similar must be inserted as is.
    .replace('    # {scenarios}', () => list)
    .replace(/^( +scenario = )1$/m, (_, head: string) => `${head}${preset}`)
  return { text, valueSlots: findValueSlots(text, HUB_SCENE, FUNCTION, hubFields(scenarios.length)) }
}

export type HubResult = {
  lines: LogLine[]
  /** Set when the values are valid: the chosen scenario (0-based) and whether to wipe its save. */
  pick?: { index: number; restart: boolean }
}

/** Ctrl/Cmd+Enter in main.py. Pure; invalid values print the same Traceback as a scene. */
export function runHub(view: FileView, edits: PlayerEdits, count: number): HubResult {
  const fields = hubFields(count)
  const literals = Object.fromEntries(
    view.valueSlots.map((s) => [s.field, edits[HUB_SCENE]?.[s.field] ?? s.defaultLiteral]),
  )
  const result = parse(HUB_SCENE, fields, literals)
  if (!result.ok) return { lines: failureLines(HUB_FILE, view, edits, fields, FUNCTION, result.errors) }
  const { scenario, restart } = result.choice.values
  return { lines: [], pick: { index: (scenario as number) - 1, restart: restart as boolean } }
}
