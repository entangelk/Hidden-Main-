import { describe, expect, it } from 'vitest'
import { buildFileTree } from '../ui/explorer/fileTree'
import { scenarios } from '.'
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
    for (const scenario of [miniScenario, ...scenarios]) {
      expect(findFunctions(scenario)).toEqual([])
      expect(JSON.parse(JSON.stringify(scenario))).toEqual(scenario)
    }
  })

  it('the check itself finds a function', () => {
    expect(findFunctions({ a: [{ b: () => 1 }] })).toEqual(['scenario.a.0.b'])
  })
})

describe('stage file names', () => {
  it.each(scenarios.map((s) => [s.title, s] as const))('%s lists its stage files in play order in the Explorer (numbered names, plain name sort)', (_, scenario) => {
    const inPlayOrder = scenario.stages.map((st) => st.filePath)
    const folder = inPlayOrder[0].split('/')[0]
    expect(inPlayOrder.every((p) => p.startsWith(`${folder}/`))).toBe(true)
    const tree = buildFileTree([...inPlayOrder].reverse())
    const node = tree.find((n) => n.name === folder)
    expect(node?.kind === 'folder' && node.children.map((n) => n.path)).toEqual(inPlayOrder)
    inPlayOrder.forEach((path, i) => expect(path).toMatch(new RegExp(`^${folder}/${String(i + 1).padStart(2, '0')}_`)))
  })
})
