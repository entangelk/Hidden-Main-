// Thermal Drift — a short scenario (SoT §3.7). Plain data only (DB-04). Story and branch table:
// docs/scenario/thermal-drift.md.
import type { LogLine, Scenario, Transition } from '../../engine/types'
import facilityPy from './facility.py?raw'
import rackAuditPy from './rack_audit.py?raw'
import tempAlarmPy from './temp_alarm.py?raw'
import unitControlPy from './unit_control.py?raw'

const info = (text: string): LogLine => ({ level: 'info', text })
const warn = (text: string): LogLine => ({ level: 'warn', text })
const go = (scene: string) => ({ scene })

// Helpers only build plain objects at module load; the exported scenario holds no functions.
const when = (field: string, value: number | boolean | string): Transition['when'] => [
  { ref: { choice: field }, op: '==', value },
]

export const thermalDrift = {
  id: 'thermal-drift',
  title: 'Thermal Drift',
  summary: '토요일 새벽, 서버실 R열 온도가 멈추지 않고 오른다.',
  version: 2,
  initialFiles: [{ path: 'config/facility.py', content: facilityPy }],
  stages: [
    { id: 's1', filePath: 'cooling/01_temp_alarm.py', template: tempAlarmPy, sceneIds: ['alarm', 'unit'] },
    { id: 's2', filePath: 'cooling/02_unit_control.py', template: unitControlPy, sceneIds: ['resume', 'override', 'power'] },
    { id: 's3', filePath: 'cooling/03_rack_audit.py', template: rackAuditPy, sceneIds: ['open', 'report'] },
  ],
  scenes: [
    // ---- Stage 1: 01_temp_alarm.py — the alarm ----
    {
      id: 'alarm',
      stageId: 's1',
      functionName: 'check_alarm',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'mapped', value: true }], log: [info('[thermal] 열 지도: R열 뒤쪽 38도. P열·Q열은 25도 안팎.')], next: go('unit') },
        { when: when('action', 2), effects: [{ flag: 'fans_max', value: true }], log: [info('[thermal] 팬 최대. 실내 30.6도. R열만 그대로다.')], next: go('unit') },
        { when: [], effects: [], log: [warn('[thermal] 경보를 껐다.'), warn('[03:52] 실내 32.4도.')], next: go('unit') },
      ],
    },
    {
      id: 'unit',
      stageId: 's1',
      functionName: 'inspect_unit',
      attempts: 2,
      editableFields: [{ name: 'unit', type: 'string', options: ['CRAC-1', 'CRAC-2', 'CRAC-3'] }],
      transitions: [
        { when: when('unit', 'CRAC-3'), effects: [{ flag: 'crac3_found', value: true }], log: [info('[crac] CRAC-3: 점검 모드, 냉각 0%. 03:00 변경, 변경자 svc-facility')], next: go('resume') },
        { miss: true, when: [], effects: [], log: [info('[crac] 정상 가동, 냉각 100%.')], next: go('resume') },
      ],
    },
    // ---- Stage 2: 02_unit_control.py — who switched it off ----
    {
      id: 'resume',
      stageId: 's2',
      functionName: 'resume_cooling',
      editableFields: [{ name: 'resume', type: 'bool' }],
      transitions: [
        { when: when('resume', true), effects: [{ flag: 'cooling_resumed', value: true }], log: [info('[crac] CRAC-3 정상 모드. 04:05 실내 26도, 내려가는 중.')], next: go('override') },
        { when: [], effects: [], log: [warn('[crac] 그대로 둔다. 04:05 실내 32.8도.')], next: go('override') },
      ],
    },
    {
      id: 'override',
      stageId: 's2',
      functionName: 'trace_override',
      attempts: 2,
      editableFields: [{ name: 'days', type: 'number', min: 1, max: 30 }],
      transitions: [
        {
          when: [{ ref: { choice: 'days' }, op: '>=', value: 7 }],
          effects: [{ flag: 'pattern_found', value: true }],
          log: [info('[audit] 매주 토요일 03:00 점검 모드 → 06:00 해제. 6주째 반복.')],
          next: go('power'),
        },
        { miss: true, when: [], effects: [], log: [info('[audit] 오늘 03:00에 한 번. 그 전 기록은 조회 범위 밖이다.')], next: go('power') },
      ],
    },
    {
      id: 'power',
      stageId: 's2',
      functionName: 'check_power',
      attempts: 2,
      editableFields: [{ name: 'rack', type: 'string', options: ['R-15', 'R-16', 'R-17'] }],
      transitions: [
        { when: when('rack', 'R-17'), effects: [{ flag: 'rig_suspect', value: true }], log: [info('[power] R-17: 9.8kW. 한도 6kW를 넘는다. 자산 대장에는 장비가 없다.')], next: go('open') },
        { miss: true, when: [], effects: [], log: [info('[power] 정상 범위.')], next: go('open') },
      ],
    },
    // ---- Stage 3: 03_rack_audit.py — what is in R-17 ----
    {
      id: 'open',
      stageId: 's3',
      functionName: 'open_rack',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'rig_found', value: true }], log: [info('[rack] R-17 안: 표식 없는 GPU 서버 4대. 외부 회선에 연결돼 있다.')], next: go('report') },
        { when: [], effects: [], log: [info('[rack] 랙은 닫아 둔 채 온도만 지켜본다.')], next: go('report') },
      ],
    },
    {
      id: 'report',
      stageId: 's3',
      functionName: 'file_report',
      editableFields: [{ name: 'recipient', type: 'string', options: ['facility', 'security', 'none'] }],
      transitions: [
        {
          when: [{ ref: { flag: 'rig_found' }, op: '==', value: true }, ...when('recipient', 'security')],
          effects: [],
          log: [info('[report] 보안팀 접수. R-17 장비 회수, svc-facility 계정 정지.')],
          next: { ending: 'traced' },
        },
        { when: when('recipient', 'facility'), effects: [], log: [warn("[report] 시설팀 답장: '점검 모드 설정 오류로 처리하겠다.'")], next: { ending: 'patched' } },
        { when: [], effects: [], log: [warn('[report] INC-0340 종료 처리.')], next: { ending: 'patched' } },
      ],
    },
  ],
  endings: [
    {
      id: 'traced',
      log: [info('— 다음 주 토요일 03:00. CRAC-3는 점검 모드로 바뀌지 않았다.'), info('사건 INC-0340 종결 (원인 규명)')],
    },
    {
      id: 'patched',
      log: [warn('— 다음 주 토요일 03:00. R열 온도가 다시 오르기 시작했다.'), warn('사건 INC-0340 종결 (임시 조치)')],
    },
  ],
  startSceneId: 'alarm',
} satisfies Scenario
