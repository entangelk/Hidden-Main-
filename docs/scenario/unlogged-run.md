# 시나리오 — *Unlogged Run*

> 상태: v2 (시나리오 `version: 2`) · 2026-10-23 · 코드: `src/scenario/unlogged-run/`
> 상위 기준: [`../SOT.md`](../SOT.md) §3.7, [`../architecture/01_data_contracts.md`](../architecture/01_data_contracts.md) §3

## 줄거리

플레이어는 연구소 야간 당직자다. 일요일 01:20, 자동화 스케줄러가 실험 대장에 없는 작업 run-0을 돌리고 있다. run-0은 2년 전부터 매일 배양 챔버 4번에 영양액을 넣어 왔고, 그 안에서는 2년 전 '폐기 완료'로 기록된 중단 프로젝트 LUMEN의 시료가 아직 살아 있다. 작업을 등록한 사람은 퇴사한 LUMEN 책임자 한서윤 박사다. 아침이 오기 전 시료를 **보존**하고 사실대로 기록할지, 기록대로 **폐기**할지 정한다.

## 파일

| 순서 | 파일 | 처음부터 보임 | 사건 함수 |
| --- | --- | --- | --- |
| — | `config/lab.py` | 예 (챔버 수, 진행·중단 프로젝트 목록) | — |
| 1 | `lab/01_scheduler.py` | 예 | `check_queue`, `find_owner` |
| 2 | `lab/02_chamber.py` | `find_owner` 해결 후 | `read_chamber`, `scan_samples`, `check_project` |
| 3 | `lab/03_decision.py` | `check_project` 해결 후 | `make_call`, `decide` |

`main.py`에서 3번을 고르면 `main.py`와 `lab/01_scheduler.py`가 열리고 01 파일이 활성이다.

## 사건과 전이

| 사건 (함수) | 입력 | 선택 → 효과(플래그) | 다음 |
| --- | --- | --- | --- |
| queue (`check_queue`) | `action` 1~3 | 1 → `queue_read` / 2 → `halted`(경고 로그) / 3 → 그대로 둠 | owner |
| owner (`find_owner`) | `account` "svc-lab"·"kim.jh"·"admin" | "svc-lab" → `owner_traced` | chamber |
| chamber (`read_chamber`) | `chamber` 1~4 | 4 → `chamber_found` | samples |
| samples (`scan_samples`) | `scan` bool | True → `samples_alive` | project |
| project (`check_project`) | `project` "ARGO"·"TIDE"·"LUMEN" | "LUMEN" → `lumen_found` | call |
| call (`make_call`) | `who` "director"·"dr_han"·"nobody" | "dr_han" 이고 `lumen_found` → `testimony` / "director" → `director_told` | decide |
| decide (`decide`) | `action` 1~2 | 1 이고 `samples_alive` → **preserved** / 1 이고 스캔 안 함 → 보존 요청 반려, **erased** / 2 → **erased** | 엔딩 |

## 다시 시도할 수 있는 사건 (SoT §3.8)

| 사건 | 기회 | 못 찾음(miss) |
| --- | --- | --- |
| owner (`account`) | 2번 | "svc-lab"이 아닌 계정 |
| chamber (`chamber`) | 2번 | 4가 아닌 챔버 |
| project (`project`) | 2번 | "LUMEN"이 아닌 프로젝트 |

- v2: 이 다시 시도 규칙 때문에 버전을 올렸다. v1 저장에서 이 사건들을 못 찾고 넘어간 기록은 그 사건까지만 이어지고, "시나리오가 바뀌어 일부 진행을 되돌렸습니다" 안내가 나온다. 진행이 잘리지 않은 v1 저장도 편집 중이던 값은 버전 규칙(SoT §3.6)으로 초기화된다(안내 없음).

## 선택에 따라 달라지는 주석

| 사건 | 조건 플래그 | 내용 |
| --- | --- | --- |
| owner | `queue_read` | 작성자 칸이 비어 있으니 사람이 아니라 서비스 계정이라는 단서 |
| chamber | `halted` | run-0을 멈추자 챔버 경보가 울렸다는 사실 |
| samples | `chamber_found` | 4번 챔버의 'LMN' 용기 |
| project | `owner_traced`, `chamber_found` | 등록 단말이 2년 전 퇴사한 한서윤 박사의 것이라는 단서, 용기 라벨 'LMN'. 어느 경우든 "중단된 프로젝트일 수 있다, 목록은 `config/lab.py`" 안내 |
| call | `lumen_found` | 폐기 완료 기록과 달리 시료가 살아 있다는 모순 |
| decide | `samples_alive`, `testimony`, `director_told` | 시료 생존, 박사의 증언, 소장의 대기 |

## 엔딩

| ID | 조건 | 마지막 로그 |
| --- | --- | --- |
| preserved | 시료 생존을 확인했고(`samples_alive`) 보존을 선택 | 월요일 오전, 시료가 정식 실험으로 다시 등록된다 |
| erased | 그 외 전부 | 월요일 오전, 4번 챔버는 비고 run-0은 기록에서 사라진다 |

## 검증

`src/scenario/validate.test.ts`가 모든 (사건, 플래그) 상태(247개)를 탐색해 *Incident 02:14*와 같은 규칙을 확인한다([`incident-0214.md`](incident-0214.md) §검증).
