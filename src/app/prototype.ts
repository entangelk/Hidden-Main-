// P02 hard-coded prototype: two scenes in two files, no branching. P03 replaces it with
// scenario data and the engine's apply/derive.
import { formatLiteral } from '../engine/parser'
import { applyEdits, findValueSlots } from '../engine/slots'
import type { Choice, EditableField, FileView, PlayerEdits, SceneId } from '../engine/types'
import mainPy from './prototype/main.py?raw'
import event002Py from './prototype/event_002.py?raw'

export type PrototypeScene = {
  id: SceneId
  file: string
  functionName: string
  fields: EditableField[]
  /** Terminal lines per chosen `action`. */
  outcomes: Record<number, string[]>
}

const templates: Record<string, string> = { 'main.py': mainPy, 'event_002.py': event002Py }

export const scenes: PrototypeScene[] = [
  {
    id: 'triage',
    file: 'main.py',
    functionName: 'triage_alert',
    fields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
    outcomes: {
      1: ['[02:14:07] 접근 기록 분석 시작', '[02:14:09] 외부 전송 412MB — 출발지 10.0.2.14'],
      2: ['[02:14:07] 서버 격리 요청', '[02:14:08] 격리 완료. 마지막 전송 출발지 10.0.2.14'],
      3: ['[02:14:07] 경보 무시', '[02:14:31] 경고: 같은 경보가 다시 발생 — 출발지 10.0.2.14'],
    },
  },
  {
    id: 'trace',
    file: 'event_002.py',
    functionName: 'trace_source',
    fields: [{ name: 'action', type: 'int', options: [1, 2] }],
    outcomes: {
      1: ['[02:16:40] 10.0.2.14 위치 추적 — 지하 2층 전력실'],
      2: ['[02:16:40] 기록 보존 완료. 보안팀 응답 없음'],
    },
  },
]

export type PrototypeState = {
  currentScene: PrototypeScene | null
  unlockedFiles: string[]
  /** Engine view of each unlocked file: solved values fixed, current scene's slots editable. */
  views: Record<string, FileView>
}

export function derivePrototype(choices: Choice[]): PrototypeState {
  const solved = new Map(choices.map((c) => [c.sceneId, c]))
  const currentScene = scenes.find((s) => !solved.has(s.id)) ?? null
  const reached = scenes.filter((s) => solved.has(s.id) || s === currentScene)
  const unlockedFiles = [...new Set(reached.map((s) => s.file))]

  const views: Record<string, FileView> = {}
  for (const file of unlockedFiles) {
    const inFile = reached.filter((s) => s.file === file)
    const allSlots = inFile.flatMap((s) => findValueSlots(templates[file], s.id, s.functionName, s.fields))
    // Solved scenes show the value they were solved with, written back as a literal.
    const fixed: PlayerEdits = {}
    for (const s of inFile) {
      const choice = solved.get(s.id)
      if (choice) fixed[s.id] = Object.fromEntries(Object.entries(choice.values).map(([k, v]) => [k, formatLiteral(v)]))
    }
    const view = applyEdits({ text: templates[file], valueSlots: allSlots.sort((a, b) => a.start - b.start) }, fixed)
    views[file] = { text: view.text, valueSlots: view.valueSlots.filter((s) => s.sceneId === currentScene?.id) }
  }
  return { currentScene, unlockedFiles, views }
}
