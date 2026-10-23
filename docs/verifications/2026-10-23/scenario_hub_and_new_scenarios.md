# `main.py` 시나리오 선택·새 시나리오 2개 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: `git diff 70960c2..HEAD`(HEAD `1786f6b`), 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 커밋 `2738e17`(main.py 허브), `1dcba39`(시나리오 2개), `1786f6b`(문서, SoT v0.8), `f75e573`(origin/main 병합, README만). 35파일 +1208/−125
- 정본 기준: `docs/SOT.md` v0.8 §3.7(+ §2, §3.6, §5.1, §5.2, §5.4), `docs/architecture/00_overview.md` §3.1·§7, `docs/architecture/01_data_contracts.md` §1·§3·§8·§9·§10

## 2. 범위

1. `src/app/App.tsx` 두 층 구조(바깥 `App` + 키로 다시 마운트되는 `Workspace`): 오래된 ref, 전환 직전 저장 순서(특히 **같은 시나리오 restart**), 언마운트 뒤 디바운스 타이머, `pagehide`, `main.py` 값과 저장된 `PlayerEdits`의 분리, 수정 표시
2. `src/persistence/save.ts`(`readActive`·`choose`·`restore`의 `sharedFiles`), `src/app/hub/hub.ts`(텍스트 생성, 슬롯, 기본값, `runHub`), `src/app/run.ts`의 `failureLines` 분리(동작 불변 여부)
3. 새 시나리오 *Thermal Drift*·*Unlogged Run*의 내용(R-07: 주석만 보고 답을 찾을 수 있는지, 분기 간 로그·주석 일관성, 플레이어가 아직 모르는 사실을 단정하는 문구)
4. 검증기 범위, 옛 저장 이전(고른 시나리오 키 없는 v3 *Incident* 저장)
5. 문서 정확성·모순(R-01 "메인 메뉴 없음" vs `main.py` 허브, §5.4 등)
6. 테스트 양방향성 + 변이, `npm run lint`·`npm test`·`npm run build`, 브라우저

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-hub`

- 전체 diff와 관련 파일 전문 읽기(`App.tsx`, `hub.ts`, `hub/main.py`, `save.ts`, `run.ts`, 새 시나리오 `index.ts`·`.py` 전부, 시나리오·SoT·아키텍처·계약 문서).
- 브라우저: `npm run build` 결과를 `npx vite preview --port 4175 --strictPort`(내 PID 9068·자식 9085·9086)로 서빙, Playwright(설치된 Chromium, 1280×640). Owner 측 `multi.mjs`의 도우미 함수 부분만 복사해 내 스크립트 작성: `<S>/h2.mjs`(로비·잘못된 번호·전환 직전 편집·`main.py` 값 누출·같은 시나리오 restart·새로고침·복귀), `<S>/m.mjs`(키 없는 v3 저장 이전, 완료 시나리오 재선택, 엔딩 뒤 실행), `<S>/fast.mjs`·`<S>/fast2.mjs`(편집 직후 약 100ms 안에 같은 시나리오 restart, `Storage.prototype` 감싸 쓰기 순서 기록). 콘솔 error/warning·pageerror 수집.
- App 변이(컴포넌트 테스트 기반이 없어 빌드 + 브라우저로 판정): 소스를 변이 → `npx vite build --outDir <S>/dist-<이름>` → 즉시 백업에서 복원·`cmp`. 각 빌드를 4181~4185(내 PID 12300·12302·12304·12306·12308과 자식)로 서빙해 `<S>/probe.mjs`·`fast.mjs` 실행.
- 단위 변이: 사전 `git status --short` 비어 있음 확인 → `<S>/bak/`에 `cp` 백업 → 1회 치환 → `npx vitest run src` → 백업으로 복원 → `cmp` 바이트 비교. 커밋하지 않음. (중간에 한 변이(H1)의 역치환 문자열이 모호해 역편집이 실패하고 뒤 변이들이 겹친 사고가 있었다. `git diff`로 확인 후 백업으로 복원·`cmp`·`git status` 깨끗함을 확인하고, 겹쳤던 변이 H1~H6·R1을 백업 복원 방식으로 처음부터 다시 실행했다. 아래 표는 다시 실행한 결과다.)
- 끝난 뒤 내가 띄운 preview 프로세스만 PID로 종료, 4175·4181~4185 응답 없음 확인. 최종 `git status --short`는 이 기록 파일만.

## 4. 결과

### 4.1 App 두 층 구조 (`src/app/App.tsx`)

- 전환 순서 `App.tsx:215-217`: `saveLatest()`(ref의 최신 진행·편집·탭을 `saveNow` → 대기 중 디바운스 타이머도 취소) → `choose()`(restart면 고른 슬롯 삭제 → `incident-workspace:active` 기록) → `onChoose`(키 증가로 `Workspace` 다시 마운트). 같은 시나리오 restart에서도 "저장 → 삭제" 순서가 계약(`01_data_contracts.md` §9)대로다.
- 쓰기 순서 실측(`fast2.mjs`, 원본 빌드): `set save:unlogged-run(진행 1)` → `rm save:unlogged-run` → `set active` → 새 `Workspace` 마운트 `set(진행 0)` → 400ms 뒤 `set(진행 0)`. 새로고침 후에도 lab 파일은 `01_scheduler.py` 하나. 정상.
- 언마운트 뒤 타이머: `Workspace`는 언마운트 시 저장기 타이머를 정리하지 않는다. 다만 언마운트 경로는 `runMain` 하나이고 그 안의 `saveLatest()`가 `flush`로 타이머를 지운다. `saveLatest()`를 없앤 변이(A1)에서는 옛 타이머가 **삭제 뒤에 진행 1을 다시 썼고**(`3864ms set(1)`), 새 `Workspace`의 디바운스(`3895ms set(0)`)가 곧바로 덮어써 관찰 결과는 같았다 → 4.6 A1, 비차단 N6.
- `pagehide`: 리스너는 `saveLatest`에 묶여 마운트마다 새로 달리고 언마운트 시 떨어진다(`App.tsx` 해당 `useEffect`). 로비에서는 `scenario`가 없어 아무것도 쓰지 않는다 — 로비에서 새로고침해도 v3 저장의 `scenarioVersion`이 3 그대로임을 확인.
- `main.py` 값 분리: `editsRef`에는 `hub` 키가 함께 있지만 저장 경로 셋 모두에서 빠진다 — `saveLatest`는 구조 분해로 제거(`App.tsx:172`), 즉시·디바운스 저장은 `hub`가 없는 `edits` 상태를 쓴다(`updateEdits`가 `hub`를 떼고 `setEdits`). 브라우저: 전환 뒤 모든 저장 값에 `"hub"` 없음. 다시 마운트하면 `hubEdits`가 `{}`로 시작해 `scenario = <지금 시나리오>`, `restart = False`로 돌아감(같은 시나리오 restart 직후 `restart = False` 확인) — 연속 restart 사고를 막는다.
- 수정 표시: `main.py`는 기본값이 현재 시나리오 번호라 고른 직후 수정 표시 없음, 편집 중이던 `02_unit_control.py`만 `is-dirty`. 정상.
- 이어하기: 고른 시나리오는 `resumeAt`(`App.tsx:99`)으로 현재 사건 파일이 열리고 활성. 페이지 새로고침은 저장된 탭 그대로(의도된 차이).

### 4.2 저장 (`save.ts`)

- `readActive`: 목록에 있는 id만 돌려주고, 차단된 저장소에서 예외 없음. `choose`: restart면 그 슬롯만 지우고 active 기록, 실패는 무시.
- `restore(…, sharedFiles)`: 공용 파일(`main.py`) 탭을 보이는 파일로 취급. 테스트는 양방향(공용 있음/없음).
- 옛 저장 이전(브라우저, `m.mjs`): 키 없는 v3 *Incident* 저장(옛 경로 탭, 편집 값) → 첫 화면은 로비(Explorer `main.py`만), 목록에 `1. Incident 02:14 … [진행 중]` → 1번 실행 → `[workspace] Incident 02:14 — 이어서 진행`, 탭 `main.py, 02_security_audit.py`(활성), 콘솔 오류 0. 문서(`incident-0214.md:25`)와 일치.

### 4.3 허브 (`hub.ts`, `hub/main.py`)와 `run.ts`

- 목록·기본값·슬롯: 템플릿의 `    # {scenarios}`를 목록으로, `scenario = 1`을 현재 번호로 바꾼 뒤 `findValueSlots`로 슬롯 2개. `scenario` 허용값 1..N. 잘못된 번호 → `ValueError: scenario 값은 1, 2, 3 중 하나여야 합니다 (입력: 9)`, 저장소 키 0개 그대로(AC-07과 같은 보증).
- 완료 시나리오 재선택: `이미 완료 (처음부터 하려면 restart = True)`, 엔딩 파일에서 실행하면 `처리할 사건이 없습니다.`
- `failureLines` 분리: 코드상 이전 인라인 블록과 같은 출력. `run.test.ts`가 그대로 통과하고, `$ python` 줄 제거 변이는 `runScene`·`runHub` 양쪽 셀이 잡는다(R2). 줄 번호를 편집 전 텍스트에서 세게 바꾼 변이(R1)는 살아남는데, 리터럴 편집이 줄바꿈을 넣을 수 없어 줄 번호가 같으므로 **동치 변이**다.

### 4.4 새 시나리오 내용

- 구조: 각 파일 3개·사건 7개·엔딩 2개, 순번 경로(`cooling/01_…`, `lab/01_…`), 검증기 전 규칙 통과(모든 사건·엔딩·전이 도달, 주석 변형 양쪽 노출 — `validateScenario`가 `firedTransitions`·`variantOutcomes`까지 문제로 올림), 상태 수 190·214(문서와 일치).
- R-07(주석만으로 답 찾기): *Thermal Drift*는 각 사건에 단서가 있다(열 지도 → `config/facility.py` 구역표 → CRAC-3, "기간이 길수록 반복 패턴" → 7일 이상, "자산 대장에는 비어 있다" → R-17). *Unlogged Run*도 대부분 있다(작성자 칸 빈칸 → 서비스 계정, 큐의 세 분기 로그가 모두 "챔버 4번"을 말함). 예외는 N2.
- 일관성 문제는 N1~N3(비차단).

### 4.5 문서

- R-01과 §3.7: `main.py` 값 수정으로 고르며 별도 메뉴 화면이 없으므로 R-01("메인 메뉴 … 만들지 않는다", `SOT.md:40`)과 모순 없음. §3.7(`SOT.md:104`)이 명시.
- §5.2 P1 "추가 시나리오 로딩" → "외부 시나리오 로딩"으로 좁히고 번들 시나리오 선택을 MVP로 옮김(버전 로그 v0.8에 기록). 일관.
- §5.4, 계약 §1·§3·§9·§10, 아키텍처 §3.1·§7, HANDOFF(38줄 실측 일치), CHANGELOG, README — 코드와 일치. 사소한 불일치는 N7~N9.

### 4.6 변이 결과

단위(`npx vitest run src`, 142개):

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| S1 restart에도 삭제 안 함 | `save.ts` `choose` | `deletes only the chosen scenario save on restart…` |
| S2 항상 삭제 | `save.ts` `choose` | 같은 셀 |
| S3 아무 id나 active로 | `save.ts` `readActive` | `remembers the chosen id and reads back only known ids` |
| S4 공용 파일 무시 | `save.ts` `restore` | `keeps tabs of shared files…(both directions)` |
| H1 기본값 항상 1 | `hub.ts` `preset` | `preselects the open scenario, or 1…` |
| H2 기본값 +1 어긋남 | `hub.ts` `preset` | 같은 셀 |
| H3 0 기반 변환 누락 | `hub.ts` `runHub` | `picks the chosen scenario (0-based)…` |
| H4 허용 번호 N+1까지 | `hub.ts` `hubFields` | `rejects a number outside the list…` |
| H5 완료를 진행 중으로 | `hub.ts` `statusOf` | `is new without choices, playing mid-way, done at an ending` |
| H6 "지금 열림" 표시 제거 | `hub.ts` `hubView` | `lists every scenario … marks the open one` |
| H7 목록 자리표시자 미치환 | `hub.ts` `hubView` | 위 셀 + `have unique ids … the list explains every number` |
| R1 줄 번호를 편집 전 텍스트에서 | `run.ts` `failureLines` | 안 깨짐 — 동치 변이(4.3) |
| R2 `$ python` 줄 제거 | `run.ts` `failureLines` | `reports invalid values…(AC-07)`, `rejects a number outside the list…` |

App(빌드 + 브라우저, 자동 셀 없음):

| 변이 | 위치 | 원본과 다른 관찰 |
| --- | --- | --- |
| A1 `saveLatest()` 제거 | `App.tsx:215` | **관찰 차이 없음.** 디바운스가 이미 썼거나, 언마운트된 옛 타이머가 삭제 뒤 다시 쓰고 새 `Workspace`의 디바운스가 덮어씀(4.1) → N6 |
| A1b `choose()` 제거 | `App.tsx:217` | active 키 없음, 같은 시나리오 restart 뒤 진행 1 남음, 새로고침하면 로비 |
| A2 `saveLatest`에서 `hub` 안 뗌 | `App.tsx:172` | 저장된 `playerEdits`에 `"hub":{"scenario":"2"}` |
| A3 `resumeAt` 제거 | `App.tsx:99` | 복귀 시 활성 탭이 `main.py`(현재 사건 파일이 아님) |
| A4 `choose` 뒤에 `saveLatest`(순서 뒤집기) | `App.tsx:215-217` | 같은 시나리오 restart 뒤 진행 1이 남음(restart 무효) |

- 단위 셀은 덜 엄격(S1·S3·S4·H1·H3·H5·H6·H7)·지나치게 엄격(S2·H2·H4) 양방향 모두 깨진다. 모든 단위 변이 후 `cmp` 일치, App 변이 빌드 후 소스 `cmp` 일치.

### 4.7 명령 결과

- `npm run lint`: 출력 없음(통과).
- `npm test`: `Test Files 14 passed (14)`, `Tests 142 passed (142)` — 작업 로그 §7의 142개와 일치.
- `npm run build`: `✓ built`, 경고 없음.
- 브라우저 전 구간 콘솔 error/warning·pageerror 0.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **N1 — *Unlogged Run*: 보지 않은 단서를 단정하는 주석.** `src/scenario/unlogged-run/chamber.py:36`(`check_project`의 `@else`, 조건 `owner_traced` 거짓)이 "용기 라벨 'LMN'이 어떤 프로젝트의 약자인지 찾아보자"라고 쓴다. 'LMN'은 챔버 4번을 읽었거나(`chamber_found`) 스캔했을(`samples_alive`) 때만 Terminal에 나온다. 재현: `queue` 3 → `owner` "kim.jh" → `chamber` 1 → `scan` False → `check_project` 주석에 처음 보는 'LMN'. 조건을 `chamber_found`/`samples_alive`로 나누거나 문구를 바꿀 것.
- **N2 — *Unlogged Run*: 같은 장면에서 주석과 선택지 설명이 엇갈림, 단서 부족.** `decision.py:10` `@else`는 "run-0이 어떤 프로젝트의 실험인지는 끝내 확인하지 못했다"인데 바로 아래 선택지 설명 `decision.py:15`가 "한서윤 박사 (LUMEN 책임자, 퇴사)"로 답을 준다. 또 `owner_traced` 참 분기(`chamber.py:34`)는 "박사가 이끌던 프로젝트를 찾아보자"뿐이고 `config/lab.py`를 가리키지 않으며(그 안내는 `@else`에만 있음), `config/lab.py`에도 책임자 정보가 없어 그 분기에서 LUMEN은 사실상 추측이다(R-07). `chamber.py:23` `@else` "어느 챔버인지 확실하지 않지만"도 큐의 세 분기 로그가 모두 "챔버 4번"을 이미 보여 준 뒤라 어색하다.
- **N3 — *Thermal Drift*: 사소한 단정.** `src/scenario/thermal-drift/unit_control.py:24`는 모든 분기에서 "점검 모드를 켠 계정은 svc-facility다"라고 단정한다. `crac3_found`가 거짓이면 이 계정은 처음 나오는 정보인데, 조회 결과처럼 보이게 쓰는 편이 자연스럽다. 이야기 모순은 아님.
- **N4 — 시나리오 전환 안내 줄이 Terminal 맨 위에 붙음.** `App.tsx:123`이 `intro` 줄을 `at: 0`(재생 로그 첫 줄 앞)에 넣는다. 진행 중인 시나리오로 돌아가면 `[workspace] … — 이어서 진행` 또는 완료 시나리오의 `처음부터 하려면 restart = True` 안내가 이전 로그 **위쪽**에 나온다. *Incident 02:14* 후반처럼 로그가 길면 Terminal 아래쪽을 보는 플레이어는 이 안내를 못 볼 수 있고 시간 순서도 뒤집힌다. 마지막 로그 뒤(`at = log.length`)가 자연스럽다.
- **N5 — 같은 번호 재실행.** `main.py`에서 기본값 그대로 `Ctrl+Enter`를 누르면 지금 시나리오를 다시 마운트한다(탭이 현재 사건 파일로 이동, 안내 줄 추가). 해는 없으나 의도된 동작인지 SoT에 적혀 있지 않다. 참고.
- **N6 — App 전환 로직에 자동 테스트 없음, 언마운트 시 타이머 정리 없음.** 전환 순서(A4)·`choose`(A1b)·`hub` 분리(A2)·`resumeAt`(A3)는 브라우저로만 지켜진다. `saveLatest()`(A1)는 브라우저로도 관찰 차이가 없다 — 언마운트된 `Workspace`의 디바운스 타이머가 삭제 뒤에 옛 진행을 다시 쓰고, 새 `Workspace`의 같은 지연 타이머가 그 뒤에 덮어쓰기 때문이다(타이밍에 기대는 이중 방어). 현재 코드에서는 `saveLatest()`의 `flush`가 타이머를 지우므로 결함은 아니지만, 저장기 정리(`useEffect` 정리 함수에서 `flush` 또는 취소)를 두면 순서 의존이 사라진다. 순서 규칙(저장 → `choose`)을 순수 함수로 빼면 단위 셀로 잠글 수 있다.
- **N7 — 데이터 계약 §8 문장 낡음.** `docs/architecture/01_data_contracts.md:227` "남은 탭이 하나도 없으면 시작 사건의 파일 하나를 연 처음 화면" — 지금 처음 화면은 `main.py` + 시작 파일 두 탭(`App.tsx` `freshWorkspace`).
- **N8 — SoT §8 목록 누락.** `docs/SOT.md:194` "Owner 합의 사항은 §1, §3.5, §3.6에 반영"에 §3.7이 빠짐.
- **N9 — 기록 사소.** `docs/scenario/incident-0214.md:25`가 "v4: … `main.py`가 시나리오에서 빠져"라고 쓰지만, 이미 배포된 v4(PR #2)는 `main.py`를 가지고 있었고 이번에 버전을 올리지 않았다(편집 값에 영향이 없어 올리지 않은 판단 자체는 타당 — 문장만 "v4 이후"로). `docs/daily_logs/2026-10-23/work_log.md:94-95` "다음 단계"에 `2.`가 두 번(옛 줄 잔존). 아키텍처 §3.1 추가로 §3의 R-08 항목(`00_overview.md:84`)이 §3.1 아래로 밀려 들어감. `hub.ts:38-39`의 `String.replace`는 시나리오 제목·소개에 `$&` 같은 패턴이나 `scenario = 1`이 들어가면 깨질 수 있다(현재 데이터에는 없음).

## 6. 판정

**합격** — 차단 문제 없음.

- SoT v0.8 §3.7의 모든 항목을 브라우저로 확인: 로비(`main.py`만), 목록(번호·제목·소개·상태·지금 열림), 잘못된 번호 Traceback·무변경, 고르면 자기 저장에서 이어서(현재 사건 파일 활성), `restart = True`는 그 슬롯만 삭제(같은 시나리오도 저장 뒤 삭제), 전환 직전 편집·탭 저장, active 키 유지, `main.py` 값 비저장, 완료 시나리오 안내, 키 없는 v3 저장 이전.
- 단위 가드는 양방향 변이에 모두 깨지고, App의 주요 규칙(순서·`choose`·`hub` 분리·`resumeAt`)은 변이 빌드에서 브라우저로 드러난다.
- 새 시나리오 2개는 검증기 전 규칙을 통과한다. N1·N2(내용 일관성)는 플레이 체감에 영향이 있으므로 다음 보강에서 먼저 고치기를 권한다.

## 7. 남은 일 (결함 아님)

- N1~N9 반영 여부는 작업자/Owner 판단.
- PR 갱신·Owner 병합 후 배포 주소에서 확인, Owner 플레이 테스트(AC-10, R-07 — 특히 새 시나리오 두 개).
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-hub
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git status --short                                   # 변이 전: 비어 있어야 함
cp src/persistence/save.ts src/app/hub/hub.ts src/app/run.ts src/app/App.tsx $S/bak/
python3 $M src/persistence/save.ts "if (restart) store?.removeItem(saveKey(id))" "void restart"   # S1 예시
npx vitest run src
cp $S/bak/save.ts src/persistence/save.ts && cmp src/persistence/save.ts $S/bak/save.ts
npx vite preview --port 4175 --strictPort &           # 끝나면 이 PID만 종료
node $S/h2.mjs http://localhost:4175/ ; node $S/m.mjs ; node $S/fast2.mjs http://localhost:4175/
git status --short                                    # 이 기록 파일만
```
