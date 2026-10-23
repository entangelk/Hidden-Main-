# 시나리오 — *Incident 02:14*

> 상태: v4 (시나리오 `version: 4`) · 2026-10-23 · 코드: `src/scenario/incident-0214/`
> 상위 기준: [`../SOT.md`](../SOT.md) §5.4, [`../architecture/01_data_contracts.md`](../architecture/01_data_contracts.md) §3

## 줄거리

플레이어는 야간 당직 개발자다. 새벽 02:14, 서버 db-07이 외부로 대량의 데이터를 보낸다는 경보가 울린다. 접근 기록, 예약 작업, 계정 감사, 전력 회로를 따라가면 지하 2층 B2-07의 폐기 장비 보관실에 3년 전 폐기된 서버 BACKUP-02가 아직 켜져 있다는 사실에 닿는다. 무엇을 확인하고 어떻게 보고하느냐에 따라 사건은 **원인 규명**으로 끝나거나, **원인 미상**으로 덮인다.

## 파일

| 순서 | 파일 | 처음부터 보임 | 사건 함수 |
| --- | --- | --- | --- |
| — | `config/settings.py` | 예 (등록 대역 단서) | — |
| 1 | `incidents/01_event_001.py` | 예 | `triage_alert`, `check_schedule`, `escalate` |
| 2 | `incidents/02_security_audit.py` | `escalate` 해결 후 | `audit_logins`, `review_access`, `preserve_logs` |
| 3 | `incidents/03_power_control.py` | `preserve_logs` 해결 후 | `inspect_power`, `set_limit` |
| 4 | `incidents/04_sublevel_access.py` | `set_limit` 해결 후 | `request_access`, `enter_room`, `handle_device` |
| 5 | `incidents/05_case_report.py` | `handle_device` 해결 후 | `draft_report`, `submit_report` |

`main.py`(앱 소유 시나리오 선택 파일, SoT §3.7)에서 1번을 고르면 `main.py`와 `incidents/01_event_001.py`가 열리고 01 파일이 활성이다. v4부터 시나리오 자체의 `main.py`는 없다(사용법은 선택 파일로 옮김).

- 파일 이름의 순번(`01_`~`05_`)은 생성 순서다. Explorer 이름순 정렬과 일치한다(SoT v0.7 §5.4). 템플릿 원본 파일 이름(`src/scenario/incident-0214/*.py`)은 순번 없이 그대로 둔다.
- 1~4번 파일은 마지막 사건을 해결하면 그 아래에 다음 파일 안내 함수 `next_file()`이 붙는다(엔진이 생성, 아키텍처 §5.2). 5번은 엔딩으로 끝나므로 붙지 않는다.
- v4: 파일 경로에 순번이 붙고, `main.py`가 시나리오에서 빠져 앱 소유가 됐다. 사건 id는 같으므로 v3 저장의 진행은 이어진다. 편집 중이던 값은 버전 규칙(SoT §3.6)으로 초기화되고, 옛 경로의 탭은 "없는 파일의 탭은 복원하지 않는다"는 규칙(`cleanWorkspace`)으로 닫힌다. 업데이트 후 첫 접속은 고른 시나리오가 없으므로 `main.py`에서 1번을 고르면 되고, 그때 현재 사건 파일이 열린다.

## 사건과 전이

모든 사건은 다음 사건으로 이어지는 한 줄기이고(공통 합류), 선택은 플래그로 남아 뒤 사건의 주석·로그와 엔딩을 바꾼다.

| 사건 (함수) | 입력 | 선택 → 효과(플래그) | 다음 |
| --- | --- | --- | --- |
| triage (`triage_alert`) | `action` 1~3 | 1 → `analyzed` / 2 → `isolated` / 3 → 경고 로그 | schedule |
| schedule (`check_schedule`) | `hour` 정수 0~23 | 2 → `cron_found` | escalate |
| escalate (`escalate`) | `notify_security` bool | True → `notified` | audit |
| audit (`audit_logins`) | `target` "admin"·"backup"·"guest" | "backup" → `backup_suspect` | review |
| review (`review_access`) | `action` 1~2 | 의심 계정을 찾았으면 1 → `locked`(backup 잠금) / 못 찾았으면 선택지 내용이 바뀌고(정책 확인·전체 감시) 효과 없음 | preserve |
| preserve (`preserve_logs`) | `keep_logs` bool | True → `logs_kept` / False → 경고 로그 | power |
| power (`inspect_power`) | `action` 1~3 | 1 → `traced_b2` / 3 → 경고 로그 | limit |
| limit (`set_limit`) | `limit` 0~100 | 30 이하 → `spike_seen` | access |
| access (`request_access`) | `action` 1~2 | 1 → `badge` / 2 → 경고 로그 | room |
| room (`enter_room`) | `room` "B2-03"·"B2-07"·"B2-11" | "B2-07" → `device_found` (그리고 `locked`면 `device_locked`) | device |
| device (`handle_device`) | `action` 1~3 | 장치를 찾았으면: 1 → `documented` / 2 → `unplugged` / 3 → 그대로 둠. 못 찾았으면 선택지 내용이 바뀌고(빈 방 사진·옆방 확인·나옴) 효과 없음 | report |
| report (`draft_report`) | `action` 1~2 | 1 이고 `device_found` → `truthful` / 1 이고 장치 못 찾음 → 사실만 기재 / 2 → "장애"로 정리 | submit |
| submit (`submit_report`) | `recipient` "security"·"facility"·"archive" | `truthful` 이고 "archive"가 아님 → **resolved** / 그 외 → **sealed** | 엔딩 |

## 선택에 따라 달라지는 주석 (DB-01)

| 사건 | 조건 플래그 | 내용 |
| --- | --- | --- |
| schedule | `analyzed` | 출발지 10.0.2.14가 등록 대역 밖이라는 단서 |
| escalate | `cron_found` | 담당자 없는 작업 `sync_b2` |
| audit | `notified` | 보안팀 답장 |
| review | `backup_suspect` | 폐기된 백업 서버의 계정이 로그인했다는 사실과 선택지 내용 |
| power | `isolated` | 격리 후에도 B2 전력이 그대로 |
| access | `traced_b2` | 회로가 동쪽 복도 끝 방에서 끝남 |
| room | `badge`, `spike_seen`, `traced_b2` | 문을 연 방법, B2-07을 가리키는 단서 |
| device | `device_found`, `device_locked` | BACKUP-02 발견 여부와 선택지 내용, backup 계정을 잠갔다면 장치 화면의 동기화 실패 표시 |
| report | `device_found`, `logs_kept`, `documented` | 보고서에 쓸 수 있는 사실과 근거 |
| submit | `unplugged` | BACKUP-02의 전원 상태 |

## 엔딩

| ID | 조건 | 마지막 로그 |
| --- | --- | --- |
| resolved | B2-07에서 장치를 찾았고, 사실대로 썼고(`truthful`), 보관함이 아닌 곳에 제출 | 다음 날 02:14, 경보가 울리지 않는다 |
| sealed | 그 외 전부 | 다음 날 02:14, 아무도 B2-07을 다시 찾지 않는다 |

`resolved`로 가려면 B2-07을 골라야 한다. 단서는 `inspect_power`에서 회로를 추적(1)하거나 `set_limit`에서 기준을 30 이하로 낮출 때 `enter_room` 주석에 나타난다. 단서 없이 맞힐 수도 있다. 방 설명은 정답을 직접 말하지 않지만, `inspect_power` 주석의 "폐기 장비 보관실"과 맞춰 보면 짐작할 수 있다.

모든 플래그는 뒤 사건의 주석이나 전이·엔딩 조건 중 하나 이상에서 읽힌다(검증기가 확인).

## 검증

`src/scenario/validate.test.ts`가 모든 (사건, 플래그) 상태를 탐색해 확인한다:

- 모든 사건·두 엔딩 도달, 모든 전이가 어떤 경로에서든 실제로 쓰임
- 화면(렌더 결과)에 지시문이 남지 않음, 화면에 보이는 주석이 선택지(정수는 번호 목록 또는 `최소~최대`, 문자열은 따옴표 친 값, 수치는 `최소~최대`)를 설명함
- 템플릿 규칙(필드 줄 하나, 탭·삼중 따옴표·중첩 `def` 없음, 함수 순서, 기본값 유효)
- 전이 대상·엔딩 존재, `>=`/`<=`는 숫자에만, 알 수 없는 필드 조건 없음, 되돌아가는 루프 없음
- 아무도 설정하지 않는 플래그에 대한 `@if`, 설정만 되고 읽히지 않는 플래그, 사건에 도달하는 어떤 경로에서도 참이 되지 않는 `@if` 없음
- 탐색 상태 수 상한(2만 미만) — 플래그가 늘면 상태가 빠르게 늘어나므로 기록해 둔다

검사마다 그 검사를 지우면 실패하는 테스트가 하나씩 있다(검사 삭제 변이로 확인).
