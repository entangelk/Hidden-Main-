import { describe, expect, it } from 'vitest'
import { incident0214 } from './incident-0214'
import { miniScenario } from './mini'

// DB-04: scenarios are plain data. A function anywhere would break JSON export and replay purity.
function findFunctions(value: unknown, path = 'scenario'): string[] {
  if (typeof value === 'function') return [path]
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => findFunctions(v, `${path}.${k}`))
  }
  return []
}

describe('scenario data', () => {
  it('holds no functions and survives a JSON round trip unchanged', () => {
    for (const scenario of [miniScenario, incident0214]) {
      expect(findFunctions(scenario)).toEqual([])
      expect(JSON.parse(JSON.stringify(scenario))).toEqual(scenario)
    }
  })

  it('the check itself finds a function', () => {
    expect(findFunctions({ a: [{ b: () => 1 }] })).toEqual(['scenario.a.0.b'])
  })
})
