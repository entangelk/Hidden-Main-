// Incident 02:14 — the MVP scenario (SoT §5.4). Plain data only (DB-04). Story and branch table:
// docs/scenario/incident-0214.md.
import type { LogLine, Scenario, Transition } from '../../engine/types'
import caseReportPy from './case_report.py?raw'
import event001Py from './event_001.py?raw'
import mainPy from './main.py?raw'
import powerControlPy from './power_control.py?raw'
import securityAuditPy from './security_audit.py?raw'
import settingsPy from './settings.py?raw'
import sublevelAccessPy from './sublevel_access.py?raw'

const info = (text: string): LogLine => ({ level: 'info', text })
const warn = (text: string): LogLine => ({ level: 'warn', text })
const go = (scene: string) => ({ scene })

// Helpers only build plain objects at module load; the exported scenario holds no functions.
const when = (field: string, value: number | boolean | string): Transition['when'] => [
  { ref: { choice: field }, op: '==', value },
]
const found: Transition['when'] = [{ ref: { flag: 'device_found' }, op: '==', value: true }]

export const incident0214 = {
  id: 'incident-0214',
  version: 3,
  initialFiles: [
    { path: 'main.py', content: mainPy },
    { path: 'config/settings.py', content: settingsPy },
  ],
  stages: [
    { id: 's1', filePath: 'incidents/event_001.py', template: event001Py, sceneIds: ['triage', 'schedule', 'escalate'] },
    { id: 's2', filePath: 'incidents/security_audit.py', template: securityAuditPy, sceneIds: ['audit', 'review', 'preserve'] },
    { id: 's3', filePath: 'incidents/power_control.py', template: powerControlPy, sceneIds: ['power', 'limit'] },
    { id: 's4', filePath: 'incidents/sublevel_access.py', template: sublevelAccessPy, sceneIds: ['access', 'room', 'device'] },
    { id: 's5', filePath: 'incidents/case_report.py', template: caseReportPy, sceneIds: ['report', 'submit'] },
  ],
  scenes: [
    // ---- Stage 1: event_001.py — the alert ----
    {
      id: 'triage',
      stageId: 's1',
      functionName: 'triage_alert',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'analyzed', value: true }], log: [info('[02:14:09] 접근 기록 분석: 출발지 10.0.2.14 (미등록 대역)')], next: go('schedule') },
        { when: when('action', 2), effects: [{ flag: 'isolated', value: true }], log: [info('[02:14:08] db-07 격리 완료. 외부 전송이 멈췄다.')], next: go('schedule') },
        { when: [], effects: [], log: [warn('[02:14:20] 경보를 껐다.'), warn('[02:16:02] 같은 전송이 다시 시작됐다.')], next: go('schedule') },
      ],
    },
    {
      id: 'schedule',
      stageId: 's1',
      functionName: 'check_schedule',
      editableFields: [{ name: 'hour', type: 'int', options: Array.from({ length: 24 }, (_, h) => h) }],
      transitions: [
        { when: when('hour', 2), effects: [{ flag: 'cron_found', value: true }], log: [info('[scheduler] 02시대 작업: sync_b2 — 담당자 없음, 매일 02:14 실행')], next: go('escalate') },
        { when: [], effects: [], log: [info('[scheduler] 그 시간대에는 특이한 작업이 없다.')], next: go('escalate') },
      ],
    },
    {
      id: 'escalate',
      stageId: 's1',
      functionName: 'escalate',
      editableFields: [{ name: 'notify_security', type: 'bool' }],
      transitions: [
        { when: when('notify_security', true), effects: [{ flag: 'notified', value: true }], log: [info('[notify] 보안팀에 경보를 전달했다.')], next: go('audit') },
        { when: [], effects: [], log: [info('[notify] 알리지 않았다. 혼자 조사를 계속한다.')], next: go('audit') },
      ],
    },
    // ---- Stage 2: security_audit.py — who logged in ----
    {
      id: 'audit',
      stageId: 's2',
      functionName: 'audit_logins',
      editableFields: [{ name: 'target', type: 'string', options: ['admin', 'backup', 'guest'] }],
      transitions: [
        { when: when('target', 'backup'), effects: [{ flag: 'backup_suspect', value: true }], log: [info('[auth] backup: 02:13 로그인, 출발지 10.0.2.14')], next: go('review') },
        { when: [], effects: [], log: [info('[auth] 감사한 계정에 특이 사항이 없다.')], next: go('review') },
      ],
    },
    {
      id: 'review',
      stageId: 's2',
      functionName: 'review_access',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        {
          when: [...when('action', 1), { ref: { flag: 'backup_suspect' }, op: '==', value: true }],
          effects: [{ flag: 'locked', value: true }],
          log: [info('[auth] backup 계정을 잠갔다.')],
          next: go('preserve'),
        },
        { when: when('action', 1), effects: [], log: [info('[auth] 계정 정책을 확인했다. 바뀐 것은 없다.')], next: go('preserve') },
        { when: [], effects: [], log: [info('[auth] 감시 규칙을 걸었다.')], next: go('preserve') },
      ],
    },
    {
      id: 'preserve',
      stageId: 's2',
      functionName: 'preserve_logs',
      editableFields: [{ name: 'keep_logs', type: 'bool' }],
      transitions: [
        { when: when('keep_logs', true), effects: [{ flag: 'logs_kept', value: true }], log: [info('[logs] 02:00~03:00 로그를 보존했다.')], next: go('power') },
        { when: [], effects: [], log: [warn('[logs] 보존하지 않았다. 03:00에 기록이 지워진다.')], next: go('power') },
      ],
    },
    // ---- Stage 3: power_control.py — the B2 circuit ----
    {
      id: 'power',
      stageId: 's3',
      functionName: 'inspect_power',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'traced_b2', value: true }], log: [info('[power] B2-EAST 회로 추적: 동쪽 복도 끝 방에서 끝난다.')], next: go('limit') },
        { when: when('action', 2), effects: [], log: [info('[power] UPS 기록: 02:14마다 짧은 부하. 위치는 알 수 없다.')], next: go('limit') },
        { when: [], effects: [], log: [warn('[power] B2 차단기를 내렸다.'), warn('[power] 02:14:00, 차단기가 다시 올라갔다.')], next: go('limit') },
      ],
    },
    {
      id: 'limit',
      stageId: 's3',
      functionName: 'set_limit',
      editableFields: [{ name: 'limit', type: 'number', min: 0, max: 100 }],
      transitions: [
        { when: [{ ref: { choice: 'limit' }, op: '<=', value: 30 }], effects: [{ flag: 'spike_seen', value: true }], log: [info('[power] 02:14 B2-07 회로에서 2초간 급증 기록')], next: go('access') },
        { when: [], effects: [], log: [info('[power] 기준을 넘는 급증이 없다.')], next: go('access') },
      ],
    },
    // ---- Stage 4: sublevel_access.py — going down ----
    {
      id: 'access',
      stageId: 's4',
      functionName: 'request_access',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        { when: when('action', 1), effects: [{ flag: 'badge', value: true }], log: [info('[facility] 출입증 발급: B2, 오늘 하루 유효')], next: go('room') },
        { when: [], effects: [], log: [warn('[facility] 비상 코드 사용이 기록되었다.')], next: go('room') },
      ],
    },
    {
      id: 'room',
      stageId: 's4',
      functionName: 'enter_room',
      editableFields: [{ name: 'room', type: 'string', options: ['B2-03', 'B2-07', 'B2-11'] }],
      transitions: [
        {
          when: [...when('room', 'B2-07'), { ref: { flag: 'locked' }, op: '==', value: true }],
          effects: [{ flag: 'device_found', value: true }, { flag: 'device_locked', value: true }],
          log: [info('[facility] B2-07 입장. 팬 소리가 들린다.')],
          next: go('device'),
        },
        { when: when('room', 'B2-07'), effects: [{ flag: 'device_found', value: true }], log: [info('[facility] B2-07 입장. 팬 소리가 들린다.')], next: go('device') },
        { when: [], effects: [], log: [info('[facility] 입장. 조용하다.')], next: go('device') },
      ],
    },
    {
      id: 'device',
      stageId: 's4',
      functionName: 'handle_device',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2, 3] }],
      transitions: [
        { when: [...found, ...when('action', 1)], effects: [{ flag: 'documented', value: true }], log: [info('[facility] 사진 12장, 일련번호 기록')], next: go('report') },
        { when: [...found, ...when('action', 2)], effects: [{ flag: 'unplugged', value: true }], log: [info('[facility] 전원을 뽑았다. 팬이 멈췄다.')], next: go('report') },
        { when: [...found, ...when('action', 3)], effects: [], log: [info('[facility] 아무것도 건드리지 않고 나왔다.')], next: go('report') },
        { when: when('action', 1), effects: [], log: [info('[facility] 빈 방 사진 4장')], next: go('report') },
        { when: when('action', 2), effects: [], log: [info('[facility] 옆방들도 비어 있다. 복도 끝에서 팬 소리가 났던 것 같다.')], next: go('report') },
        { when: [], effects: [], log: [info('[facility] B2에서 나왔다.')], next: go('report') },
      ],
    },
    // ---- Stage 5: case_report.py — what gets written down ----
    {
      id: 'report',
      stageId: 's5',
      functionName: 'draft_report',
      editableFields: [{ name: 'action', type: 'int', options: [1, 2] }],
      transitions: [
        { when: [...found, ...when('action', 1)], effects: [{ flag: 'truthful', value: true }], log: [info('[report] 초안: 원인 — 폐기 서버 BACKUP-02의 예약 동기화')], next: go('submit') },
        { when: when('action', 1), effects: [], log: [info('[report] 초안: 원인 미확인, 확인한 사실만 기재')], next: go('submit') },
        { when: [], effects: [], log: [warn('[report] 초안: 일시적 네트워크 장애')], next: go('submit') },
      ],
    },
    {
      id: 'submit',
      stageId: 's5',
      functionName: 'submit_report',
      editableFields: [{ name: 'recipient', type: 'string', options: ['security', 'facility', 'archive'] }],
      transitions: [
        {
          when: [
            { ref: { flag: 'truthful' }, op: '==', value: true },
            { ref: { choice: 'recipient' }, op: '!=', value: 'archive' },
          ],
          effects: [],
          log: [info('[report] INC-0214 제출 완료. 수신 확인.')],
          next: { ending: 'resolved' },
        },
        { when: [], effects: [], log: [warn('[report] INC-0214 제출 완료.')], next: { ending: 'sealed' } },
      ],
    },
  ],
  endings: [
    {
      id: 'resolved',
      log: [info('— 다음 날 새벽 02:14. 경보는 울리지 않았다.'), info('사건 INC-0214 종결 (원인 규명)')],
    },
    {
      id: 'sealed',
      log: [warn('— 다음 날 새벽 02:14. 아무도 B2-07을 다시 찾지 않았다.'), warn('사건 INC-0214 종결 (원인 미상)')],
    },
  ],
  startSceneId: 'triage',
} satisfies Scenario
