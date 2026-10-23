# `main.py` 시나리오 선택·새 시나리오 2개 재검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 1차 검증자와 같음, 보강 작업은 하지 않음)
- 대상: 커밋 `8fa15fa`(HEAD, `1786f6b` 위), 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 16파일 +234/−19
  - 코드: `src/app/App.tsx`, `src/persistence/save.ts`, `src/app/hub/hub.ts`, `src/scenario/unlogged-run/chamber.py`·`decision.py`, `src/scenario/thermal-drift/unit_control.py`
  - 테스트: `src/persistence/save.test.ts`, `src/app/hub/hub.test.ts`
  - 기록: `docs/SOT.md`, `docs/architecture/00_overview.md`·`01_data_contracts.md`, `docs/scenario/*.md`, `docs/daily_logs/2026-10-23/work_log.md` §8, 1차 검증 기록(커밋에 포함 — 1차 검증자 작성본과 바이트 동일함을 `diff`로 확인)
- 1차 기록: [`scenario_hub_and_new_scenarios.md`](scenario_hub_and_new_scenarios.md)(합격, 비차단 N1~N9)

## 2. 범위

1. N1~N9 보강이 정확하고 완전한지(작업 로그 §8 대응표 기준). 이야기 문구는 R-07(주석만으로 답 찾기)과 분기 간 일관성까지
2. 보강이 만든 회귀(전환 안내 위치, 언마운트 시 `saver.cancel`, `hub.ts` 함수 치환)
3. `npm run lint`, `npm test`, `npm run build`
4. 새 가드 변이
5. 짧은 브라우저 재확인(복원 로그 뒤 안내, 입력 직후 같은 시나리오 restart, 전환)

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-hub2`

- `git show 8fa15fa` 전체 diff, 바뀐 `.py`·`App.tsx`·`save.ts`·`hub.ts` 해당 부분 읽기. N9의 "배포된 v4" 사실 확인: `git merge-base --is-ancestor 3297b74 7fdcf2d`(아님), `origin/main`의 *Incident* `version: 3`.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 1회 치환 → `npx vitest run src` → 백업으로 복원 → `cmp` 바이트 비교. 커밋하지 않음.
- App 변이: 소스 변이 → `npx vite build --outDir <S>/dist-<이름>` → 즉시 백업 복원·`cmp`.
- 브라우저: 원본 `dist`와 변이 빌드 3개를 `npx vite preview --port 4191~4194 --strictPort`(내 PID 15408·15410·15412·15414와 자식들)로 서빙, Playwright(설치된 Chromium, 1280×640). 스크립트 `<S>/p2.mjs` — ① *Unlogged Run* 두 사건 해결 → 2번 → 3번 선택 후 Terminal 첫 줄·마지막 두 줄, ② 02 파일에 값 입력 직후 `main.py` 탭 클릭 → 2번 실행(디바운스 400ms 이내) 후 저장된 편집 값, ③ *Thermal Drift*에서 값 입력 직후 같은 시나리오 `restart = True` 실행, `Storage.prototype.setItem/removeItem`을 감싸 쓰기 순서 기록(감싸기를 두 번 호출해 같은 항목이 두 번씩 찍힌 것은 스크립트 탓). 콘솔 error/warning·pageerror 수집. 끝난 뒤 내 PID만 종료, 4191~4194 응답 없음 확인.

## 4. 결과

### 4.1 지적별 보강 확인

| 지적 | 보강 | 판정 |
| --- | --- | --- |
| N1 `check_project`가 못 본 'LMN' 언급 | `chamber.py:38-40` 'LMN' 줄은 `@if chamber_found`에서만. `@else`는 "run-0이 어떤 프로젝트의 실험인지 찾아보자" | 해소. 'LMN'을 보지 않은 경로에서는 나오지 않음 |
| N2 선택지가 답을 미리 줌·`owner_traced` 경로 단서 부족·스캔 문구 | `decision.py:15` "한서윤 박사 (2년 전 퇴사한 수석 연구원)"; `chamber.py:34` "박사가 떠날 무렵 끝난 프로젝트가 있을까"; 모든 경로 공통 `chamber.py:41` "이미 중단된 프로젝트일 수 있다. 목록은 config/lab.py"; `chamber.py:23` "4번 챔버 안은 아직 들여다보지 않았다" | 해소. `config/lab.py`의 `CANCELLED_PROJECTS = ["LUMEN"]`("2년 전 예산 종료")로 어느 경로에서든 답을 찾을 수 있다(R-07). `decision.py:10`의 `@else` "끝내 확인하지 못했다"와 선택지 설명이 더는 엇갈리지 않음. 챔버 4번은 큐의 세 분기 로그가 모두 보여 주므로 `:23` 문구와 일치 |
| N3 svc-facility 단정 | `unit_control.py:24-28` `crac3_found`면 "바꾼 계정은 svc-facility", 아니면 "모드는 svc-facility만 바꿀 수 있다" | 해소. 뒤 로그·엔딩(svc-facility 계정 정지)과 일관 |
| N4 전환 안내가 Terminal 맨 위 | `App.tsx:124` 초기 일시 출력의 위치를 복원한 로그 길이로 | 해소(4.3) |
| N5 같은 시나리오 재선택 규칙 | `docs/SOT.md` §3.7에 "지금 열린 시나리오를 다시 골라도 … 저장 후 다시 열며, 진행은 그대로", "기존 로그 다음에 선택 결과 한 줄" | 해소. 브라우저 동작과 일치 |
| N6 언마운트 시 타이머 | `save.ts:154-158` `cancel()`(타이머·대기 스냅샷 버림), `App.tsx:190` 언마운트 정리에서 호출, `save.test.ts` 셀 추가, 아키텍처 §3.1에 이유 | 해소(4.2·4.4) |
| N7 데이터 계약 §8 | `01_data_contracts.md` "시나리오를 처음 고른 화면(`main.py`와 시작 사건의 파일, 시작 파일이 활성)… 고른 경우 현재 사건 파일" | 해소. `App.tsx` `freshWorkspace`·`resumeAt`과 일치 |
| N8 SoT §8 | "Owner 합의 사항은 §1, §3.3, §3.5, §3.6, §3.7, §5.4에" | 해소 |
| N9 기록 사소 | `incident-0214.md` "v4(배포되지 않은 채 두 변경을 함께 담음)", 작업 로그 번호 중복 제거, R-08 줄을 §3 끝으로 되돌리고 §3.1도 같다고 명시, `hub.ts:39-40` 함수 치환 + `$&` 제목 테스트 | 해소. **1차 기록 N9의 "이미 배포된 v4(PR #2)" 서술은 검증자 착오였다** — PR #2(`7fdcf2d`)는 README 커밋만 담았고 `3297b74`(v4)는 `main`에 없다(`origin/main`의 *Incident*는 `version: 3`). 수정된 문장이 사실이다 |

### 4.2 회귀 점검

- `cancel()`과 전환 순서: 전환 경로(`runMain`)는 언마운트 전에 `saveLatest()`로 최신 상태를 즉시 쓰므로, 언마운트 시 `cancel()`이 버리는 것은 이미 쓰인 상태의 사본뿐이다. 그 결과 **`saveLatest()`가 이제 유일한 보호막이 되어 그 제거가 브라우저에서 드러난다**(4.4 A7 — 1차의 A1은 관찰 불가였다). 언마운트 경로는 여전히 `runMain` 하나(키 변경)이므로 데이터 손실 경로 없음.
- 개발 모드 StrictMode의 가짜 언마운트에서도 `cancel()` 뒤 저장 effect가 다시 실행되어 다시 예약하므로 문제 없음(코드 추론).
- 초기 안내 위치: 로비(`scenario` 없음)는 0, 이후 실행 안내는 기존대로 `say()`가 현재 로그 길이에 붙인다(`App.tsx:208`). 복원 안내(`initial.notice`)도 같은 위치로 옮겨져 손상 저장 안내가 로그 뒤에 나온다 — 일관.
- `hub.ts` 정규식 `^( +scenario = )1$`(m)는 템플릿의 값 줄 하나에만 맞고, 주석 줄(`#`로 시작)의 소개 문구에는 맞지 않는다. 테스트가 `summary: 'scenario = 1'`로 확인.

### 4.3 브라우저 재확인 (원본 빌드)

- 안내 위치: 2번 → 3번 복귀 후 Terminal 첫 줄 `$ python lab/01_scheduler.py`(복원 로그), 마지막 두 줄 `$ python main.py | [workspace] Unlogged Run — 이어서 진행`. 변이 A6(옛 위치)에서는 첫 줄이 `$ python main.py`.
- 입력 직후 전환: 02 파일 `chamber = 4` 입력 직후(디바운스 전) 2번으로 전환 → 저장된 *Unlogged Run* 편집 값 `{"chamber":{"chamber":"4"}}` 보존.
- 입력 직후 같은 시나리오 restart: 쓰기 순서 `set(편집 action=3)` → `rm` → `set(진행 0, 편집 {})` …, 삭제 뒤에 옛 상태 쓰기 없음. 최종 진행 0.
- 콘솔 error/warning·pageerror 0.

### 4.4 변이 결과

단위(`npx vitest run src`, 144개):

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| C1 `cancel()`이 아무것도 안 함 | `save.ts:154-158` | `cancel (workspace closed) drops a scheduled snapshot; later schedules still work` |
| C2 타이머만 멈추고 대기 스냅샷 유지 | `save.ts:157` | 같은 셀(뒤 `flush`가 써 버림) |
| C3 과잉: `cancel()`이 먼저 써 버림 | `save.ts:154` | 같은 셀 |
| P1 목록을 문자열 치환으로 | `hub.ts:39` | `inserts titles literally, even with replacement patterns…` |
| P2 기본값을 문자열 치환으로 | `hub.ts:40` | 같은 셀(소개의 `scenario = 1`이 먼저 바뀜) |
| P3 기본값 치환이 안 맞음 | `hub.ts:40` | 위 셀 + `preselects the open scenario, or 1…` |
| T1 'LMN' 줄을 무조건 표시(N1 되돌림) | `chamber.py:38-40` | **안 깨짐** — 이야기상 "보지 않은 단서" 여부는 검증기가 판정하지 않는다(4.5) |

App(빌드 + 브라우저):

| 변이 | 위치 | 원본과 다른 관찰 |
| --- | --- | --- |
| A5 언마운트 `cancel()` 제거 | `App.tsx:190` | 차이 없음 — `saveLatest()`가 먼저 타이머를 비우므로 `cancel()`은 2차 방어(단위 셀 C1~C3가 동작을 잠금) |
| A6 안내를 옛 위치(0)로 | `App.tsx:124` | Terminal 첫 줄이 `$ python main.py`(로그 앞) |
| A7 `saveLatest()` 제거 | `App.tsx` `runMain` | 입력 직후 전환에서 편집 값 `{}`로 유실, restart 전 편집 저장 없음 |

- 단위 셀은 덜 엄격(C1·C2·P1·P2·P3)·지나치게 엄격(C3) 양방향 모두 깨진다. 모든 변이 후 `cmp` 일치, 최종 `git status --short`는 이 기록 파일만.

### 4.5 명령 결과

- `npm run lint`: 종료 코드 0, 경고 없음.
- `npm test`: `Test Files 14 passed (14)`, `Tests 144 passed (144)`.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **R-N1 — 이야기 일관성은 자동 가드가 없다(참고).** N1을 되돌리는 변이(T1)는 테스트 144개를 모두 통과한다. "플레이어가 아직 보지 않은 사실을 단정하지 않는다"는 규칙은 검증기가 판정할 수 없는 영역이라 Owner 플레이 테스트(R-07)와 검토로만 지켜진다. 결함은 아님.
- **R-N2 — 사소.** `chamber.py:38-40`의 'LMN' 줄은 `chamber_found`에서만 나오는데, 챔버 4번을 읽지 않고 스캔만 한 경로(`samples_alive`)에서도 스캔 로그로 'LMN'을 이미 봤다. 그 경로에서 단서를 되풀이하지 않을 뿐 모순은 아니다(공통 안내 `:41`로 답은 찾을 수 있다).
- 언마운트 정리의 `cancel()`(`App.tsx:190`)은 현재 관찰상 2차 방어라 브라우저로도 단위로도 연결 자체는 잠기지 않는다(A5). 1차 N6의 요지(순서 의존 제거)는 해소됐으므로 참고 사항.

## 6. 판정

**합격** — 1차 비차단 N1~N9가 모두 정확히 보강되었고 회귀는 없다. 이야기 문구는 'LMN'·LUMEN·svc-facility를 보지 않은 경로에서 단정하지 않으며, 모든 경로에서 `config/lab.py`·설정 파일 단서로 답을 찾을 수 있다. 전환 안내는 복원 로그 뒤에 붙고, 입력 직후 전환·같은 시나리오 restart 모두 저장이 정확하다. 1차 N9의 "배포된 v4" 지적은 검증자 착오였음을 기록한다.

## 7. 남은 일 (결함 아님)

- PR 갱신·Owner 병합 후 배포 주소에서 확인, Owner 플레이 테스트(AC-10, R-07 — 새 시나리오 두 개의 단서 난도 포함).
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-hub2
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git merge-base --is-ancestor 3297b74 7fdcf2d || echo "v4는 main에 없음"
git status --short                                   # 변이 전: 비어 있어야 함
cp src/persistence/save.ts src/app/hub/hub.ts src/app/App.tsx $S/bak/
python3 $M src/app/hub/hub.ts ".replace('    # {scenarios}', () => list)" ".replace('    # {scenarios}', list)"   # P1 예시
npx vitest run src
cp $S/bak/hub.ts src/app/hub/hub.ts && cmp src/app/hub/hub.ts $S/bak/hub.ts
npx vite preview --port 4191 --strictPort &           # 끝나면 이 PID만 종료
node $S/p2.mjs http://localhost:4191/
git status --short                                    # 이 기록 파일만
```
