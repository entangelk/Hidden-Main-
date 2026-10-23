// Authoring checks for a scenario (P04 scope, architecture §5.1/§6.1, data contract §3).
// Used by tests; returns human-readable problems instead of throwing so one run lists them all.
import { holds } from '../engine/condition'
import { derive } from '../engine/derive'
import { parse } from '../engine/parser'
import { DIRECTIVE, HANDOFF_FUNCTION, parseIf } from '../engine/render'
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
      // Each edge and its neighbours, so ==, !=, >= and <= branches all get a value on each side.
      const near = edges.flatMap((e) => [e - 1, e, e + 1])
      return [...new Set([field.min, field.max, ...near])].filter((v) => v >= field.min && v <= field.max)
    }
  }
}

function product(fields: EditableField[], scene: Scene): Record<string, Value>[] {
  return fields.reduce<Record<string, Value>[]>(
    (acc, f) => acc.flatMap((vals) => candidates(f, scene).map((v) => ({ ...vals, [f.name]: v }))),
    [{}],
  )
}

export type Exploration = {
  endings: Set<string>
  reachedScenes: Set<string>
  /** `${sceneId}#${index}` of every transition taken on some path. */
  firedTransitions: Set<string>
  /** Outcomes seen for each comment-variant condition, keyed `${sceneId}: ${directive line}`. */
  variantOutcomes: Map<string, Set<boolean>>
  states: number
}

/** Option explanations the player must see on screen for the current scene (R-07). */
function optionProblems(scene: Scene, shownText: string): string[] {
  const block = functionBlock(shownText, scene.functionName)
  if (!block) return []
  const comments = shownText
    .slice(block[0], block[1])
    .split('\n')
    .filter((l) => l.trim().startsWith('#'))
    .join('\n')
  const problems: string[] = []
  for (const f of scene.editableFields) {
    if (f.type === 'int') {
      const listed = [...comments.matchAll(/^ *#\s+(\d+)\.\s/gm)].map((m) => Number(m[1]))
      const min = Math.min(...f.options)
      const max = Math.max(...f.options)
      const contiguous = f.options.length === max - min + 1
      const asRange = contiguous && comments.includes(`${min}~${max}`)
      if (!asRange && listed.join(',') !== f.options.join(',')) {
        problems.push(`${scene.id}.${f.name}: comment options [${listed}] ≠ field options [${f.options}]`)
      }
    }
    if (f.type === 'string') {
      for (const o of f.options) if (!comments.includes(`"${o}"`)) problems.push(`${scene.id}.${f.name}: option "${o}" not explained in comments`)
    }
    if (f.type === 'number' && !comments.includes(`${f.min}~${f.max}`)) problems.push(`${scene.id}.${f.name}: range ${f.min}~${f.max} not explained in comments`)
  }
  return problems
}

/**
 * Plays every distinct path (states deduplicated by current scene + flags) and checks each
 * rendered screen. Problems are pushed to `problems`.
 */
export function explore(scenario: Scenario, problems: string[]): Exploration {
  const scenes = new Map(scenario.scenes.map((s) => [s.id, s]))
  const endings = new Set<string>()
  const reachedScenes = new Set<string>()
  const firedTransitions = new Set<string>()
  const variantOutcomes = new Map<string, Set<boolean>>()
  const reported = new Set<string>()
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
    const stage = scenario.stages.find((st) => st.id === scene.stageId)!
    const file = stage.filePath
    // The scene was just reached, so the current flags are the ones its comment variants use.
    const block = functionBlock(stage.template, scene.functionName)
    const lines = block ? stage.template.slice(block[0], block[1]).split('\n') : []
    for (const [i, line] of lines.entries()) {
      const d = DIRECTIVE.exec(line)
      if (!d || d[1] !== 'if') continue
      const end = lines.findIndex((l, j) => j > i && /^ *# @end\b/.test(l))
      const hasElse = lines.slice(i + 1, end).some((l) => /^ *# @else\b/.test(l))
      const key = `${scene.id}: ${line.trim()}${hasElse ? ' [else]' : ''}`
      const seen = variantOutcomes.get(key) ?? new Set<boolean>()
      seen.add(holds([parseIf(d[2], line)], {}, state.flags))
      variantOutcomes.set(key, seen)
    }
    for (const problem of optionProblems(scene, state.files[file].text)) {
      if (!reported.has(problem)) problems.push(problem)
      reported.add(problem)
    }
    for (const values of product(scene.editableFields, scene)) {
      const fired = scene.transitions.findIndex((t) => holds(t.when, values, state.flags))
      if (fired >= 0) firedTransitions.add(`${scene.id}#${fired}`)
      queue.push([...choices, { sceneId: scene.id, values }])
    }
  }
  return { endings, reachedScenes, firedTransitions, variantOutcomes, states: seen.size }
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
    if (functionBlock(t, HANDOFF_FUNCTION)) problems.push(`${st.filePath}: ${HANDOFF_FUNCTION}() is reserved for the engine`)
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

  // Dead content: a comment variant on a flag nothing sets, or a flag nothing reads.
  const setFlags = new Set(scenario.scenes.flatMap((s) => s.transitions.flatMap((t) => t.effects.map((e) => e.flag))))
  const readFlags = new Set(
    scenario.scenes.flatMap((s) => s.transitions.flatMap((t) => t.when.flatMap((c) => ('flag' in c.ref ? [c.ref.flag] : [])))),
  )
  for (const st of scenario.stages) {
    for (const m of st.template.matchAll(/^ *# @if ([A-Za-z_]\w*)/gm)) {
      readFlags.add(m[1])
      if (!setFlags.has(m[1])) problems.push(`${st.filePath}: @if on flag "${m[1]}" that no transition sets`)
    }
  }
  for (const f of setFlags) if (!readFlags.has(f)) problems.push(`flag "${f}" is set but never read`)
  return problems
}

/** Everything: static checks plus exhaustive play. */
export function validateScenario(scenario: Scenario): { problems: string[]; exploration: Exploration } {
  const problems = staticProblems(scenario)
  const exploration = explore(scenario, problems)
  for (const s of scenario.scenes) if (!exploration.reachedScenes.has(s.id)) problems.push(`${s.id}: unreachable`)
  for (const e of scenario.endings) if (!exploration.endings.has(e.id)) problems.push(`ending ${e.id}: unreachable`)
  for (const [directive, outcomes] of exploration.variantOutcomes) {
    if (!outcomes.has(true)) problems.push(`${directive.replace(' [else]', '')} is never true when the scene is reached`)
    if (directive.endsWith(' [else]') && !outcomes.has(false)) {
      problems.push(`${directive.replace(' [else]', '')} is never false, so its @else is never shown`)
    }
  }
  for (const s of scenario.scenes) {
    s.transitions.forEach((_, i) => {
      if (exploration.reachedScenes.has(s.id) && !exploration.firedTransitions.has(`${s.id}#${i}`)) {
        problems.push(`${s.id}: transition ${i} can never be taken`)
      }
    })
  }
  return { problems, exploration }
}
