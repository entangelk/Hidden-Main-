# 독립 검증 — P01 IDE 셸 2·3단계 (Explorer·탭·Terminal·Status Bar, Monaco 편집기)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P01 2·3단계 독립 검증") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `9195d18`(2단계: Explorer 트리·탭·Terminal·Status Bar), `57df983`(3단계: Monaco 편집기). 범위 `git diff e75342b..57df983` — `src/` 전체, `vite.config.ts`, `package.json`, `index.html`, `HANDOFF.md`, `docs/daily_logs/2026-10-22/work_log.md` §12–13, `docs/phases/P01_ide_shell.md` |
| 정본 기준 | `docs/SOT.md` v0.5(R-01, R-05), `docs/architecture/00_overview.md` v0.3(§1.1 의존 방향, §7 디렉터리), `docs/phases/P01_ide_shell.md`(범위·완료 기준), `docs/guides/verification.md`, `docs/guides/records-and-handoff.md` |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `57df983`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. P01 범위 항목·완료 기준 충족 여부(R-01, R-05 포함)
2. 빌드·린트·테스트 재실행, 빌드 결과물 실제 구동(Playwright, 미리보기 서버 + StrictMode 확인용 개발 서버)
3. 코드 리뷰: `fileTree.ts`(+테스트 품질), `Explorer.tsx`, `Tabs.tsx`, `CodeEditor.tsx`, `App.tsx`, `monaco.ts`, `vite.config.ts`. 의존 방향(아키텍처 §1.1), 단순성(CLAUDE.md §2)
4. 뮤테이션 테스트: `fileTree.test.ts`의 가드가 실제로 무는지
5. 기록: HANDOFF, 작업 로그 §12–13, P01 페이즈 문서

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short                      # 출력 없음
git log --oneline | head -8
git show --stat 9195d18 57df983
git diff e75342b 57df983 -- HANDOFF.md docs/phases/P01_ide_shell.md
cat -n src/ui/explorer/*.ts* src/ui/tabs/Tabs.tsx src/ui/editor/*.ts* src/app/*.ts* \
       src/ui/terminal/Terminal.tsx src/ui/statusbar/StatusBar.tsx vite.config.ts package.json index.html src/main.tsx
npm run build; npm run lint; echo $?; npm test
grep -oE "https?://[a-zA-Z0-9./_-]+" dist/assets/*.js dist/assets/*.css dist/index.html   # 번들 내 URL 문자열
grep -rn "from '" src/ui                                                                  # ui의 import 대상
# 구동 (스크립트는 저장소 밖 scratchpad)
npx vite preview --port 4174 --strictPort &      # 빌드 결과물
npx vite --port 4175 --strictPort &              # 개발 모드(StrictMode 이중 마운트 확인)
node smoke.mjs   # 미리보기 서버 시나리오 (아래 4.2)
node dev.mjs     # 개발 서버 시나리오
kill <vite PID들>                                 # 두 서버만 PID로 종료
# 뮤테이션 (검증자 분기: cp 백업 → 변형 → 실행 → 복원 → cmp)
cp src/ui/explorer/fileTree.ts <scratch>/fileTree.ts.bak
#   각 변형마다: node mut.mjs <file> <원문> <변형>  (원문이 정확히 1회 나올 때만 치환)
#   npx vitest run src/ui/explorer/fileTree.test.ts
#   cp <scratch>/fileTree.ts.bak src/ui/explorer/fileTree.ts && cmp ... (매번 바이트 동일 확인)
git status --short                      # 출력 없음 (기록 파일 작성 전)
```

Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs`(사전 설치 Chromium)를 썼다. 각 시나리오에서 `console`, `pageerror`, 요청 URL의 호스트를 수집했다.

## 4. 결과

### 4.1 명세 충족 (P01 범위·완료 기준)

| P01 항목 | 근거 | 관찰 |
| --- | --- | --- |
| Vite + React + TS, Vitest | `package.json:6-27`, `vite.config.ts:17-19` | 충족 |
| 디렉터리(`app/`, `ui/`, `ui/editor/`) | `ls -R src` | `src/app`, `src/ui/{editor,explorer,statusbar,tabs,terminal}`. `engine/` 등 없음(P02·P03 예정과 일치) |
| Python 문법 강조 | `monaco.ts:7`, `CodeEditor.tsx:59` | 토큰 클래스 `mtk1/5/8/9` 확인(문자열·키워드 색 구분, 스크린샷) |
| 줄 번호 | Monaco 기본 | `.line-numbers` 1..10 표시 |
| 함수 접기 | `monaco.ts:4`, `CodeEditor.tsx:29-30` | `event_001.py`에 접기 아이콘 2개(class·def), 클릭 시 보이는 줄 6→2, `codicon-folding-collapsed` 1개 |
| 다크 테마 | `CodeEditor.tsx:25`, `index.css` | 편집기 배경 `rgb(30,30,30)`, 패널 `#252526` 계열 |
| Explorer 트리(폴더 포함)·클릭 열기 | `Explorer.tsx`, `fileTree.ts` | 행 순서 `config/settings.py`, `incidents/event_001.py`, `main.py`(폴더 먼저). 클릭으로 탭 열림 |
| 탭 열기·전환·닫기, ● | `Tabs.tsx`, `App.tsx:45-55`, `App.css:95-108` | 아래 4.2 |
| Terminal 줄 추가 API | `Terminal.tsx`, `App.tsx:16,30` | `lines` prop + App의 `setTerminalLines` |
| Status Bar `Python`·`UTF-8`·현재 파일 | `StatusBar.tsx:6-10` | `incidents/event_001.py \| UTF-8 \| Python`, 탭이 없으면 파일 칸 비움 |
| `Ctrl/Cmd+Enter` → Terminal | `CodeEditor.tsx:33`, `App.tsx:29-43` | 편집기 안·밖 모두 `$ python <활성 파일>` 출력 |
| Monaco 로컬 번들, CDN 없음 | `monaco.ts:2-11`, `package.json:14` | 외부 요청 0건(미리보기·개발 서버 모두). 번들 안 URL 문자열은 라이선스·문서·오류 링크뿐이며 요청되지 않음 |
| R-01 게임 UI 없음 / R-05 | 전체 UI | 메뉴·팝업·점수·전환 효과 없음. 해금 연출은 아직 범위 밖 |
| 완료 기준: build 성공 | `npm run build` | 종료 0. 메인 청크 2,986.58 kB 경고(HANDOFF에 기록됨) |
| 완료 기준: 수동 확인 | 4.2 | 파일 2개 이상 열기·편집·탭 전환·접기·단축키 출력 모두 재현 |
| 완료 기준: `npm test` 0, 첫 테스트가 트리 변환 | `fileTree.test.ts` | 1 파일 4 테스트 통과, 종료 0 |

`npm run lint` 종료 코드 0, 출력 없음.

### 4.2 구동 확인 (Playwright)

미리보기 서버(프로덕션 빌드):

- `.monaco-editor` 정확히 1개. 콘솔 메시지 0건, `pageerror` 0건, 비 localhost 요청 0건.
- `main.py` 끝에 `# edit` 입력 → 탭 `is-dirty`. 편집기 안 `Ctrl+Enter` → 줄 수 6→6(줄 삽입 없음), Terminal `$ python main.py`.
- Explorer에서 `event_001.py` 클릭 → 탭 2개, 새 탭 활성, 내용에 `IncidentMonitor`, Status Bar 갱신.
- codicon: 접기 아이콘 `::before`의 `font-family: codicon`, `document.fonts`에 `codicon:loaded`, 스크린샷에서 `>`/`v` 모양(네모 아님).
- `main.py` 탭으로 복귀 후 `Z` 입력 → 마지막 줄 `# editZ` (편집 내용과 커서 위치 보존). 실행 취소 반복 → ● 해제, 원문 복귀.
- Terminal 클릭 후(편집기 밖) `Ctrl+Enter` → 두 번째 줄 출력.
- `incidents` 폴더 클릭 → 하위 `event_001.py` 숨김(`▸`), 다시 클릭 → 펼침.
- 탭 `[main, event(활성), settings]`에서 활성 가운데 탭 닫기 → 오른쪽 `settings` 활성. 마지막(오른쪽 끝) 활성 탭 닫기 → 왼쪽 `main` 활성. 비활성 탭 닫기 → 활성 유지.
- 마지막 탭 닫기 → 탭 0개, 편집기 줄 0, Status Bar 파일 칸 빈 값, 오류 없음. 이 상태에서 `Ctrl+Enter` → 출력 없음(`App.tsx:30`).
- 수정(●)된 탭을 닫고 다시 열면 편집 내용과 ●가 그대로 돌아온다(아래 H3).
- 탭 `tabIndex`는 -1(키보드로 도달 불가, 아래 H4).

개발 서버(StrictMode 이중 마운트): 초기 `.monaco-editor` 1개·`textarea` 1개, 입력 시 ●, 편집기 안 `Ctrl+Enter` 출력 1줄, 탭을 모두 닫고 다시 연 뒤에도 `.monaco-editor` 1개. "Cannot add model because it already exists" 같은 오류 없음 — 정리 함수(`CodeEditor.tsx:37-44`)가 모델을 dispose하므로 두 번째 마운트가 같은 URI로 모델을 다시 만들 수 있다. 콘솔은 Vite 연결 debug·React DevTools 안내 info뿐.

### 4.3 코드 리뷰

- `fileTree.ts`: 경로 분할 → 폴더 재사용(`:23-29`) → 재귀 정렬(`:33-37`). 작업량 O(P·D·W)(P=경로 수, D=깊이, W=한 단계 형제 수, `find` 선형 탐색) + 정렬 O(n log n). P01의 고정 3개 경로에서는 문제 없음. `sort`가 배열을 제자리 변경하지만 함수 내부에서 만든 배열이라 외부 영향 없음.
- `fileTree.test.ts`: 이름이 붙은 두 가드는 뮤테이션에서 실제로 물었다(4.4). 다만 두 번째 테스트의 순서 단언(`:22-26`, `main.py`가 `README.md`보다 앞)은 `localeCompare`의 로캘 정렬에 의존한다(H5). 파일·폴더 이름 충돌 입력은 어떤 테스트도 덮지 않는다(H6, M10 생존).
- `Explorer.tsx`: 접힘 상태를 경로 Set으로 보관, 렌더마다 트리 재계산(입력이 고정이라 무해). 행이 `div onClick`이라 키보드 접근 불가(H4).
- `Tabs.tsx`: 클릭 가능한 `div`(`:13-18`) 안에 `button`(`:20-30`). `div`에 role이 없어 HTML상 "대화형 요소 중첩"은 아니지만, 탭 자체가 포커스·키보드 선택 불가이고, 비활성 탭의 닫기 버튼은 `visibility: hidden`(`App.css:87`)이라 Tab 키로도 닿지 않는다(H4). `aria-label`은 있음.
- `CodeEditor.tsx`:
  - 편집기는 마운트당 1회 생성(`:23-45`), 콜백은 ref로 최신값 사용(`:18-21`) — 오래된 클로저 없음.
  - 수정 판정 클로저(`:60-62`)는 모델 생성 시점의 `original`과 `activeFile`을 잡는다. 모델이 경로당 하나이므로 정확하다. 실행 취소로 원문과 같아지면 `false` 전달 — 4.2에서 확인.
  - 뷰 상태 저장은 다음 파일로 바꾸기 직전(`:50`), 복원은 `setModel` 직후(`:67-68`). 닫힌 탭도 뷰 상태가 남아 다시 열면 커서가 복원된다.
  - 모델은 탭을 닫아도 dispose하지 않고 언마운트 때만 일괄 dispose(`:39`) — H3.
  - 효과 의존성 `[activeFile, files]`(`:70`): `files`가 바뀌어도 이미 만든 모델은 갱신되지 않는다. P01은 상수(`sampleFiles`)라 무해, P02에서 Engine `FileView`를 넘기면 문제(H2).
- `App.tsx`:
  - `close()`(`:50-55`): 닫힌 위치의 오른쪽 이웃, 없으면 왼쪽, 비면 `null`. 렌더 시점 `openFiles`를 쓰지만 한 번에 한 탭만 닫으므로 문제 없음.
  - window keydown(`:34-43`): 의존성 `[run]`으로 활성 파일이 바뀔 때마다 재등록, 정리 함수 있음. `.monaco-editor` 안이면 무시(`:37`). Monaco의 키 바인딩 서비스가 처리한 키는 이미 `stopPropagation`하므로(`node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js:240`) 이 검사는 중복 방어이며, Monaco DOM 클래스 지식이 `app/`에 새어 나와 있다(H1).
- `monaco.ts`: `editor.api` + core 명령·접기·괄호 짝·단어 이동 contrib + Python 등록 + codicon CSS + `?worker` 편집 워커. 워커는 `editorWorkerService`용 하나만이며 Python은 Monarch 토크나이저라 언어 워커가 필요 없다. 콘솔에 워커 경고 없음.
- `vite.config.ts`: `monaco-codicon.css` 별칭이 `node_modules/monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css`를 가리킨다. 패키지 `exports`(`"./*": "./esm/vs/*.js"`)가 `.js`만 매핑하므로 별칭이 필요하다는 주석은 사실. 빌드 산출물에 `codicon-*.ttf` 포함 확인.
- 의존 방향(아키텍처 §1.1): `src/ui`의 import 대상은 react, 같은 폴더, `monaco-editor`뿐. `app/` → `ui/` 단방향. `engine/` 아직 없음. Monaco 전용 처리(단축키 등록)는 `ui/editor/`에 있다. 예외는 H1.
- 단순성(CLAUDE.md §2): 요청되지 않은 기능·추상화 없음. `bracketMatching`·`wordOperations` contrib는 명세 밖이지만 기본 편집 감각용 소량 import로, 작업 로그 §13에 이유와 함께 기록됨.

### 4.4 뮤테이션 테스트 (`fileTree.ts` 변형 → `fileTree.test.ts` 실행)

검증자 분기 적용: `git status --short`가 비어 있었지만 검증자는 커밋하지 않으므로 `git checkout`을 쓰지 않고 `cp` 백업 → 변형 → 실행 → `cp` 복원 → `cmp` 바이트 동일 확인을 매 변형마다 수행했다. 모든 복원 후 `cmp` 일치, 마지막 `git status --short` 출력 없음, 전체 `npx vitest run` 4개 통과.

테스트 약칭: T1 = "groups nested paths under a single folder node (under-strict guard…)", T2 = "keeps root-level files beside folders, folders first (over-strict guard…)", T3 = "builds intermediate folders for deep paths", T4 = "returns an empty tree for no paths".

| # | 변형 (diff) | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M1 | `level.find(` → `[].find(` (폴더 재사용 제거, 중복 폴더 생성) | `fileTree.ts:23` | T1 |
| M2 | 파일 push에 `if (i > 0)` 추가 (루트 파일 누락) | `fileTree.ts:20` | T2 |
| M3 | `nodes.sort((a, b) =>` → `nodes.filter((a, b) => 1 \|\|` (정렬 제거) | `fileTree.ts:7` | T1, T2 |
| M4 | 하위 폴더 재귀 정렬 제거 | `fileTree.ts:34` | T1 |
| M5 | 폴더/파일 순서 반전 (`-1 : 1` → `1 : -1`) | `fileTree.ts:8` | T2 |
| M6 | `localeCompare` → 코드 포인트 비교 | `fileTree.ts:8` | T2 (H5 참고) |
| M7 | 파일 `path: nodePath` → `path: name` | `fileTree.ts:20` | T1, T3 |
| M8 | 폴더 `path: nodePath` → `path: name` | `fileTree.ts:27` | T3 |
| M9 | `level = folder.children` 제거 (하위로 내려가지 않음) | `fileTree.ts:30` | T1, T2, T3 |
| M10 | 폴더 탐색 조건에서 `n.kind === 'folder' &&` 제거 | `fileTree.ts:24` | **없음 (생존)** — 같은 이름의 파일·폴더 입력이 테스트에 없음(H6) |

결론: T1(과소 엄격)과 T2(과잉 엄격) 두 방향 가드는 각자 자기 조항(중복 폴더 / 루트 파일 누락·순서)을 문다. M10 생존은 P01 명세가 요구하지 않는 입력(파일·폴더 이름 충돌)이므로 비차단 보강 항목으로 분류한다.

### 4.5 기록

- `HANDOFF.md`: 24줄(`wc -l`), 헤더 표기와 일치. 1단계 문구("빈 화면", "테스트 파일 없음", `npm test` 실패 주의)를 삭제하고 현재 상태로 교체 — 삽입만 있는 diff가 아님. 완료 서술·커밋 해시·테스트 수 없음. Monaco import 방식·codicon 별칭·청크 경고 주의 사항은 코드와 일치(`monaco.ts`, `vite.config.ts:8-16`, 빌드 출력). "다음 작업 1. P01 3단계 독립 검증"(`HANDOFF.md:23`)은 실제 검증 범위(2·3단계)보다 좁게 적혀 있으나 행동에는 영향 없음.
- 작업 로그 §12(`work_log.md:101-105`): 파일 목록·닫기 규칙(오른쪽 이웃, 없으면 왼쪽)·테스트 4개는 코드·재실행과 일치. §13(`:107-117`): 직접 `monaco-editor` 사용 이유, import 목록, 워커 번들, ●/실행 취소, 편집기 안 줄 미삽입, 외부 요청 0건, codicon 문제와 별칭 해결 — 모두 재현됨. "보이는 줄 10→9"는 다른 파일에서 측정한 수치로 보이며 이번 재현(`event_001.py` 6→2)과 모순되지 않는다.
- `docs/phases/P01_ide_shell.md`: 2단계 커밋에서 "(수정 표시는 3단계에서)"를 붙였다가 3단계 커밋에서 제거 — 최종 문서는 원래 범위 문구와 동일. 상태 "In Progress"는 검증 전이므로 맞다. `00_index.md`도 In Progress.

## 5. 문제 / 위험

### 차단 (계약 의무)

없음. P01 범위 9개 항목과 완료 기준 3개가 모두 코드·구동으로 확인되었고, P01이 요구하는 유일한 회귀 테스트(트리 변환)의 두 방향 가드가 뮤테이션에서 물었다.

### 보강 권고 (비차단)

- **H1** `src/app/App.tsx:37` — `closest('.monaco-editor')`로 Monaco DOM 클래스를 `app/`에서 참조한다. 아키텍처 §1.1은 "Monaco 전용 처리(…단축키…)는 `ui/editor/` 안에만"이라 한다. Monaco가 처리한 키는 이미 전파가 막히므로(`standaloneServices.js:240`) 이 검사는 중복 방어다. 제거하거나 `ui/editor/`가 판별 함수를 내보내도록 옮기는 것을 권한다. 단축키 등록 자체는 `ui/editor/`에 있어 명세 위반으로 보지 않았다.
- **H2** `src/ui/editor/CodeEditor.tsx:56-65,70` — 모델이 경로별로 한 번만 만들어지고 `files` 변경을 반영하지 않는다. P02에서 Engine `FileView`(사건 함수 추가, 복원)를 넘기면 화면이 갱신되지 않는다. 아키텍처 §6.2 "모델 전체를 다시 쓰는 것은 Engine이 새 `FileView`를 낼 때"에 맞춰 P02에서 교체 경로를 만들 것.
- **H3** `src/app/App.tsx:50-55`, `src/ui/editor/CodeEditor.tsx:39` — 수정된 탭을 닫아도 모델·`dirtyFiles`가 남아 다시 열면 편집과 ●가 돌아온다(경고 없음). P01 명세는 이 경우를 말하지 않는다. 이후 `PlayerEdits` 저장 모델(편집은 탭과 무관하게 유지)과는 방향이 맞으므로, P02에서 의도된 동작으로 명시할 것을 권한다.
- **H4** `src/ui/tabs/Tabs.tsx:13-18`, `src/ui/explorer/Explorer.tsx:28,38`, `src/app/App.css:87` — 탭·Explorer 행이 role·`tabIndex`·키보드 처리 없는 `div`라 키보드로 열기·전환이 불가하고, 비활성 탭 닫기 버튼은 숨김이라 포커스도 안 된다. 접근성 보강 시 탭에 `role="tab"`을 주면 그 안의 `button`이 대화형 중첩이 되므로 닫기 버튼을 형제로 빼는 구조를 권한다.
- **H5** `src/ui/explorer/fileTree.ts:8`, `src/ui/explorer/fileTree.test.ts:22-26` — 이름 정렬이 `localeCompare`(런타임 기본 로캘, 여기서는 `en-US`)라 대소문자 무시 정렬이 된다. T2가 그 결과(`main.py` < `README.md`)를 고정하므로 로캘이 다른 환경에서 결과가 바뀔 수 있다(M6이 실패시킴). 정렬 규칙을 명시(`localeCompare(b, 'en')` 등)하거나 테스트 입력을 대소문자 차이가 없는 이름으로 바꿀 것.
- **H6** `src/ui/explorer/fileTree.ts:23-25`, `src/ui/explorer/Explorer.tsx:27,37` — 중복 경로나 `a`·`a/b`처럼 파일과 폴더 이름이 겹치는 입력은 같은 `key`(`node.path`)를 가진 형제 노드를 만들고, 이를 덮는 테스트가 없다(M10 생존). 지금 입력은 고정이라 무해. 시나리오 파일 목록이 들어오는 P02~P04에서 시나리오 검증 테스트로 막을 것.
- **H7** `src/app/App.tsx:30` — 명세는 "고정 문구"이나 출력이 활성 파일에 따라 달라지고, 열린 탭이 없으면 아무것도 출력하지 않는다. 연결 확인 목적은 충족하며 P02에서 교체될 코드다.

## 6. 판정

**합격**

- P01 범위·완료 기준 전부를 빌드, 린트, 테스트, 프로덕션 빌드 구동, 개발 모드(StrictMode) 구동으로 직접 확인했다. 콘솔 오류·경고 0건, 외부 요청 0건, `.monaco-editor` 1개.
- 첫 회귀 테스트의 과소·과잉 엄격 가드가 각각 뮤테이션 M1/M2(및 M3~M9)에서 물었다.
- 차단 항목 없음. H1~H7은 명세 밖 보강 항목이다.

## 7. 남은 항목

- P01을 Complete로 바꾸는 것(`docs/phases/00_index.md`, `P01_ide_shell.md` 상태)은 작업자 몫이다. 검증자는 기존 파일을 수정하지 않았다.
- 이 기록 파일은 커밋하지 않았다.
- `dist/`는 재빌드되었다(gitignore 대상).

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && git log --oneline -3          # HEAD 57df983
npm run build && npm run lint && npm test
npx vite preview --port 4174 --strictPort &          # Playwright로 4.2 시나리오 실행 후 PID로 종료
npx vite --port 4175 --strictPort &                  # StrictMode 확인 후 PID로 종료
cp src/ui/explorer/fileTree.ts /tmp/fileTree.ts.bak  # 4.4 표의 각 변형 적용 →
npx vitest run src/ui/explorer/fileTree.test.ts      #   실패 테스트 확인 →
cp /tmp/fileTree.ts.bak src/ui/explorer/fileTree.ts && cmp src/ui/explorer/fileTree.ts /tmp/fileTree.ts.bak
```
