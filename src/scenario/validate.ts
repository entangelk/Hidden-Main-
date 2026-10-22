// Authoring checks for a scenario (P04 scope, architecture §5.1/§6.1, data contract §3).
// Used by tests; returns human-readable problems instead of throwing so one run lists them all.
import { derive } from '../engine/derive'
import { parse } from '../engine/parser'
import { findValueSlots, functionBlock } from '../engine/slots'
import type { Choice, EditableField, Scenario, Scene, Value } from '../engine/types'

const DIRECTIVE_LINE = /^ *# @(if|else|end)\b/m

/** Values worth trying for a field: every option, both bools, and number bounds plus condition edges. */
function candidates(field: EditableField, scene: Scene): Value[] {
  switch (field.type) {
    case 'int':
      return field.options
    case 'string':
      return field.options
    case 'bool':
      return [true, false]
    case 'number': {
      const edges = scene.transitions.flatMap((t) =>
        t.when.flatMap((c) => ('choice' in c.ref && c.ref.choice === field.name && typeof c.value === 'number' ? [c.value] : [])),
      )
      return [...new Set([field.min, field.max, ...edges])].filter((v) => v >= field.min && v <= field.max)
    }
  }
}

function product(fields: EditableField[], scene: Scene): Record<string, Value>[] {
  return fields.reduce<Record<string, Value>[]>(
    (acc, f) => acc.flatMap((vals) => candidates(f, scene).map((v) => ({ ...vals, [f.name]: v }))),
    [{}],
  )
}

export type Exploration = { endings: Set<string>; reachedScenes: Set<string>; states: number }

/**
 * Plays every distinct path (states deduplicated by current scene + flags) and checks each
 * rendered screen. Problems are pushed to `problems`.
 */
export function explore(scenario: Scenario, problems: string[]): Exploration {
  const scenes = new Map(scenario.scenes.map((s) => [s.id, s]))
  const endings = new Set<string>()
  const reachedScenes = new Set<string>()
  const seen = new Set<string>()
  const queue: Choice[][] = [[]]
  while (queue.length) {
    const choices = queue.shift()!
    let state
    try {
      state = derive(scenario, { choices })
    } catch (e) {
      problems.push(`render failed after [${choices.map((c) => c.sceneId).join(' > ')}]: ${(e as Error).message}`)
      continue
    }
    for (const [path, view] of Object.entries(state.files)) {
      if (DIRECTIVE_LINE.test(view.text)) problems.push(`${path}: a # @if/@else/@end line is visible on screen`)
    }
    if (state.ending) {
      endings.add(state.ending)
      continue
    }
    const key = `${state.currentSceneId}|${JSON.stringify(Object.entries(state.flags).sort())}`
    if (seen.has(key)) continue
    seen.add(key)
    const scene = scenes.get(state.currentSceneId!)!
    reachedScenes.add(scene.id)
    for (const values of product(scene.editableFields, scene)) queue.push([...choices, { sceneId: scene.id, values }])
  }
  return { endings, reachedScenes, states: seen.size }
}

/** Static checks of data and templates. */
export function staticProblems(scenario: Scenario): string[] {
  const problems: string[] = []
  const sceneIds = new Set(scenario.scenes.map((s) => s.id))
  const endingIds = new Set(scenario.endings.map((e) => e.id))
  const stageOf = (s: Scene) => scenario.stages.find((st) => st.id === s.stageId)

  if (!sceneIds.has(scenario.startSceneId)) problems.push(`start scene ${scenario.startSceneId} missing`)
  for (const st of scenario.stages) {
    const t = st.template
    if (t.includes('\t')) problems.push(`${st.filePath}: tab character`)
    if (t.includes('"""') || t.includes("'''")) problems.push(`${st.filePath}: triple-quoted string`)
    const order = st.sceneIds.map((id) => scenario.scenes.find((s) => s.id === id)?.functionName ?? '?')
    const positions = order.map((fn) => functionBlock(t, fn)?.[0] ?? -1)
    if (positions.includes(-1)) problems.push(`${st.filePath}: scene function missing (${order.join(', ')})`)
    if (positions.some((p, i) => i > 0 && p < positions[i - 1])) problems.push(`${st.filePath}: function order differs from sceneIds`)
  }
  for (const scene of scenario.scenes) {
    const stage = stageOf(scene)
    if (!stage || !stage.sceneIds.includes(scene.id)) {
      problems.push(`${scene.id}: not listed in its stage`)
      continue
    }
    const block = functionBlock(stage.template, scene.functionName)
    if (!block) continue
    const body = stage.template.slice(block[0], block[1])
    if (/\n *def /.test(body)) problems.push(`${scene.id}: nested def inside the scene function`)
    for (const f of scene.editableFields) {
      const lines = body.match(new RegExp(`^ *${f.name} *=`, 'gm')) ?? []
      if (lines.length !== 1) problems.push(`${scene.id}.${f.name}: ${lines.length} assignment lines (need exactly 1)`)
    }
    const slots = findValueSlots(stage.template, scene.id, scene.functionName, scene.editableFields)
    if (slots.length !== scene.editableFields.length) problems.push(`${scene.id}: a field has no literal slot (default must be a plain literal)`)
    const defaults = Object.fromEntries(slots.map((s) => [s.field, s.defaultLiteral]))
    if (!parse(scene.id, scene.editableFields, defaults).ok) problems.push(`${scene.id}: template default is not a valid value`)
    const comments = body.split('\n').filter((l) => l.trim().startsWith('#')).join('\n')
    for (const f of scene.editableFields) {
      if (f.type === 'int') {
        const listed = [...comments.matchAll(/^ *#\s+(\d+)\.\s/gm)].map((m) => Number(m[1]))
        if (listed.join(',') !== f.options.join(',')) problems.push(`${scene.id}.${f.name}: comment options [${listed}] ≠ field options [${f.options}]`)
      }
      if (f.type === 'string') {
        for (const o of f.options) if (!comments.includes(`"${o}"`)) problems.push(`${scene.id}.${f.name}: option "${o}" not explained in comments`)
      }
    }
    const last = scene.transitions.at(-1)
    if (!last || last.when.length) problems.push(`${scene.id}: last transition must have an empty condition`)
    for (const t of scene.transitions) {
      if ('scene' in t.next && !sceneIds.has(t.next.scene)) problems.push(`${scene.id}: unknown next scene ${t.next.scene}`)
      if ('ending' in t.next && !endingIds.has(t.next.ending)) problems.push(`${scene.id}: unknown ending ${t.next.ending}`)
      for (const c of t.when) {
        if ((c.op === '>=' || c.op === '<=') && typeof c.value !== 'number') problems.push(`${scene.id}: ${c.op} on a non-number`)
        if ('choice' in c.ref) {
          const name = c.ref.choice
          if (!scene.editableFields.some((f) => f.name === name)) problems.push(`${scene.id}: condition on unknown field ${name}`)
        }
      }
    }
  }
  // The transition graph must go forward only (no return to a reached scene, data contract §3).
  const visiting = new Set<string>()
  const done = new Set<string>()
  const visit = (id: string): boolean => {
    if (done.has(id)) return false
    if (visiting.has(id)) return true
    visiting.add(id)
    const s = scenario.scenes.find((x) => x.id === id)
    const cyclic = (s?.transitions ?? []).some((t) => 'scene' in t.next && visit(t.next.scene))
    visiting.delete(id)
    done.add(id)
    return cyclic
  }
  if (scenario.scenes.some((s) => visit(s.id))) problems.push('transition graph has a cycle')
  return problems
}

/** Everything: static checks plus exhaustive play. */
export function validateScenario(scenario: Scenario): { problems: string[]; exploration: Exploration } {
  const problems = staticProblems(scenario)
  const exploration = explore(scenario, problems)
  for (const s of scenario.scenes) if (!exploration.reachedScenes.has(s.id)) problems.push(`${s.id}: unreachable`)
  for (const e of scenario.endings) if (!exploration.endings.has(e.id)) problems.push(`ending ${e.id}: unreachable`)
  return { problems, exploration }
}
