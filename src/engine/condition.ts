import type { Condition, Value } from './types'

/** Evaluates a condition against this choice's values and the accumulated flags. */
export function holds(
  condition: Condition,
  choiceValues: Record<string, Value>,
  flags: Record<string, Value>,
): boolean {
  return condition.every((clause) => {
    const actual = 'choice' in clause.ref ? choiceValues[clause.ref.choice] : flags[clause.ref.flag]
    switch (clause.op) {
      case '==':
        return actual === clause.value
      case '!=':
        return actual !== clause.value
      case '>=':
        return typeof actual === 'number' && typeof clause.value === 'number' && actual >= clause.value
      case '<=':
        return typeof actual === 'number' && typeof clause.value === 'number' && actual <= clause.value
    }
  })
}
