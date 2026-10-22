import { holds } from './condition'
import { valuesFit } from './parser'
import { renderStage, type SceneRender } from './render'
import type {
  Choice,
  DerivedState,
  FileView,
  LogLine,
  Progress,
  Scenario,
  Scene,
  SceneId,
  Transition,
  Value,
} from './types'

type Replay = DerivedState & {
  /** How many leading choices replayed cleanly (all of them for a save from this version). */
  validCount: number
}

const info = (text: string): LogLine => ({ level: 'info', text })

function replay(scenario: Scenario, choices: Choice[]): Replay {
  const scenes = new Map(scenario.scenes.map((scene) => [scene.id, scene]))
  const stageOf = (scene: Scene) => scenario.stages.find((st) => st.id === scene.stageId)!

  let flags: Record<string, Value> = {}
  let currentSceneId: SceneId | null = scenario.startSceneId
  let ending: string | null = null
  const log: LogLine[] = []
  const reached = new Map<SceneId, SceneRender>()
  const unlocked = new Set<string>()

  const reach = (id: SceneId, announce: boolean) => {
    const scene = scenes.get(id)!
    const file = stageOf(scene).filePath
    reached.set(id, { flagsAtReach: flags })
    if (!unlocked.has(file)) {
      unlocked.add(file)
      if (announce) log.push(info(`[workspace] ${file} 생성됨`))
    } else if (announce) {
      log.push(info(`[workspace] ${file}: ${scene.functionName}() 추가됨`))
    }
  }
  reach(scenario.startSceneId, false)

  let validCount = 0
  for (const choice of choices) {
    const scene: Scene | undefined = currentSceneId === null ? undefined : scenes.get(currentSceneId)
    if (!scene || choice.sceneId !== scene.id || !valuesFit(scene.editableFields, choice.values)) break
    const values = choice.values
    const transition: Transition | undefined = scene.transitions.find((t) => holds(t.when, values, flags))
    if (!transition) break
    validCount++

    log.push(info(`$ python ${stageOf(scene).filePath}`), ...transition.log)
    flags = { ...flags, ...Object.fromEntries(transition.effects.map((e) => [e.flag, e.value])) }
    reached.set(scene.id, { ...reached.get(scene.id)!, solved: choice })
    const next: Transition['next'] = transition.next
    if ('ending' in next) {
      ending = next.ending
      currentSceneId = null
      log.push(...(scenario.endings.find((e) => e.id === next.ending)?.log ?? []))
    } else {
      currentSceneId = next.scene
      reach(next.scene, true)
    }
  }

  const files: Record<string, FileView> = {}
  for (const f of scenario.initialFiles) files[f.path] = { text: f.content.replace(/\r\n?/g, '\n'), valueSlots: [] }
  for (const stage of scenario.stages) {
    if (!unlocked.has(stage.filePath)) continue
    files[stage.filePath] = renderStage(
      stage,
      stage.sceneIds.map((id) => scenes.get(id)!),
      reached,
      currentSceneId,
    )
  }
  return { currentSceneId, flags, ending, log, files, validCount }
}

/** Everything the screen shows, rebuilt from the progress record (data contract §6). Pure. */
export function derive(scenario: Scenario, progress: Progress): DerivedState {
  const { validCount: _ignored, ...state } = replay(scenario, progress.choices)
  return state
}

/**
 * Appends a choice when it is for the current scene and passes the fields; otherwise returns the
 * same progress object unchanged (AC-07).
 */
export function apply(scenario: Scenario, progress: Progress, choice: Choice): Progress {
  const next = { choices: [...progress.choices, choice] }
  return replay(scenario, next.choices).validCount === next.choices.length ? next : progress
}

/** The longest prefix of `choices` that still replays on this scenario (restoring older saves). */
export function validPrefix(scenario: Scenario, choices: Choice[]): Choice[] {
  return choices.slice(0, replay(scenario, choices).validCount)
}
