# 재검증 — P01 IDE 셸 (보강 H1~H7 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P01 재검증, Complete 가능 여부 판단") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `dd6841f` "Harden P01 IDE shell after independent verification". 범위 `git diff 57df983..dd6841f` — `src/app/App.tsx`, `src/app/App.css`, `src/ui/editor/CodeEditor.tsx`, `src/ui/explorer/Explorer.tsx`, `src/ui/explorer/fileTree.ts`, `src/ui/explorer/fileTree.test.ts`, `src/ui/tabs/Tabs.tsx`, `docs/phases/P01_ide_shell.md`, `docs/phases/P02_core_loop_prototype.md`, `HANDOFF.md`, `docs/daily_logs/2026-10-22/work_log.md` §14. 아울러 P01 전체의 완료 기준 충족 여부 |
| 정본 기준 | `docs/phases/P01_ide_shell.md`(범위·완료 기준), `docs/architecture/00_overview.md` v0.3(§1.1 의존 방향, §5 계층, §6.2 편집 반영 규칙), `docs/SOT.md` v0.5(R-01, R-05), `docs/guides/verification.md`, `CLAUDE.md` §2 |
| 이전 기록 | `docs/verifications/2026-10-22/p01_ide_shell.md` (판정 합격, 보강 H1~H7) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `dd6841f`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. H1~H7 각각의 처리 상태(코드 근거 file:line, 실제 브라우저 확인)
2. H2 새 `files` 효과의 정확성(재설정 후 ● 표시, 비활성 파일 모델, 효과 순서, StrictMode)과 CLAUDE.md §2(추측성 코드) 해당 여부
3. H4 키보드 접근성과 ARIA 역할 구조
4. H5·H6 테스트가 실제로 동작을 고정하는지(뮤테이션)
5. 빌드·린트·테스트 재실행, 빌드 결과물 구동 회귀 확인
6. 기록 정합성(HANDOFF, 작업 로그 §14, P01·P02 문서)

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short                                   # 출력 없음
git diff --stat 57df983..dd6841f; git diff 57df983..dd6841f -- src HANDOFF.md docs/daily_logs docs/phases
cat -n src/app/App.tsx src/ui/editor/CodeEditor.tsx src/ui/tabs/Tabs.tsx src/ui/explorer/*.ts* src/app/App.css
sed -n 230,245p node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js   # 키 처리 후 stopPropagation
sed -n 303,348p node_modules/monaco-editor/esm/vs/editor/common/model/textModel.js                # setValue → 실행 취소 기록 삭제
npm run build; npm run lint; echo $?; npm test
# 구동 (스크립트는 저장소 밖 scratchpad/rv/)
npx vite preview --port 4174 --strictPort &          # 빌드 결과물 → node smoke.mjs
npx vite --port 4175 --strictPort &                  # 개발 모드(StrictMode) → node dev.mjs
npx vite --config <scratch>/h2/vite.config.mjs --port 4176 --strictPort &
#   ↑ 저장소 밖 하네스: 저장소의 CodeEditor.tsx를 그대로 import하고 files·activeFile을 바꿀 수 있게 감싼 페이지(StrictMode) → node h2run.mjs
kill <세 vite 노드 PID> <npm exec PID>               # 내 서버만 PID로 종료
# 뮤테이션 (검증자 분기: cp 백업 → 변형 → 실행 → 복원 → cmp, git checkout 미사용)
cp src/ui/explorer/fileTree.ts <scratch>/fileTree.ts.bak
#   각 변형: node mut.mjs <file> <원문> <변형>  (원문이 정확히 1회일 때만 치환)
#            npx vitest run src/ui/explorer/fileTree.test.ts
#            cp <scratch>/fileTree.ts.bak src/ui/explorer/fileTree.ts && cmp ...
git status --short                                   # 출력 없음 (기록 파일 작성 전)
```

Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs`(사전 설치 Chromium). 각 시나리오에서 `console`, `pageerror`, 비 localhost 요청을 수집했고, ARIA 구조는 CDP `Accessibility.getFullAXTree`로 읽었다.

## 4. 결과

### 4.1 빌드·린트·테스트

- `npm run build`: 종료 0. 메인 청크 2,987.33 kB 경고(기존, HANDOFF `:18`에 기록됨).
- `npm run lint`: 종료 0, 출력 없음.
- `npm test`: 1 파일 7 테스트 통과(작업 로그 `:127`의 "7개"와 일치).

### 4.2 H1~H7 상태

| 항목 | 상태 | 근거 | 관찰 |
| --- | --- | --- | --- |
| H1 Monaco DOM 검사가 `app/`에 있음 | 해결 | `src/app/App.tsx:35-43` (`closest('.monaco-editor')` 삭제), `CodeEditor.tsx:35` `addCommand`, `standaloneServices.js:237-240` | 편집기 안 `Ctrl+Enter` → Terminal 1줄, 편집기 줄 수 10→10(줄 삽입 없음). Terminal 클릭 후 `Ctrl+Enter` → 1줄 추가. 중복 출력 없음. 개발 모드(StrictMode)에서도 편집기 안 1줄 |
| H2 `files` 변경이 모델에 반영 안 됨 | 처리됨, 단 새 보강 항목 R1 | `CodeEditor.tsx:17,62-63,66,81-88` | 하네스로 확인(4.3). 재설정·● 해제·비활성 모델은 의도대로 동작. 그러나 P02 계약과 맞지 않는 부작용이 있다(R1, R2) |
| H3 닫은 탭의 편집 유지 | 기록으로 이관 | `docs/phases/P02_core_loop_prototype.md:24` | P02 범위에 정리 항목으로 명시. 동작 변화 없음(의도대로) |
| H4 키보드 접근 불가 | 해결(ARIA 구조 보강 여지 R3) | `Explorer.tsx:11-16,35-49,54-65,73`, `Tabs.tsx:11,17-26`, `App.css:40-45,98` | 4.4 |
| H5 정렬 로캘 미고정 | 코드 해결, 테스트는 로캘을 고정하지 못함(R4) | `fileTree.ts:5-15`, `fileTree.test.ts:38-42` | 4.5 N4·N5 생존 |
| H6 파일·폴더 동명 경로 | 해결 | `fileTree.ts:19,24-30`, `fileTree.test.ts:44-53` | 4.5 N1·N2·N3 모두 검출 |
| H7 명세와 출력 불일치 | 해결 | `App.tsx:29-31`, `docs/phases/P01_ide_shell.md:23` | 탭을 모두 닫고 `Ctrl+Enter` → `$ python` 출력 |

### 4.3 H2 — `files` 효과 상세 (`src/ui/editor/CodeEditor.tsx`)

코드 읽기:

- 원본 기록은 모델 생성 시(`:62-63`) `originalsRef`에 넣고, ● 판정은 클로저의 고정값 대신 `originalsRef`의 현재값과 비교한다(`:64-69`). 재설정 효과(`:81-88`)는 `originalsRef`를 먼저 갱신하고(`:85`) `setValue`(`:86`)를 부르므로, `setValue`가 내는 변경 이벤트에서 ●가 `false`로 계산된다 — 순서가 맞다.
- 효과 순서: 활성 파일 효과(`:51-77`)가 먼저 선언되어 먼저 실행된다. 활성 파일과 `files`가 동시에 바뀌어 새 모델을 만드는 경우 새 내용으로 생성·원본 기록되므로 재설정 효과는 건너뛴다(`:84`). 정리 함수는 `originals`도 비운다(`:45`) — StrictMode 이중 마운트 후 두 번째 마운트가 같은 경로를 새로 만든다.
- 열지 않은 파일은 모델이 없으므로 아무것도 하지 않고, 열 때 최신 `files` 내용으로 만든다. `files`에서 사라진 경로는 건너뛴다(`:84`, 모델은 남음).
- P01에서 `files`는 모듈 상수 `sampleFiles`(`App.tsx:68`)라 이 효과는 마운트 때 한 번 돌고 항상 건너뛴다. 즉 P01 화면에서는 도달 불가 코드이며, 이를 덮는 테스트도 없다.

하네스 실행(저장소 밖, StrictMode, 저장소의 `CodeEditor.tsx` 그대로 사용):

| 시나리오 | 관찰 |
| --- | --- |
| A. 활성 `a.py` 편집(●) 후 `files['a.py']` 변경 | 모델 = 새 내용, `onDirtyChange('a.py', false)` 1회, 커서 1:1로 이동, 실행 취소해도 새 내용 유지(기록 삭제) |
| C. 비활성 `b.py` 편집 후 `files['b.py']` 변경 | `b.py` 모델 재설정, `onDirtyChange('b.py', false)`, 활성 모델 영향 없음 |
| B. 모델이 **이미 같은 텍스트**를 갖고 있을 때 `files`에 그 텍스트 전달(P02에서 편집 수락 후 Engine `applyEdits` 결과가 돌아오는 경우) | 그래도 `setValue` 실행: 커서 1:8 → 1:1, 실행 취소 기록 삭제(실행 취소가 아무것도 되돌리지 않음), ● 해제 |
| D. 다른 버튼에 포커스를 둔 채 `files` 변경 | 포커스가 편집기로 이동(`:76` `editor.focus()`가 `[activeFile, files]` 의존 효과 안에 있음) |
| 콘솔 | 오류·경고 0건 |

판단: P01 계약 범위의 동작은 깨지지 않는다(P01에서 도달 불가). 그러나 (1) P01 기능에 쓰이지 않고 테스트도 없는 P02 대비 코드라 CLAUDE.md §2 "Nothing speculative"에 걸리고, (2) 아키텍처 §6.2(`00_overview.md:125`)는 "수락하면 Monaco 모델은 … 다시 쓰지 않는다(커서·실행 취소 기록 유지)", §5(`:94`)는 화면 텍스트 = `applyEdits(render(…), 편집)`로 정한다. 이 효과에 화면 텍스트를 넘기면 시나리오 B처럼 편집 한 번마다 커서·실행 취소가 초기화되고, `FileView`(편집 전)를 넘기면 주석(`:79-80`)대로 플레이어 편집이 지워진다. 어느 쪽으로 연결해도 P02 계약과 맞지 않으므로 P02에서 다시 설계해야 한다. 이전 기록 H2는 "P02에서 교체 경로를 만들 것"이었다. → R1, R2.

### 4.4 H4 — 키보드·ARIA (빌드 결과물)

- Tab 순서: `config` → `settings.py` → `incidents` → `event_001.py` → `main.py`(Explorer 행) → `main.py` 탭 → 닫기 버튼 → 편집기. 각 행·탭·닫기 버튼에 `outline: solid rgb(0,127,212)`(`App.css:40-45`).
- `event_001.py` 행에서 Enter → 탭 열림·활성. `incidents` 행에서 Space → 접힘(`aria-expanded="false"`, `▸`), Enter → 펼침. `settings.py` 행에서 Space → 열림.
- 비활성 탭에 포커스 → 닫기 버튼 `visibility: visible`(`App.css:98` `:focus-within`). 탭에서 Enter → 선택. 탭에서 Tab → 그 탭의 닫기 버튼, Enter → 그 탭만 닫힘(탭 선택 없음, `Tabs.tsx:22`의 `e.target === e.currentTarget` 가드가 동작).
- 닫기 버튼에 포커스한 채 `Ctrl+Enter` → 탭이 닫히지 않고 Terminal 1줄(window 리스너의 `preventDefault`가 버튼 기본 동작을 막음).
- Explorer 행에 포커스한 채 `Ctrl+Enter` → 파일이 열리고 **동시에** 실행 줄이 출력됨(`$ python incidents/event_001.py`). `activateOnKey`(`Explorer.tsx:11-16`)와 탭 핸들러(`Tabs.tsx:21-26`)가 수정 키를 거르지 않기 때문이다(R5).
- ARIA(CDP 접근성 트리): `tree "Files"` 아래 `treeitem "▾ config"`, `group`, `treeitem "▾ incidents"`, `group`, `treeitem "main.py"`가 **형제**로 나온다. 하위 `group`이 폴더 `treeitem`의 자식이 아니라 `li`(무시됨) 수준에서 형제가 되어(`Explorer.tsx:35-49`), 펼침 상태와 하위 항목의 소유 관계가 접근성 트리에 표현되지 않는다. 폴더 이름에 화살표 글자(`▾`)가 포함된다. `tablist > tab > button "Close main.py"`로 탭 안에 대화형 버튼이 중첩된다(`Tabs.tsx:11-40`) — `role="tab"`의 자식은 표현용(presentational)으로 취급되는 역할이라 axe `nested-interactive` 규칙 위반에 해당한다. 이전 기록 H4가 "닫기 버튼을 형제로 빼는 구조"를 권했으나 반영되지 않았다(R3).
- P01 명세는 접근성을 요구하지 않으므로 위 사항은 모두 비차단이다.

### 4.5 뮤테이션 테스트 (`fileTree.ts` → `fileTree.test.ts`)

검증자 분기: 시작 시 `git status --short` 비어 있음 확인, `git checkout` 미사용. 매 변형 후 `cp` 복원 → `cmp` 바이트 동일(10회 모두 "restored OK"), 마지막 `cmp` 일치 및 `git status --short` 출력 없음.

테스트 약칭: T2 = "keeps root-level files beside folders…", T5 = "sorts names case-insensitively with a fixed locale…", T6 = "collapses an exact duplicate path into one node", T7 = "rejects a path that is both a file and a folder, in either order".

| # | 변형 (diff) | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| N1 | `for (const path of new Set(paths))` → `for (const path of paths)` (중복 제거 삭제) | `fileTree.ts:19` | T6 |
| N2 | 마지막 조각의 `if (existing) throw …` → `if (false) …` (폴더 뒤 같은 이름 파일 허용) | `fileTree.ts:26` | T7 |
| N3 | 중간 조각의 `if (existing?.kind === 'file') throw …` → `if (false) …` | `fileTree.ts:30` | T7 (메시지 단언 `'both a file and a folder: a'`이 TypeError를 거름) |
| N4 | `localeCompare(b.name, 'en', { sensitivity: 'base' })` → `localeCompare(b.name)` (로캘·민감도 고정 되돌림) | `fileTree.ts:13` | **없음 (생존)** |
| N5 | `{ sensitivity: 'base' }` 제거 | `fileTree.ts:13` | **없음 (생존)** |
| N6 | `localeCompare` → 코드 단위 비교 | `fileTree.ts:13` | T2, T5 |
| N7 | `if (existing)` → `if (existing && existing.kind === 'folder')` | `fileTree.ts:26` | 없음 — 동등 변형(같은 경로 파일 중복은 N1의 Set이 먼저 제거하므로 관찰 불가) |
| N8 | 이름 비교를 대소문자 무시로 (`Main.py`·`main.py`를 같은 노드로 취급) | `fileTree.ts:24` | **없음 (생존)** — 대소문자만 다른 형제 입력이 테스트에 없음 |
| N9 | `'en'` → `'lt'` | `fileTree.ts:13` | **없음 (생존)** |
| N10 | `caseFirst: 'upper'` 추가 | `fileTree.ts:13` | 없음 — `sensitivity: 'base'`에서는 무효(동등) |

해석:

- H6의 세 방어(중복 합치기, 양 방향 충돌 예외)는 각자 T6·T7에서 문다. T7은 두 순서를 모두 단언해 N2·N3을 각각 잡는다.
- H5: T5는 "대소문자 무시" 방향(N6)만 고정한다. 테스트 이름이 말하는 "고정된 로캘(기계와 무관)"은 고정하지 못한다(N4·N9 생존). 실제로 로캘은 결과를 바꾼다: `LC_ALL=lt_LT.UTF-8 node`에서 기본 `localeCompare`는 `['i','y','j']`, `'en'`은 `['i','j','y']`. 테스트 입력 `B.py, c.py, a.py`는 `en-US`·`lt` 어느 쪽에서도 같은 순서라 구분이 안 된다. 같은 프로세스 안에서는 기본 로캘을 바꿀 수 없으므로, 고정하려면 로캘에 민감한 입력(`i.py, j.py, y.py`)을 넣고 다른 `LANG`으로도 실행하거나, 비교 함수를 export해 `'en'` 인자를 직접 검사해야 한다(R4).
- `sensitivity: 'base'`는 `a.py`·`A.py`를 같다고 보므로(비교값 0) 순서가 입력 순서를 따른다: `['a.py','A.py']` → 그대로, `['A.py','a.py']` → 그대로. 주석(`fileTree.ts:5-6`)은 "순서가 기계에 의존하지 않는다"이며 그 자체는 맞지만, 입력 순서에는 의존한다(R4).

### 4.6 회귀 확인 (빌드 결과물, 이전 기록 4.2 항목)

- `.monaco-editor` 1개(시작·종료 시), 콘솔 메시지 0건, `pageerror` 0건, 비 localhost 요청 0건.
- 입력 시 탭 `is-dirty`, 실행 취소 반복 시 해제.
- `event_001.py` 접기 아이콘 2개, 클릭 시 보이는 줄 6→2.
- 탭 열기·전환·닫기(활성 탭 닫기 반복으로 0개까지), 탭 0개에서 `Ctrl+Enter` → `$ python`, 다시 열기 후 편집기 1개.
- 개발 모드(StrictMode): `.monaco-editor` 1개, ●/해제, 편집기 안 `Ctrl+Enter` 1줄, 파일 열기 후 편집기 1개, 콘솔은 React DevTools 안내 info뿐.

### 4.7 P01 완료 기준 재확인

| 기준 | 근거 | 결과 |
| --- | --- | --- |
| 범위 9개 항목 | 이전 기록 4.1 + 이번 4.2·4.6 | 충족. H7로 바뀐 `Ctrl/Cmd+Enter` 문구(`P01_ide_shell.md:23`)와 출력(`App.tsx:30`) 일치 |
| `npm run build` 성공 | 4.1 | 충족 |
| 수동 확인: 파일 2개 이상 열기·편집·탭 전환·접기, 단축키 출력 | 4.4·4.6 | 충족 |
| `npm test` 종료 0, 첫 테스트가 트리 변환 | 4.1, `fileTree.test.ts:5` | 충족 |
| R-01(게임 UI 없음)·R-05 | 화면 | 메뉴·팝업·점수 없음 |
| 의존 방향(아키텍처 §1.1) | `grep` 결과 App에 Monaco 지식 없음(`App.tsx:33-43`) | 충족 (H1 해소로 이전 예외도 사라짐) |

### 4.8 기록

- `HANDOFF.md`: 24줄(`wc -l`), 헤더 `:3`과 일치. 완료 서술·커밋 해시 없음. `:23` "P01 2·3단계 재검증 → 통과하면 P01 Complete"는 현재 상태와 맞다. 다만 `:10` "`$ python <활성 파일>`만 출력"은 H7 이후 "탭이 없으면 `$ python`"이 빠져 있다(사소, R6).
- 작업 로그 §14(`work_log.md:119-129`): H1(편집기 안·밖 1회), H2(`originalsRef`, 재설정), H3(P02 이관), H4(키보드 열기·접기·탭 선택), H6(양 순서 테스트, 7개), H7 — 모두 코드와 재실행으로 확인됨. H5 문구 "로캘을 `'en'`·대소문자 무시로 고정, 테스트 추가(코드 단위 정렬이면 실패하는 입력)"도 사실이다(테스트는 코드 단위 정렬만 잡는다고 정확히 적었다). H2 문구 "P02에서 엔진이 파일 내용을 바꿀 때를 대비"는 사실이나, 4.3의 §6.2 충돌은 기록되지 않았다.
- `docs/phases/P01_ide_shell.md`: 상태 "In Progress"(`:3`), `00_index.md`도 In Progress — 재검증 전이므로 맞다.
- `docs/phases/P02_core_loop_prototype.md:24`: H3 이관 문구는 아키텍처 §5의 `PlayerEdits` 저장 모델과 모순되지 않는다.

## 5. 문제 / 위험

### 차단 (계약 의무)

없음. P01 범위·완료 기준을 모두 다시 확인했고, H1~H7 수정이 기존 동작을 깨뜨리지 않았다(4.6). P01이 요구하는 회귀 테스트(트리 변환)의 두 방향 가드는 이전 기록에서 확인되었고 이번 변경은 테스트를 더했을 뿐 빼지 않았다.

### 보강 권고 (비차단)

- **R1** `src/ui/editor/CodeEditor.tsx:79-88` — `files` 재설정 효과는 P01에서 도달 불가하고 테스트가 없는 P02 대비 코드다(CLAUDE.md §2). 게다가 아키텍처 §6.2(`docs/architecture/00_overview.md:125-126`, "수락한 편집은 모델을 다시 쓰지 않음 — 커서·실행 취소 유지")와 맞지 않는다: 같은 텍스트가 와도 무조건 `setValue`해 커서를 1:1로 옮기고 실행 취소 기록을 지운다(4.3 시나리오 B). 권고: 지금 이 효과와 `originalsRef`를 걷어내고 이전 기록 H2대로 P02에서 §6.2에 맞춰 설계하거나, 남긴다면 최소한 `model.getValue() !== next`일 때만 다시 쓰고 P02 첫 작업에서 하네스 수준 테스트를 붙일 것.
- **R2** `src/ui/editor/CodeEditor.tsx:51-77` — 활성 파일 효과의 의존성에 `files`가 있어 `files`만 바뀌어도 뷰 상태 저장·`setModel`·`editor.focus()`가 다시 실행된다. 다른 곳에 있던 포커스를 편집기로 가져간다(4.3 시나리오 D). P01에서는 `files`가 상수라 무해. P02에서 Terminal 등에 포커스가 있는 채 Engine이 새 내용을 내면 포커스를 빼앗는다.
- **R3** `src/ui/explorer/Explorer.tsx:35-49,73`, `src/ui/tabs/Tabs.tsx:11-40` — ARIA 구조: 하위 `group`이 폴더 `treeitem`의 형제라 소유 관계가 없음, 폴더 이름에 `▾`/`▸` 글자 포함(장식 `span`에 `aria-hidden` 없음), `role="tab"` 안에 `button` 중첩(axe `nested-interactive`). 행마다 `tabIndex=0`이라 WAI-ARIA tree/tablist의 화살표 키·roving tabindex 패턴과 다르다. 키보드 조작 자체는 동작한다. 권고: `li`에 `role="treeitem"`을 두고 그 안에 `group`, 장식 글자에 `aria-hidden`, 닫기 버튼을 탭 밖 형제로 이동. 또는 ARIA 역할을 빼고 단순 버튼 목록으로 두는 쪽이 더 단순하다.
- **R4** `src/ui/explorer/fileTree.ts:5-15`, `src/ui/explorer/fileTree.test.ts:38-42` — 테스트 T5는 이름과 달리 로캘 고정을 검출하지 못한다(N4·N5·N9 생존). 그리고 `sensitivity: 'base'` 때문에 대소문자만 다른 이름은 입력 순서대로 놓인다. 권고: 테스트 이름을 실제 고정 내용("대소문자 무시")에 맞추거나, 로캘 민감 입력을 넣고 다른 `LANG`에서도 실행. 대소문자 동률은 `sensitivity`를 빼면(기본 `variant`) 결정적이 된다.
- **R5** `src/ui/explorer/Explorer.tsx:11-16`, `src/ui/tabs/Tabs.tsx:21-26` — Enter 처리에 수정 키 검사가 없어 행·탭에 포커스한 채 `Ctrl+Enter`를 누르면 파일 열기·탭 선택과 실행이 함께 일어난다(4.4). P02에서 실행이 상태를 바꾸게 되면 의도치 않은 실행 대상 변경이 될 수 있다. `e.ctrlKey || e.metaKey || e.altKey`일 때 무시하면 된다.
- **R6** `HANDOFF.md:10` — "`$ python <활성 파일>`만 출력"에 탭이 없을 때 `$ python`이 빠져 있다. 동작 문구 한 군데 갱신.
- **R7** `src/ui/explorer/fileTree.ts:24` — 대소문자만 다른 형제(`Main.py`/`main.py`)가 별개 노드라는 점을 고정하는 테스트가 없다(N8 생존). 시나리오 파일 목록이 들어오는 P03~P04의 시나리오 검증 테스트에서 함께 다루면 된다.

## 6. 판정

**합격**

- P01 범위와 완료 기준 3개를 빌드·린트·테스트(7개)·빌드 결과물 구동·StrictMode 구동으로 다시 확인했다. 콘솔 오류 0건, 외부 요청 0건, `.monaco-editor` 1개.
- H1·H4·H6·H7 해결, H3은 P02 문서로 이관, H5는 코드상 해결(테스트 고정은 R4), H2는 처리되었으나 P02 계약과 어긋나는 추측성 코드라 R1·R2로 남긴다.
- H6 방어 3개는 뮤테이션 N1·N2·N3에서 각각 물었다. 차단 항목 없음. P01을 Complete로 바꿀 수 있다. R1은 P02 착수 전에 정리하기를 권한다.

## 7. 남은 항목

- P01 상태를 Complete로 바꾸는 것(`docs/phases/00_index.md`, `docs/phases/P01_ide_shell.md:3`, `HANDOFF.md:9,23`)은 작업자 몫이다. 검증자는 기존 파일을 수정하지 않았다.
- R1(유지·제거 결정)은 작업자 또는 Owner가 P02 착수 전에 정한다.
- 이 기록 파일은 커밋하지 않았다. `dist/`는 재빌드되었다(gitignore 대상).

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && git log --oneline -1          # HEAD dd6841f
npm run build && npm run lint && npm test           # 7 passed
npx vite preview --port 4174 --strictPort &          # smoke.mjs(4.4·4.6) 실행 후 PID로 종료
npx vite --port 4175 --strictPort &                  # dev.mjs(StrictMode) 실행 후 PID로 종료
# H2 하네스: 저장소 밖 디렉터리에 index.html + harness.tsx(저장소의 CodeEditor.tsx·monaco.ts를 절대 경로로 import,
#   window.setFiles/setActive 노출, StrictMode) + vite.config.mjs(root=하네스, react·react-dom·monaco-codicon.css 별칭을
#   저장소 node_modules로, server.fs.allow에 두 디렉터리) → npx vite --config <하네스>/vite.config.mjs --port 4176
cp src/ui/explorer/fileTree.ts /tmp/fileTree.ts.bak  # 4.5 표의 각 변형 적용 →
npx vitest run src/ui/explorer/fileTree.test.ts      #   실패 테스트 확인 →
cp /tmp/fileTree.ts.bak src/ui/explorer/fileTree.ts && cmp src/ui/explorer/fileTree.ts /tmp/fileTree.ts.bak
LC_ALL=lt_LT.UTF-8 node -e "console.log(['y','j','i'].sort((a,b)=>a.localeCompare(b)))"   # 로캘 영향 확인
```
