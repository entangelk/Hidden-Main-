# 독립 재검증 — P04 시나리오 *Incident 02:14*

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유 재검증 요청) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | 커밋 `63307d7` (`git diff 2effc5e..63307d7`) — 시나리오 템플릿·`index.ts`(사건 13개, `version: 2`), `src/scenario/validate.ts`(+test), `src/ui/editor/CodeEditor.tsx`(새 동기화 모델), `src/app/App.tsx`, 문서, 작업 로그 §25 |
| 이전 기록 | `docs/verifications/2026-10-22/p04_scenario.md` (조건부 합격, 차단 B1~B3, 하드닝 H1~H7) |
| 정본 기준 | `docs/SOT.md` v0.5 §5.4·§6, `docs/phases/P04_incident_0214_scenario.md`, `docs/scenario/incident-0214.md` v2, `docs/architecture/00_overview.md` §5·§6.2 |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `63307d7`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. 이전 지적 B1~B3, H1~H7의 해소 여부와 이전에 살아남은 뮤테이션(V1~V6, V11~V14, D6~D9) 재적용
2. Editor 동기화 재설계(`CodeEditor.tsx`) — 모델과 "엔진 텍스트 + 편집 값"의 일치, `baseRef`, 공개 스크롤, StrictMode, 빠른 입력
3. 시나리오 일관성 — 주석이 약속한 내용 대 전이·로그·플래그(특히 장치 분기와 `submit_report`), 문서 표 대 `index.ts`, SoT §5.4
4. 검증기 새 검사의 정확성·거짓 양성/음성·성능
5. 실제 브라우저 — 두 엔딩 + 장치를 못 찾는 경로, 새로고침, 비활성 탭 안내, 콘솔 오류, 외부 요청
6. `npm run build` / `npm run lint` / `npm test`
7. 기록 정확성(작업 로그 §25, 시나리오 문서 v2, HANDOFF, P04 상태)

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat 2effc5e..63307d7
cat -n src/ui/editor/CodeEditor.tsx src/scenario/validate.ts src/scenario/validate.test.ts src/scenario/incident-0214/index.ts src/scenario/incident-0214/*.py
cat -n src/engine/slots.ts src/engine/render.ts src/engine/derive.ts src/engine/parser.ts src/app/run.ts src/app/App.tsx
npm run build; npm run lint; echo $?; npx vitest run
```

- 상태 수·시간·렌더 확인: 임시 테스트 파일 `src/scenario/zz_probe.test.ts`(실행 직후 삭제)에서 `validateScenario(incident0214)`와 특정 경로의 `derive` 결과를 스크래치패드 파일로 출력.
- 뮤테이션: 검증자는 커밋하지 않으므로 `git checkout`을 쓰지 않았다. 스크래치패드의 `mut.py`가 대상 파일을 `cp` 백업 → 정확히 1회 나오는 문자열 치환(assert) → `npx vitest run src/scenario/validate.test.ts` → 백업 복사로 원복 → `filecmp.cmp(shallow=False)`. 전 건 `True`, 마지막에 `git status --short` 출력 없음.
- 브라우저: `npm run build` 후 `npx vite preview --port 4174 --strictPort`(백그라운드), StrictMode 확인용 `npx vite --port 4175 --strictPort`. Playwright(`/opt/node22/lib/node_modules/playwright/index.mjs`, 설치된 Chromium, 1280×720) 스크립트는 저장소 밖 스크래치패드(`play.mjs`). 값 입력은 값 슬롯 클릭 → End → Backspace(리터럴 길이만큼) → `keyboard.type(delay 0)` → 곧바로 `Control+Enter`. 끝난 뒤 내가 띄운 서버 PID(npx 부모와 재부모화된 vite 자식)만 종료.

## 4. 발견 사항

### 4.1 이전 지적의 상태

| ID | 상태 | 근거 |
| --- | --- | --- |
| B1 | 해소 | `case_report.py:6` `draft_report`, `case_report.py:31` `submit_report`; `index.ts:34` `sceneIds: ['report', 'submit']`. 파일별 3+3+2+3+2 = 13개 (SoT §5.4 "2~3개", P04 "10~15개" 충족) |
| B2 | 해소 (새 모순 B4 있음) | 선택지가 `@if device_found` 가지별로 나뉨(`sublevel_access.py:53-66`), 전이도 `found` 조건으로 분리(`index.ts:149-154`). 못 찾은 경로에서 "전원을 뽑았다"·"사진 12장" 로그가 나오지 않음(브라우저 확인) |
| B3 | 해소 | 이전 B3의 7개 검사 모두 이제 전용 테스트가 문다: V1→`reports tab character`, V2→`triple quote`, V3→`function order`, V4→`unknown next scene`, V5→`ordering a non-number`, V11→`unreachable scene`, V12→`invalid default` (`validate.test.ts:47-66`) |
| H1 | 해소 (일부 미고정) | 선택지 설명 검사를 상태별 렌더 화면에서 함(`validate.ts:47-73, 109`). D6·D8 이제 `validate.test.ts:14` 실패. 단 문자열 옵션 검사(`validate.ts:68`, V6)와 수치 범위 검사(`validate.ts:70`, N2)는 지워도 테스트가 통과(H-R2) |
| H2 | 해소 | 죽은 콘텐츠 검사(`validate.ts:186-197`), 안 쓰이는 전이(`validate.ts:207-213`). D7·D9 이제 `validate.test.ts:14` 실패. 읽히지 않던 플래그 4개가 주석에 연결됨(`case_report.py:17,32`, `sublevel_access.py:24,50`) |
| H3 | 부분 | 수치 후보에 경계 ±1 추가(`validate.ts:25`). 이를 고정하는 테스트는 없다(V13·V13b 생존). 상태 수는 7,678 → 11,518, 시간 5.4초 → 11.3초(4.4) |
| H4 | 해소 | 13개 사건 모두 바꿀 변수 이름을 주석에 적음(예: `security_audit.py:33`, `sublevel_access.py:55,62`, `case_report.py:21,35`). 문자열 사건은 "큰따옴표까지 그대로"(`security_audit.py:14`, `sublevel_access.py:36`, `case_report.py:35`). `hour`는 int 0~23(`index.ts:53`) |
| H5 | 해소 | `power_control.py:12` "창고, 공조기계실, 폐기 장비 보관실" |
| H6 | 부분 (이야기 의견) | sealed 엔딩 문구 변경(`index.ts:195`). 방 설명은 "동쪽 끝 보관실"(`sublevel_access.py:38`)인데 `power_control.py:12`가 B2의 보관실은 "폐기 장비 보관실"뿐이라고 알려 주므로 단서 없이도 짐작 가능 — 문서 `incident-0214.md:66` "방 설명만으로는 알 수 없게"와 어긋남(H-R4) |
| H7 | 해소 | `docs/phases/P03_story_engine_and_save.md:25`에 P04 변경 표시 |

### 4.2 Editor 동기화 재설계 (`CodeEditor.tsx`)

코드 읽기:

- 모델 재작성은 `baseRef`(경로별 마지막 엔진 텍스트)가 바뀐 파일만(`CodeEditor.tsx:112-120`). 키는 파일 경로, 정리 함수에서 `bases.clear()`(`:73`). 처음 만드는 모델은 생성 시 `baseRef` 기록(`:137`).
- 입력 중 `edits` 변경으로 효과가 다시 돌아도: 루프는 `continue`, `pathChanged` 거짓, `engineChanged`에 없음 → 슬롯·장식·공개 모두 손대지 않음(`:183-191`). 입력 중 재렌더가 모델이나 슬롯을 덮어쓰지 않는다.
- 엔진 변경 시 다른 장면의 미반영 편집: 슬롯은 현재 사건에만 있고(`render.ts:108`), 실행은 `editsRef`(동기 값)로 해당 사건 편집을 지운 뒤 같은 배치로 `progress`와 함께 커밋(`App.tsx:107-115`) → 재작성 시 쓰는 `edits`가 최신.
- 파일 전환: 슬롯 있는 파일은 현재 사건 파일 하나뿐이고, 다른 파일이 보이는 동안 그 파일에는 입력이 들어가지 않으므로 돌아올 때 `applyEdits(base, edits)`(`:184`)로 다시 계산해도 늦은 값이 아니다. 브라우저에서 `Tr` 입력 → `main.py` 탭 → 복귀 → `ue` 입력 → 실행: `keep_logs = Tr` 유지, `True` 수락.
- 엔진 변경 전에 한 번도 열지 않은 파일: 모델이 없어 루프 대상이 아니고, 처음 열 때 최신 텍스트로 생성. 문제 없음.
- StrictMode: 정리 함수가 모델·뷰 상태·공개·`baseRef`를 모두 비우고 `shownPathRef`를 `null`로 돌려 두 번째 마운트에서 처음부터 생성. 개발 서버(StrictMode)에서 세 경로 완주, 오류 0.
- 공개 스크롤: 엔진 변경·새 모델 때 `revealRef`에 넣고(`:119, :170`) 보일 때 `revealLineInCenterIfOutsideViewport`(`:189-191`). 스크립트가 매 단계 `.value-slot` 요소를 클릭하는데, Monaco는 화면 밖 줄을 그리지 않으므로 39단계(3경로×13) 모두 값 줄이 화면 안에 있었다는 뜻이다.
- **모델이 "엔진 텍스트 + 편집 값"과 어긋나는 경우 — 재현됨 (B5).** 한 스테이지의 마지막 사건(`escalate`·`preserve`·`limit`·`handle_device`·`submit_report`)을 기본값과 같은 값의 다른 표기로 풀면(`50.0`, ` 50`, `'archive'`, ` False` 등 — `readLiteral`이 trim하고 float·작은따옴표를 받음, `parser.ts:11-16`), 해결 후 엔진 텍스트는 `formatLiteral` 결과가 기본 리터럴과 같아 바뀌지 않는다. 그래서 `baseRef` 비교(`CodeEditor.tsx:114`)가 `continue`하고, 실행이 편집 값을 지웠는데도(`App.tsx:111-115`) 모델은 플레이어가 친 표기를 그대로 보인다. 브라우저: `set_limit`에 `50.0` 입력·실행 → `power_control.py`가 `limit = 50.0`, 새로고침 후 `limit = 50`. 값 자체는 같지만, 아키텍처 §5 "화면에 보이는 텍스트 = `applyEdits(render(…), 플레이어 편집)`"(`00_overview.md:94`)을 어긴다. 이전 구현(`2effc5e`)은 모델 텍스트를 `applyEdits` 결과와 비교했으므로 이 경우를 맞췄다 → 이번 재설계로 생긴 회귀다.
- 커밋과 효과 실행 사이(한 프레임 이내)에 기존 슬롯으로 들어온 키 입력이 방금 해결한 사건의 편집 값을 다시 만들 수 있다(`CodeEditor.tsx:163-167` → `App.tsx:94-97`). 재현하지 못했고 화면·진행에 영향은 없다(현재 사건 슬롯만 쓰임). 기록만 남긴다.

브라우저 빠른 입력(프로덕션 빌드):

- `audit_logins`에서 `"backup-'quoted'-and-a-very-long-value-0123456789-abcdefghijklmnopqrstuvwxyz"`(80자)를 지연 0으로 입력하고 곧바로 `Control+Enter`를 15회 반복: 값 줄과 Terminal 오류 줄의 입력 표시가 15회 모두 입력 문자열과 정확히 같음(잃은 글자 0).
- 이어서 `"backup"` 빠른 입력 + 즉시 실행 → `[auth] backup: 02:13 …` 수락. 세 경로에서 `"security"`·`"archive"`·`"facility"`도 같은 방식으로 수락(이전에 보고된 `"securit"` 문제 재현 안 됨).
- 해결 직후 활성 파일에서 `Ctrl+Z` 5회 → 파일 내용 변화 없음.

### 4.3 시나리오 일관성

- 전이표(`incident-0214.md:30-42`) 13행을 `index.ts:37-186`과 한 줄씩 대조: 필드·범위·옵션, 플래그, 다음 사건, 엔딩 조건 일치. 주석 변형표(`:46-57`) 10행도 템플릿 지시문과 일치. 엔딩표 일치(`index.ts:175-184, 188-197`).
- `submit_report`: 주석의 세 수신처(`case_report.py:36-38`)와 옵션(`index.ts:173`) 일치. resolved 조건 `truthful` 그리고 `!= "archive"`(`index.ts:176-179`)는 문서와 같다. `truthful`은 장치를 찾았고 사실대로 쓴 경우만 설정(`index.ts:164`).
- 장치 분기: 찾은 경우와 못 찾은 경우의 선택지·로그가 서로 맞는다(`sublevel_access.py:53-66` 대 `index.ts:149-154`).
- **새 모순 (B4)**: `# @if locked == True` 블록(`sublevel_access.py:50-52`)이 `device_found` 조건 밖에 있다. 장치를 못 찾고 `review_access`에서 1을 고르면 빈 방 화면에 "작업 상태: 인증 실패 — backup 계정이 잠겨 있다." 다음 줄에 "방에는 먼지 쌓인 상자뿐이다"가 나온다(`derive` 출력과 브라우저 화면 모두 확인). 또 `locked`는 `review_access`의 1이면 감사 대상과 무관하게 설정되므로(`index.ts:86`), `"admin"`을 감사해 `@else` 가지("감사한 계정에서는 특이점이 없었다", `security_audit.py:30`)를 본 플레이어에게도 "backup 계정이 잠겨 있다"가 나온다. 이전 B2와 같은 종류(상태와 모순되는 화면 내용)다.
- SoT §5.4: 5개 파일·초기 파일·파일당 2~3개·10~15개 모두 충족.

### 4.4 검증기 (`validate.ts`)

- 전이 사용 검출(`validate.ts:114-115`): `state.flags`는 지금까지의 선택을 재생한 뒤의 플래그, 즉 현재 사건을 풀 때의 플래그이며, 엔진도 같은 플래그로 `transitions.find(holds…)`를 한다(`derive.ts:53`). 첫 일치 인덱스를 쓰는 것도 엔진과 같다. 상태 키(`:103`)가 사건+플래그이므로 중복 건너뛰기로 잃는 전이도 없다. N6(플래그를 `{}`로) 뮤테이션은 두 통과 테스트를 깨뜨린다.
- 렌더 화면 선택지 검사(`:47-73`): D6·D8을 잡는다. 남은 거짓 양성 가능성: 한 사건에 int 필드가 둘이면 같은 번호 목록과 비교(`:58`), 이야기 줄의 `1.` 같은 번호도 선택지로 셈. 거짓 음성: 따옴표 친 옵션이 단서 줄에만 있어도 통과(그 단서가 보이는 경로에서), 불리언 필드는 검사 없음. 현재 데이터에는 해당 없음.
- 죽은 콘텐츠(`:186-197`): 플래그 이름 단위다. 어떤 사건보다 **뒤에서만** 설정되는 플래그를 그 사건의 `@if`가 읽는 경우(가지가 절대 참이 안 됨), 설정되지 않는 값과 비교하는 `@if`(예: `== 2`)는 잡지 못한다(H-R3).
- 수치 후보 ±1(`:25`): `!=`만으로 된 가지도 탐색된다(D13: `limit != 50`으로 바꿔도 통과 — 정상). ±1을 지워도 테스트가 통과한다(V13·V13b, H-R2).
- 성능: 상태 11,518개, `validateScenario(incident0214)` 11.3초(측정), 전체 `npm test` 11.6초 중 대부분. 상태마다 `derive`가 처음부터 재생하므로 O(상태 수 × 경로 길이). 그래프가 앞으로만 가고 플래그가 유한해 유계지만, 이제 모든 플래그가 읽혀 상태 키에서 뺄 것이 없고 플래그 하나 추가마다 크게 늘 수 있다. 테스트 제한 60초(`validate.test.ts:19`) 대비 여유는 약 5배.

### 4.5 실제 브라우저

| 경로 | 입력(13회) | 결과 |
| --- | --- | --- |
| resolved | 1, 2, True, `"backup"`, 1, True, 1, 20, 1, `"B2-07"`, 1, 1, `"security"` | "사건 INC-0214 종결 (원인 규명)" |
| sealed | 3, 5, False, `"guest"`, 2, False, 3, 80, 2, `"B2-11"`, 3, 2, `"archive"` | "사건 INC-0214 종결 (원인 미상)" |
| 장치 못 찾음 | 1, 2, True, `"admin"`, 1, True, 2, `50.0`, 1, `"B2-03"`, 2, 1, `"facility"` | "옆방들도 비어 있다…", "원인 미확인, 확인한 사실만 기재", sealed. 장치 로그 없음. `handle_device` 화면에 B4 문구 |

- 각 경로 시작 시 `main.py` 활성에서 `Control+Enter` → `실행할 파일: incidents/event_001.py (현재 탭: main.py)`.
- 새로고침: `set_limit`에 `33` 입력(실행 전) 후 새로고침 → 값·로그 복원.
- 프로덕션(4174)과 개발 서버 StrictMode(4175) 모두 콘솔 error/warning 0건, `pageerror` 0건, 자기 호스트 밖 요청 0건.

### 4.6 빌드·린트·테스트

- `npm run build`: 성공(3.92s). 기존 500kB 청크 경고만.
- `npm run lint`: 종료 코드 0.
- `npx vitest run`: 테스트 파일 12개, 테스트 110개 모두 통과(11.64s).

### 4.7 기록

- 작업 로그 §25: 테스트 110개, 사건 13개, B1~B3·H1~H7 처리 서술은 대체로 재현됨. "검사 8종을 직접 지워 각각 실패 확인"은 사실(V1~V5·V11·V12·N1~N5 확인).
- 시나리오 문서 v2: 표는 데이터와 일치. 다만 `incident-0214.md:80` "검사마다 그 검사를 지우면 실패하는 테스트가 하나씩 있다"는 사실이 아니다 — V6(`validate.ts:68`), N2(`:70`), V14(`:136`), V12b(`:154`)는 지워도 테스트가 통과한다(V12b·V14는 다른 검사가 2차로 잡는 구조라 계약 공백은 아님). `:66`도 H-R4.
- HANDOFF: 34줄, P04 "진행 중 — 독립 검증 대기", 사건 13개 반영. AC-10·R-07은 Owner 몫으로 남김(`HANDOFF.md:33`) — 달성 주장 없음.
- P04 문서·인덱스: In Progress. 일치.

## 5. 문제 / 위험

### 차단 (계약 의무)

- **B4 — 상태와 모순되는 `handle_device` 주석.** `sublevel_access.py:50-52`의 `@if locked` 블록이 장치 발견 조건 밖에 있어, 장치를 못 찾은 빈 방에서도 "작업 상태: 인증 실패 — backup 계정이 잠겨 있다."가 나온다. 또 `locked`(`index.ts:86`)는 backup을 의심하지 않은 경로(`security_audit.py:30`)에서도 설정된다. 이전 B2와 같은 종류의 내용 결함. 블록을 `device_found` 가지 안으로 옮기고, `locked`를 `backup_suspect`일 때만 설정하거나 문구를 계정 이름 없이 바꾸면 된다.
- **B5 — Editor 모델이 아키텍처 §5의 화면 텍스트 정의와 어긋남(이번 재설계의 회귀).** 스테이지 마지막 사건을 기본값과 같은 값의 다른 표기(`50.0`, ` False`, `'archive'` 등)로 풀면 엔진 텍스트가 바뀌지 않아 `CodeEditor.tsx:114`가 재작성을 건너뛰고, 지워진 편집 값의 표기가 화면에 남는다. 새로고침하면 `50`으로 바뀐다(브라우저 재현). 값은 같아 진행에는 영향이 없지만 `00_overview.md:94`의 정의를 어긴다. 예: 엔진 텍스트 변경 대신 `files` 객체가 바뀔 때마다 모델 텍스트를 `applyEdits(base, edits).text`와 비교하되, 현재 사건 슬롯이 없는 파일만 그렇게 하면 빠른 입력 보호를 유지할 수 있다. 회귀 테스트(또는 브라우저 확인)도 함께.

### 하드닝 권고 (비차단)

- **H-R1** (이야기 의견) `review_access`의 `@else` 가지(의심 계정 없음)에서도 선택지가 "의심 계정을 잠근다"(`security_audit.py:34`) — 무엇을 잠그는지 모호하다. B4와 함께 보면 좋다.
- **H-R2** 지워도 테스트가 통과하는 검사·탐색: 문자열 옵션 설명(`validate.ts:68`, V6), 수치 범위 설명(`:70`, N2), 함수 누락(`:136`, V14 — 렌더 오류가 2차 방어), 리터럴 슬롯 없음(`:154`, V12b — `:156`이 2차 방어), 수치 후보 ±1(`:25`, V13·V13b). 각각 `it.each`에 한 줄씩 추가 권장.
- **H-R3** 죽은 `@if` 가지 검출 보강: 그 사건 도달 시점에 한 번도 참(또는 거짓)이 되지 않는 지시문을 탐색 중에 기록(`validate.ts:186-197`은 이름 단위만 봄).
- **H-R4** (이야기·기록) `incident-0214.md:66` "방 설명만으로는 알 수 없게"와 달리 `power_control.py:12`("폐기 장비 보관실")와 `sublevel_access.py:38`("동쪽 끝 보관실")로 B2-07을 짐작할 수 있다. 문구나 문서 중 하나를 맞출 것.
- **H-R5** (기록) `incident-0214.md:80`의 "검사마다 … 테스트가 하나씩 있다"를 H-R2 반영 후 사실이 되게 하거나 문구를 고칠 것.
- **H-R6** 탐색 시간이 11.3초로 두 배가 됐다. 시나리오를 늘리기 전에 상태 수 상한을 테스트로 기록하거나 경로별 `derive` 재생을 증분 방식으로 바꾸는 것을 검토.

## 6. 뮤테이션 요약

| ID | 변경 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| V1 | 탭 검사 삭제 | `validate.ts:132` | `reports tab character` |
| V2 | 삼중 따옴표 검사 삭제 | `:133` | `reports triple quote` |
| V3 | 함수 순서 검사 삭제 | `:137` | `reports function order` |
| V4 | 다음 사건 존재 검사 삭제 | `:160` | `reports unknown next scene` |
| V4e | 엔딩 존재 검사 삭제 | `:161` | `reports unknown ending` |
| V5 | `>=`/`<=` 비숫자 검사 삭제 | `:163` | `reports ordering a non-number` |
| V6 | 문자열 옵션 설명 검사 삭제 | `:68` | 없음 (생존, H-R2) |
| V11 | 사건 도달 검사 삭제 | `:205` | `reports unreachable scene` |
| V12 | 기본값 유효 검사 삭제 | `:156` | `reports invalid default` |
| V12b | 리터럴 슬롯 없음 검사 삭제 | `:154` | 없음 (생존, `:156`이 2차 방어) |
| V13 | 수치 후보에서 경계값 전부 제거 | `:25` | 없음 (생존) |
| V13b | ±1 제거(경계값만) | `:25` | 없음 (생존) |
| V14 | 함수 누락 검사 삭제 | `:136` | 없음 (생존, 렌더 오류가 2차 방어) |
| N1 | 알 수 없는 필드 조건 검사 삭제 | `:166` | `reports condition on unknown field` |
| N2 | 수치 범위 설명 검사 삭제 | `:70` | 없음 (생존) |
| N3 | 설정 안 되는 플래그 `@if` 검사 삭제 | `:194` | `reports @if on a flag nothing sets` |
| N4 | 읽히지 않는 플래그 검사 삭제 | `:197` | `reports flag never read` |
| N5 | 안 쓰이는 전이 검사 삭제 | `:210` | `reports transition never taken` |
| N6 | 전이 검출에 플래그 `{}` 사용 | `:114` | `passes the mini scenario…`, `passes Incident 02:14…` |
| N7 | 선택지 검사를 원본 템플릿으로 되돌림 | `:109` | `checks option explanations on the rendered screen…`, `passes Incident 02:14…` |
| N8 | 정수 `최소~최대` 허용을 항상 참으로 | `:62` | `checks option explanations…`, `reports broken data…` |
| D6 | `"B2-07"` 선택지 줄 삭제 | `sublevel_access.py:38` | `passes Incident 02:14…` (이전 생존 → 이제 잡힘) |
| D7 | 지시문 플래그 오타 `analysed` | `event_001.py:26` | `passes Incident 02:14…` (이제 잡힘) |
| D8 | 선택지 목록을 `@if` 가지 안으로 이동 | `security_audit.py:30-35` | `passes Incident 02:14…` (이제 잡힘) |
| D9 | 죽은 전이 `'Backup'` | `index.ts:76` | `passes Incident 02:14…` (이제 잡힘) |
| D13 | `limit <= 30` → `limit != 50` | `index.ts:118` | 없음 — 정상(±1 후보로 두 가지 모두 탐색) |

모든 원복은 `filecmp` 바이트 비교 `True`, 최종 `git status --short` 출력 없음.

## 7. 판정

**조건부 합격** — B4(`handle_device`의 `@if locked` 문구가 장치 미발견·backup 미의심 상태와 모순) 및 B5(스테이지 마지막 사건을 기본값의 다른 표기로 풀면 Editor 모델이 아키텍처 §5 화면 정의와 어긋나는 회귀) 해소 필요

- 이전 차단 B1~B3은 모두 해소됐다. 이전에 살아남은 뮤테이션 중 B3·H1·H2 관련(V1~V5, V11, V12, D6~D9)은 이제 모두 테스트가 실패한다.
- 빠른 입력 문제(글자 손실)는 해결됐다. 80자 따옴표 문자열 15회 입력 + 즉시 실행에서 손실 0. 다만 재설계가 엔진 텍스트 비교만으로 동기화를 판단해 B5가 생겼다.
- 두 엔딩과 장치 미발견 경로를 실제 브라우저(프로덕션·StrictMode)에서 완주했고, 콘솔 오류와 외부 요청은 0건이다.
- P04를 사람 플레이 테스트 항목 말고 완료로 표시할 수 있는가: **아니오**. B4·B5 해소 후 가능하다.

## 8. 남은 일 (결함 아님)

- B4·B5 반영 후 재검증(B5는 브라우저 또는 컴포넌트 수준 회귀 확인 포함).
- Owner 플레이 테스트: AC-10(첫 플레이 10~20분), R-07(비개발자 관찰) — 여전히 미완이며 이 검증으로 대신할 수 없다.
- 검증자는 커밋하지 않았다. 이 기록 파일만 새로 생겼다.

## 9. 재현

```bash
cd /home/user/Hidden-Main-
npm run build && npm run lint && npx vitest run
npx vitest run src/scenario/validate.test.ts --reporter=verbose
# 뮤테이션: 대상 줄을 지우거나 바꾼 뒤 위 명령, cp 백업으로 원복 후 cmp
npx vite preview --port 4174 --strictPort &   # 끝나면 이 PID와 그 vite 자식만 종료
# Playwright(저장소 밖): localStorage 초기화 → event_001.py 탭 → 값 슬롯 클릭·End·Backspace·keyboard.type(delay 0) → 즉시 Control+Enter, 13회
# B5 재현: power_control.py의 set_limit에 50.0 입력·실행 → limit = 50.0 표시, 새로고침 → limit = 50
# B4 재현: 1, 2, True, "admin", 1, True, 2, 50, 1, "B2-03" 후 handle_device 주석 확인
```
