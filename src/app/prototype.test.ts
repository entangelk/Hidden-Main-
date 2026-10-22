import { describe, expect, it } from 'vitest'
import { derivePrototype } from './prototype'

const slotText = (text: string, s: { start: number; end: number }) => text.slice(s.start, s.end)

describe('derivePrototype', () => {
  it('starts with only main.py and its action slot editable', () => {
    const st = derivePrototype([])
    expect(st.currentScene?.id).toBe('triage')
    expect(st.unlockedFiles).toEqual(['main.py'])
    const [slot] = st.views['main.py'].valueSlots
    expect(slot.field).toBe('action')
    expect(slotText(st.views['main.py'].text, slot)).toBe('1')
  })

  it('after solving main.py: value fixed, no editable slot there, event_002.py unlocked with its slot', () => {
    const st = derivePrototype([{ sceneId: 'triage', values: { action: 2 } }])
    expect(st.currentScene?.id).toBe('trace')
    expect(st.unlockedFiles).toEqual(['main.py', 'event_002.py'])
    expect(st.views['main.py'].valueSlots).toEqual([])
    expect(st.views['main.py'].text).toContain('        action = 2\n')
    expect(st.views['event_002.py'].valueSlots.map((s) => s.sceneId)).toEqual(['trace'])
  })

  it('has no current scene once every scene is solved', () => {
    const st = derivePrototype([
      { sceneId: 'triage', values: { action: 1 } },
      { sceneId: 'trace', values: { action: 2 } },
    ])
    expect(st.currentScene).toBeNull()
    expect(Object.values(st.views).every((v) => v.valueSlots.length === 0)).toBe(true)
  })
})
