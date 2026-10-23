// Unlogged Run — a short scenario (SoT §3.7). Plain data only (DB-04). Story and branch table:
// docs/scenario/unlogged-run.md.
import type { LogLine, Scenario, Transition } from '../../engine/types'
import chamberPy from './chamber.py?raw'
import decisionPy from './decision.py?raw'
import labPy from './lab.py?raw'
import schedulerPy from './scheduler.py?raw'

const info = (text: string): LogLine => ({ level: 'info', text })
const warn = (text: string): LogLine => ({ level: 'warn', text })
const go = (scene: string) => ({ scene })

// Helpers only build plain objects at module load; the exported scenario holds no functions.
const when = (field: string, value: number | boolean | string): Transition['when'] => [
  { ref: { choice: field }, op: '==', value },
]
const flag = (name: string): Transition['when'] => [{ ref: { flag: name }, op: '==', value: true }]

export const unloggedRun = {
  id: 'unlogged-run',
  title: 'Unlogged Run',
  summary: '연구소 자동화 스케줄러가 기록에 없는 실험을 돌리고 있다.',
  version: 1,
  initialFiles: [{ path: 'config/lab.py', content: labPy }],
  stages: [
    { id: 's1', filePath: 'lab/01_scheduler.py', template: schedulerPy, sceneIds: ['queue', 'owner'] },
    { id: 's2', filePath: 'lab/02_chamber.py', template: chamberPy, sceneIds: ['chamber', 'samples', 'project'] },
    { id: 's3', filePath: 'lab/03_decision.py', template: decisionPy, sceneIds: ['call', 'decide'] },
  ],
  scenes: [
    // ---- Stage 1: 01_scheduler.py — the job nobody logged ----
    {
      id: 'queue',
      stageId: 's1',
      functionName: 'check_queue',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'queue_read', value: true }], log: [info('[scheduler] run-0: 매일 01:00 실행, 2년째. 대상: 배양 챔버 4번. 작성자 칸은 비어 있다.')], next: go('owner') },
        { when: when('action', 2), effects: [{ flag: 'halted', value: true }], log: [warn('[scheduler] run-0 중지.'), warn('[01:31] 경보: 배양 챔버 4번 영양액 공급 중단.')], next: go('owner') },
        { when: [], effects: [], log: [info('[scheduler] 그대로 둔다. run-0이 챔버 4번에 영양액을 넣기 시작했다.')], next: go('owner') },
      ],
    },
    {
      id: 'owner',
      stageId: 's1',
      functionName: 'find_owner',
      attempts: 2,
      editableFields: [{ name: 'account', type: 'string', options: ['svc-lab', 'kim.jh', 'admin'] }],
      transitions: [
        { when: when('account', 'svc-lab'), effects: [{ flag: 'owner_traced', value: true }], log: [info('[audit] svc-lab: run-0 등록 2년 전. 등록한 단말은 퇴사한 한서윤 박사의 것.')], next: go('chamber') },
        { miss: true, when: [], effects: [], log: [info('[audit] 이 계정은 run-0과 관계가 없다.')], next: go('chamber') },
      ],
    },
    // ---- Stage 2: 02_chamber.py — what is growing ----
    {
      id: 'chamber',
      stageId: 's2',
      functionName: 'read_chamber',
      attempts: 2,
      editableFields: [{ name: 'chamber', type: 'int', options: [1, 2, 3, 4] }],
      transitions: [
        { when: when('chamber', 4), effects: [{ flag: 'chamber_found', value: true }], log: [info("[chamber] 4번: 37.0도. 배양 용기 12개, 라벨 'LMN'. 실험 대장에는 없다.")], next: go('samples') },
        { miss: true, when: [], effects: [], log: [info('[chamber] 등록된 실험만 있다.')], next: go('samples') },
      ],
    },
    {
      id: 'samples',
      stageId: 's2',
      functionName: 'scan_samples',
      editableFields: [{ name: 'scan', type: 'bool' }],
      transitions: [
        { when: when('scan', true), effects: [{ flag: 'samples_alive', value: true }], log: [info("[scan] 4번 챔버 'LMN' 용기 12개 중 11개 생존. 2년 동안 매일 영양액을 받았다.")], next: go('project') },
        { when: [], effects: [], log: [info('[scan] 스캔하지 않았다.')], next: go('project') },
      ],
    },
    {
      id: 'project',
      stageId: 's2',
      functionName: 'check_project',
      attempts: 2,
      editableFields: [{ name: 'project', type: 'string', options: ['ARGO', 'TIDE', 'LUMEN'] }],
      transitions: [
        { when: when('project', 'LUMEN'), effects: [{ flag: 'lumen_found', value: true }], log: [info("[registry] LUMEN: 책임자 한서윤. 2년 전 예산 종료로 중단, '시료 폐기 완료'로 기록됨.")], next: go('call') },
        { miss: true, when: [], effects: [], log: [info('[registry] 진행 중인 프로젝트다. run-0과는 관계가 없다.')], next: go('call') },
      ],
    },
    // ---- Stage 3: 03_decision.py — what to do before morning ----
    {
      id: 'call',
      stageId: 's3',
      functionName: 'make_call',
      editableFields: [{ name: 'who', type: 'string', options: ['director', 'dr_han', 'nobody'] }],
      transitions: [
        {
          when: [...when('who', 'dr_han'), ...flag('lumen_found')],
          effects: [{ flag: 'testimony', value: true }],
          log: [info("[call] 한서윤: '중단 결정 뒤에도 시료만은 살려 두고 싶었어요. 기록은 제가 고쳤습니다.'")],
          next: go('decide'),
        },
        { when: when('who', 'director'), effects: [{ flag: 'director_told', value: true }], log: [info("[call] 소장: '아침까지 결정해서 알려 달라.'")], next: go('decide') },
        { when: [], effects: [], log: [info('[call] 아무 답도 듣지 못했다.')], next: go('decide') },
      ],
    },
    {
      id: 'decide',
      stageId: 's3',
      functionName: 'decide',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        { when: [...when('action', 1), ...flag('samples_alive')], effects: [], log: [info('[lab] 시료 보존, 있었던 일을 실험 대장에 올렸다.')], next: { ending: 'preserved' } },
        { when: when('action', 1), effects: [], log: [warn('[lab] 무엇을 보존하는지 확인하지 않아 보존 요청이 반려됐다.')], next: { ending: 'erased' } },
        { when: [], effects: [], log: [warn('[lab] 시료 폐기, run-0 삭제.')], next: { ending: 'erased' } },
      ],
    },
  ],
  endings: [
    {
      id: 'preserved',
      log: [info('— 월요일 오전. 4번 챔버의 시료는 정식 실험으로 다시 등록됐다.'), info('사건 LAB-0120 종결 (보존)')],
    },
    {
      id: 'erased',
      log: [warn('— 월요일 오전. 4번 챔버는 비어 있고, run-0은 기록에서 사라졌다.'), warn('사건 LAB-0120 종결 (폐기)')],
    },
  ],
  startSceneId: 'queue',
} satisfies Scenario
