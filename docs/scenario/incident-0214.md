# 시나리오 — *Incident 02:14*

> 상태: v1 (시나리오 `version: 1`) · 2026-10-22 · 코드: `src/scenario/incident-0214/`
> 상위 기준: [`../SOT.md`](../SOT.md) §5.4, [`../architecture/01_data_contracts.md`](../architecture/01_data_contracts.md) §3

## 줄거리

플레이어는 야간 당직 개발자다. 새벽 02:14, 서버 db-07이 외부로 대량의 데이터를 보낸다는 경보가 울린다. 접근 기록, 예약 작업, 계정 감사, 전력 회로를 따라가면 지하 2층 B2-07의 폐기 장비 보관실에 3년 전 폐기된 서버 BACKUP-02가 아직 켜져 있다는 사실에 닿는다. 무엇을 확인하고 어떻게 보고하느냐에 따라 사건은 **원인 규명**으로 끝나거나, **원인 미상**으로 덮인다.

## 파일

| 순서 | 파일 | 처음부터 보임 | 사건 함수 |
| --- | --- | --- | --- |
| — | `main.py` | 예 (사용법 안내) | — |
| — | `config/settings.py` | 예 (등록 대역 단서) | — |
| 1 | `incidents/event_001.py` | 예 | `triage_alert`, `check_schedule`, `escalate` |
| 2 | `incidents/security_audit.py` | `escalate` 해결 후 | `audit_logins`, `review_access`, `preserve_logs` |
| 3 | `incidents/power_control.py` | `preserve_logs` 해결 후 | `inspect_power`, `set_limit` |
| 4 | `incidents/sublevel_access.py` | `set_limit` 해결 후 | `request_access`, `enter_room`, `handle_device` |
| 5 | `incidents/case_report.py` | `handle_device` 해결 후 | `draft_report` |

새 게임은 `main.py`(사용법)와 `incidents/event_001.py` 두 탭을 열고 `main.py`를 활성으로 시작한다.

## 사건과 전이

모든 사건은 다음 사건으로 이어지는 한 줄기이고(공통 합류), 선택은 플래그로 남아 뒤 사건의 주석·로그와 엔딩을 바꾼다.

| 사건 (함수) | 입력 | 선택 → 효과(플래그) | 다음 |
| --- | --- | --- | --- |
| triage (`triage_alert`) | `action` 1~3 | 1 → `analyzed` / 2 → `isolated` / 3 → 경고 로그 | schedule |
| schedule (`check_schedule`) | `hour` 0~23 | 2 → `cron_found` | escalate |
| escalate (`escalate`) | `notify_security` bool | True → `notified` | audit |
| audit (`audit_logins`) | `target` "admin"·"backup"·"guest" | "backup" → `backup_suspect` | review |
| review (`review_access`) | `action` 1~2 | 1 → `locked` | preserve |
| preserve (`preserve_logs`) | `keep_logs` bool | True → `logs_kept` / False → 경고 로그 | power |
| power (`inspect_power`) | `action` 1~3 | 1 → `traced_b2` / 3 → 경고 로그 | limit |
| limit (`set_limit`) | `limit` 0~100 | 30 이하 → `spike_seen` | access |
| access (`request_access`) | `action` 1~2 | 1 → `badge` / 2 → 경고 로그 | room |
| room (`enter_room`) | `room` "B2-03"·"B2-07"·"B2-11" | "B2-07" → `device_found` | device |
| device (`handle_device`) | `action` 1~3 | 1 → `documented` / 2 → `unplugged` | report |
| report (`draft_report`) | `action` 1~2 | 1 이고 `device_found` → **resolved** / 그 외 → **sealed** | 엔딩 |

## 선택에 따라 달라지는 주석 (DB-01)

| 사건 | 조건 플래그 | 내용 |
| --- | --- | --- |
| schedule | `analyzed` | 출발지 10.0.2.14가 등록 대역 밖이라는 단서 |
| escalate | `cron_found` | 담당자 없는 작업 `sync_b2` |
| audit | `notified` | 보안팀 답장 |
| review | `backup_suspect` | 폐기된 백업 서버의 계정이 로그인했다는 사실 |
| power | `isolated` | 격리 후에도 B2 전력이 그대로 |
| access | `traced_b2` | 회로가 동쪽 복도 끝 방에서 끝남 |
| room | `spike_seen`, `traced_b2` | B2-07을 가리키는 단서 |
| device | `device_found` | BACKUP-02 발견 여부 |
| report | `device_found`, `logs_kept` | 보고서에 쓸 수 있는 사실과 근거 |

## 엔딩

| ID | 조건 | 마지막 로그 |
| --- | --- | --- |
| resolved | B2-07에서 장치를 찾았고(`device_found`), 사실대로 보고(`action = 1`) | 다음 날 02:14, 경보가 울리지 않는다 |
| sealed | 그 외 전부 | 다음 날 02:14, 같은 경보가 다시 올라온다 |

`resolved`로 가려면 B2-07을 골라야 한다. 단서는 `inspect_power`에서 회로를 추적(1)하거나 `set_limit`에서 기준을 30 이하로 낮출 때 `enter_room` 주석에 나타난다. 단서 없이 맞힐 수도 있다.

## 검증

`src/scenario/validate.test.ts`가 모든 (사건, 플래그) 상태를 탐색해 모든 사건·두 엔딩 도달, 화면에 지시문이 남지 않음, 템플릿 규칙(필드 줄 하나, 탭·삼중 따옴표·중첩 `def` 없음, 함수 순서), 주석의 선택지 번호와 허용값 일치, 전이 그래프에 되돌아가는 루프 없음을 확인한다.
