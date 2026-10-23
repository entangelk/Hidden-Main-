# 시나리오 — *Thermal Drift*

> 상태: v1 (시나리오 `version: 1`) · 2026-10-23 · 코드: `src/scenario/thermal-drift/`
> 상위 기준: [`../SOT.md`](../SOT.md) §3.7, [`../architecture/01_data_contracts.md`](../architecture/01_data_contracts.md) §3

## 줄거리

플레이어는 데이터센터 야간 당직자다. 토요일 03:40, 서버실 R열 온도가 계속 오른다. R열을 맡는 냉각 장치 CRAC-3가 일정에 없던 '점검 모드'로 꺼져 있고, 시설 자동화 계정 svc-facility가 6주째 매주 토요일 03:00마다 같은 일을 해 왔다. 그 시간 동안 자산 대장상 비어 있는 랙 R-17에서는 표식 없는 GPU 서버 4대가 돌고 있다. 무엇을 확인하고 누구에게 보고하느냐에 따라 **원인 규명**으로 끝나거나 **임시 조치**로 덮인다.

## 파일

| 순서 | 파일 | 처음부터 보임 | 사건 함수 |
| --- | --- | --- | --- |
| — | `config/facility.py` | 예 (냉각 장치 구역, 점검 일정, 랙 전력 한도) | — |
| 1 | `cooling/01_temp_alarm.py` | 예 | `check_alarm`, `inspect_unit` |
| 2 | `cooling/02_unit_control.py` | `inspect_unit` 해결 후 | `resume_cooling`, `trace_override`, `check_power` |
| 3 | `cooling/03_rack_audit.py` | `check_power` 해결 후 | `open_rack`, `file_report` |

`main.py`에서 2번을 고르면 `main.py`와 `cooling/01_temp_alarm.py`가 열리고 01 파일이 활성이다.

## 사건과 전이

| 사건 (함수) | 입력 | 선택 → 효과(플래그) | 다음 |
| --- | --- | --- | --- |
| alarm (`check_alarm`) | `action` 1~3 | 1 → `mapped`(열 지도) / 2 → `fans_max` / 3 → 경고 로그 | unit |
| unit (`inspect_unit`) | `unit` "CRAC-1"·"CRAC-2"·"CRAC-3" | "CRAC-3" → `crac3_found` | resume |
| resume (`resume_cooling`) | `resume` bool | True → `cooling_resumed` / False → 경고 로그 | override |
| override (`trace_override`) | `days` 1~30 | 7 이상 → `pattern_found` | power |
| power (`check_power`) | `rack` "R-15"·"R-16"·"R-17" | "R-17" → `rig_suspect` | open |
| open (`open_rack`) | `action` 1~2 | 1 → `rig_found` | report |
| report (`file_report`) | `recipient` "facility"·"security"·"none" | `rig_found` 이고 "security" → **traced** / 그 외 → **patched** | 엔딩 |

## 다시 시도할 수 있는 사건 (SoT §3.8)

| 사건 | 기회 | 못 찾음(miss) |
| --- | --- | --- |
| unit (`unit`) | 2번 | "CRAC-3"이 아닌 장치 |
| override (`days`) | 2번 | 7일 미만 |
| power (`rack`) | 2번 | "R-17"이 아닌 랙 |

## 선택에 따라 달라지는 주석

| 사건 | 조건 플래그 | 내용 |
| --- | --- | --- |
| unit | `mapped` | 뜨거운 곳이 R열이라는 단서(구역표는 `config/facility.py`) |
| resume | `crac3_found`, `fans_max` | CRAC-3 점검 모드를 직접 찾았는지, 팬 최대가 소용없었다는 사실 |
| override | `crac3_found` | 점검 모드를 켠 계정을 직접 확인했는지(아니면 "모드는 이 계정만 바꿀 수 있다"로 안내) |
| power | `pattern_found` | 점검 모드 시간대에 R열 전력도 오른다는 단서 |
| open | `rig_suspect` | R-17이 한도를 넘는 전력을 쓴다는 사실 |
| report | `rig_found`, `pattern_found`, `cooling_resumed` | 보고서에 쓸 수 있는 사실, 냉각 복구 여부 |

## 엔딩

| ID | 조건 | 마지막 로그 |
| --- | --- | --- |
| traced | R-17을 열어 장비를 찾았고(`rig_found`) 보안팀에 보고 | 다음 주 토요일, CRAC-3가 점검 모드로 바뀌지 않는다 |
| patched | 그 외 전부 (시설팀은 svc-facility를 관리하는 쪽이라 '설정 오류'로 덮는다) | 다음 주 토요일, R열 온도가 다시 오른다 |

## 검증

`src/scenario/validate.test.ts`가 모든 (사건, 플래그) 상태(190개)를 탐색해 *Incident 02:14*와 같은 규칙을 확인한다([`incident-0214.md`](incident-0214.md) §검증).
