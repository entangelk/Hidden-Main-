// Small two-stage scenario with two endings. Drives the engine tests (P03) and the app until the
// real scenario lands in P04. Plain data only (DB-04): no functions or closures.
import type { Scenario } from '../../engine/types'
import mainPy from './main.py?raw'
import reportPy from './report.py?raw'
import settingsPy from './settings.py?raw'

export const miniScenario = {
  id: 'mini',
  title: 'Mini',
  summary: '엔진 테스트용 소형 시나리오.',
  version: 1,
  initialFiles: [{ path: 'config/settings.py', content: settingsPy }],
  stages: [
    { id: 'response', filePath: 'main.py', template: mainPy, sceneIds: ['triage', 'contain'] },
    { id: 'report', filePath: 'incidents/report.py', template: reportPy, sceneIds: ['report'] },
  ],
  scenes: [
    {
      id: 'triage',
      stageId: 'response',
      functionName: 'triage_alert',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        {
          when: [{ ref: { choice: 'action' }, op: '==', value: 1 }],
          effects: [{ flag: 'analyzed', value: true }],
          log: [
            { level: 'info', text: '[02:14:07] 접근 기록 분석 시작' },
            { level: 'info', text: '[02:14:09] 외부 전송 412MB — 출발지 10.0.2.14' },
          ],
          next: { scene: 'contain' },
        },
        {
          when: [{ ref: { choice: 'action' }, op: '==', value: 2 }],
          effects: [{ flag: 'isolated', value: true }],
          log: [{ level: 'info', text: '[02:14:07] 서버 격리 완료' }],
          next: { scene: 'contain' },
        },
        {
          when: [],
          effects: [],
          log: [{ level: 'warn', text: '[02:14:31] 경고: 같은 경보가 다시 발생' }],
          next: { scene: 'contain' },
        },
      ],
    },
    {
      id: 'contain',
      stageId: 'response',
      functionName: 'contain',
      editableFields: [{ name: 'isolate', type: 'bool' }],
      transitions: [
        {
          when: [{ ref: { choice: 'isolate' }, op: '==', value: true }],
          effects: [{ flag: 'isolated', value: true }],
          log: [{ level: 'info', text: '[02:15:02] 네트워크 격리 적용' }],
          next: { scene: 'report' },
        },
        {
          when: [],
          effects: [],
          log: [{ level: 'info', text: '[02:15:02] 격리하지 않음' }],
          next: { scene: 'report' },
        },
      ],
    },
    {
      id: 'report',
      stageId: 'report',
      functionName: 'write_report',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        {
          when: [
            { ref: { choice: 'action' }, op: '==', value: 1 },
            { ref: { flag: 'isolated' }, op: '==', value: true },
          ],
          effects: [],
          log: [{ level: 'info', text: '[02:20:00] 보고서 제출: 종결' }],
          next: { ending: 'contained' },
        },
        {
          when: [],
          effects: [],
          log: [{ level: 'info', text: '[02:20:00] 보고서 제출: 상위 부서 이관' }],
          next: { ending: 'escalated' },
        },
      ],
    },
  ],
  endings: [
    { id: 'contained', log: [{ level: 'info', text: '사건 종결. 전송은 멈췄다.' }] },
    { id: 'escalated', log: [{ level: 'warn', text: '사건 이관. 02:14의 전송은 아직 설명되지 않았다.' }] },
  ],
  startSceneId: 'triage',
} satisfies Scenario
