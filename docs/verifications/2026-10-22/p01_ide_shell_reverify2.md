# 2차 재검증 — P01 IDE 셸 (보강 R1~R7 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P01 2차 재검증, Complete 가능 여부 판단") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `0de4383` "Address P01 re-verification: drop speculative model reset, fix ARIA structure, pin sort ties". 범위 `git diff dd6841f..0de4383` — `src/ui/editor/CodeEditor.tsx`, `src/ui/explorer/Explorer.tsx`, `src/ui/explorer/fileTree.ts`, `src/ui/explorer/fileTree.test.ts`, `src/ui/tabs/Tabs.tsx`, `src/app/App.css`, `HANDOFF.md`, `docs/phases/P02_core_loop_prototype.md`, `docs/daily_logs/2026-10-22/work_log.md` §15. 이전 재검증 기록(`p01_ide_shell_reverify.md`)도 같은 커밋에 포함됨(`git log`상 별도 커밋 없음) |
| 정본 기준 | `docs/phases/P01_ide_shell.md`(범위·완료 기준), `docs/architecture/00_overview.md` v0.3(§1.1 의존 방향, §5, §6.2 편집 반영 규칙), `docs/guides/verification.md`, `CLAUDE.md` §2 |
| 이전 기록 | `docs/verifications/2026-10-22/p01_ide_shell.md`(합격, H1~H7), `docs/verifications/2026-10-22/p01_ide_shell_reverify.md`(합격, 보강 R1~R7) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `0de4383`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. R1~R7 각각의 처리 상태(file:line, 실제 브라우저 확인)
2. R3 ARIA 구조의 유효성, 키보드 도달·조작, 포커스 표시
3. R4·R7 테스트가 실제로 고정하는지(뮤테이션)
4. 회귀: 탭 클릭 영역, 닫기(마우스·키보드), ●/× 전환, 폴더 접기, 파일 열기, `.monaco-editor` 1개, 콘솔, 외부 요청
5. 빌드·린트·테스트, 빌드 결과물 구동, 개발 모드(StrictMode) 간단 확인
6. P01 완료 기준 전체 충족 여부

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short                                     # 출력 없음
git log --oneline -6; git diff --stat dd6841f..HEAD; git diff dd6841f..0de4383 -- src HANDOFF.md docs/phases docs/daily_logs
cat -n src/ui/editor/CodeEditor.tsx src/ui/tabs/Tabs.tsx src/ui/explorer/Explorer.tsx src/ui/explorer/fileTree.ts src/app/App.tsx src/app/App.css
grep -rn "focus()" src                                 # CodeEditor.tsx:70 한 곳
sed -n 84,130p docs/architecture/00_overview.md        # §5, §6.2
npm run build; npm run lint; echo $?; npm test
node -e "...localeCompare(b,'en'|'lt'|undefined,...)"  # 콜레이션 확인 (en: i,j,y / lt: y,i,j)
# 뮤테이션 (검증자 분기: cp 백업 → 변형 → 실행 → cp 복원 → cmp, git checkout 미사용)
cp src/ui/explorer/fileTree.ts <scratch>/rv2/fileTree.ts.bak
<scratch>/rv2/run.sh <ID> '<원문>' '<변형>' [환경변수]   # 원문이 정확히 1회일 때만 치환 → npx vitest run src/ui/explorer/fileTree.test.ts → 복원 → cmp
git status --short                                     # 출력 없음
# 구동
npx vite preview --port 4174 --strictPort &            # PID로 기록, 종료 시 해당 PID와 자식 PID만 kill
node <scratch>/rv2/smoke.mjs; node <scratch>/rv2/outline.mjs   # Playwright(/opt/node22/lib/node_modules/playwright/index.mjs)
node node_modules/.bin/vite --port 4175 --strictPort & # 개발 모드, node <scratch>/rv2/dev.mjs 후 PID로 종료
```

`<scratch>`는 저장소 밖 세션 scratchpad. smoke 스크립트는 `console`·`pageerror`·비 localhost 요청을 수집하고, ARIA 구조는 CDP `Accessibility.getFullAXTree`로, 탭 클릭 영역은 `document.elementFromPoint`로 측정했다.

## 4. 결과

### 4.1 빌드·린트·테스트

- `npm run build`: 종료 0. 메인 청크 2,987.25 kB 경고(기존, `HANDOFF.md:18`에 기록됨).
- `npm run lint`: 종료 0, 출력 없음.
- `npm test`: 1 파일 10 테스트 통과(작업 로그 `work_log.md:136`의 "10개"와 일치).

### 4.2 R1~R7 상태

| 항목 | 상태 | 근거 | 관찰 |
| --- | --- | --- | --- |
| R1 추측성 `files` 재설정 효과 | 해결 | `CodeEditor.tsx:47-71`(재설정 효과·`originalsRef` 삭제, ● 판정은 생성 시 원본 `original`과 비교 `:59-63`), `P02_core_loop_prototype.md:25` | 남은 코드에 모델 재작성(`setValue`) 없음. P02 문서 문구 "`applyEdits` 결과와 같으면 모델을 다시 쓰지 않는다(커서·실행 취소 유지)"는 아키텍처 §6.2 `00_overview.md:125`("수락하면 … 다시 쓰지 않는다")·`:126`("모델 전체를 다시 쓰는 것은 Engine이 새 `FileView`를 낼 때(… 사건 함수 추가 …)뿐")과 일치. 모순 없음 |
| R2 `files` 변경 시 포커스 탈취 | 해결 | `CodeEditor.tsx:50,70`; `grep -rn "focus()" src` → `:70` 한 곳뿐 | 포커스 이동은 표시 경로가 바뀔 때만. 브라우저: 활성 탭을 다시 클릭하면 포커스가 탭 버튼에 남음, Terminal 클릭 후 `Ctrl+Enter` → 포커스 body 유지, 파일 열기·탭 전환 시에는 편집기로 이동. `files` 단독 변경 경로는 P01에서 도달 불가(상수 `sampleFiles`, `App.tsx:68`)라 코드 읽기로만 확인: `pathChanged`가 거짓이면 `setModel`(같은 모델, no-op)·`restoreViewState`만 실행 |
| R3 ARIA 구조 | 해결(새 보강 S1·S2, 이어지는 S3) | `Explorer.tsx:37-53,57-73,81`, `Tabs.tsx:11-29`, `App.css:40-53` | 4.3 |
| R4 로캘·대소문자 동률 테스트 | 해결(한계 S4) | `fileTree.ts:14-15`, `fileTree.test.ts:38-56` | 4.4. `'lt'`·동률 제거·동률 반전·민감도 제거를 모두 검출. `'en'` 제거는 기본 로캘이 en-US인 환경에서는 생존(구조적 한계) |
| R5 수정 키 + Enter | 해결 | `Explorer.tsx:13`, `App.tsx:35-43`(window 리스너 `preventDefault` `:38`) | 폴더 항목 `Ctrl+Enter`: 접힘 상태 그대로, Terminal 1줄. 파일 항목(`settings.py`, 미열림) `Ctrl+Enter`·`Meta+Enter`: 탭 변화 없음, 각 1줄. 비활성 탭 버튼 `Ctrl+Enter`·`Meta+Enter`: 활성 파일 변화 없음(클릭 미발생), 각 1줄. 닫기 버튼 `Ctrl+Enter`: 닫히지 않음, 1줄 |
| R6 HANDOFF 문구 | 해결 | `HANDOFF.md:10,23` | 탭 없을 때 `$ python`(브라우저 확인과 일치), "모델은 처음 열 때 한 번 만들고 원본 변경을 따라가지 않음"은 `CodeEditor.tsx:57-66`과 일치. 24줄로 헤더 `:3`과 일치. "P01 진행 중"(`:9`)도 현재 상태와 맞음 |
| R7 대소문자만 다른 폴더 | 해결 | `fileTree.ts:26`, `fileTree.test.ts:53-56` | 뮤테이션 M5 검출 |

### 4.3 R3 — ARIA·키보드 (빌드 결과물)

접근성 트리(CDP):

```text
tree "Files"
  treeitem "config" level=1 expanded=true
    group
      treeitem "settings.py" level=2 selected=false
  treeitem "incidents" level=1 expanded=true
    group
      treeitem "event_001.py" level=2 selected=false
  treeitem "main.py" level=1 selected=true
tablist
  tab "main.py" selected=true
  button "Close main.py"
```

- Explorer: 하위 `group`이 폴더 `treeitem`의 자식이 되어 소유 관계·`level`이 올바르게 계산된다. 화살표 글자는 `aria-hidden`(`Explorer.tsx:47,71`)으로 이름에서 빠졌다. `treeitem`의 `aria-label`(`:42,62`)은 이름만 정하며, 하위 `group`·`treeitem`은 접근성 트리에 그대로 노출된다(`treeitem`은 자식 표현용 역할이 아님) — 숨김 문제 없음.
- 탭: `role="tab"` 안의 버튼 중첩(axe `nested-interactive`)은 사라졌다. 대신 `tablist`가 `tab`이 아닌 `button`을 직접 소유한다(`.tab` div는 역할 없는 generic이라 무시됨, `Tabs.tsx:13-17,26`). WAI-ARIA 1.2에서 `tablist`의 필수 소유 요소는 `tab`이며 다른 역할의 소유는 명세상 허용되지 않는다(S2, 비차단).
- Tab 순서: `config` → `settings.py` → `incidents` → `event_001.py` → `main.py`(트리 항목) → `main.py` 탭 버튼 → 닫기 버튼 → 편집기. 트리 항목마다 `tabIndex=0`이라 APG의 화살표 키·roving tabindex 패턴과는 다르다(이전 기록 R3의 일부, S3로 이어감).
- 포커스 표시: `incidents` 항목에 키보드 포커스(Tab 이동, `:focus-visible` 참) 시 계산값은 `li` 자체 outline `none`, 자기 행 `solid 1px rgb(0,127,212)`, 하위 `event_001.py` 행 `none`, 다른 행 `none`(`App.css:46-53`, 직계 자식 선택자 `>`). 즉 테두리는 행에만 그려지고 하위 트리 전체를 감싸지 않는다. 포커스가 없을 때는 모두 `none`. (첫 측정에서 하위 행 값을 `querySelector('ul .explorer-row')`로 읽어 폴더 자기 행이 잡혔던 스크립트 오류를 `li[aria-label="event_001.py"] > .explorer-row`로 고쳐 다시 측정한 값이다.)
- 키 조작: `incidents`에서 Space → 접힘(`aria-expanded=false`), Enter → 펼침. `event_001.py`에서 Enter → 탭 열림·활성·편집기 포커스. `settings.py`에서 Space → 열림. 탭 버튼 Enter → 선택, Space → 선택. 탭 버튼에서 Tab → 그 탭의 닫기 버튼(`visibility: visible`, `App.css:116`), Enter → 그 탭만 닫힘. 하위 항목에서 키를 눌러도 부모 폴더가 반응하지 않는 것은 `e.target !== e.currentTarget` 가드(`Explorer.tsx:13`)가 담당.

### 4.4 뮤테이션 테스트 (`fileTree.ts` → `fileTree.test.ts`)

검증자 분기: 시작 시 `git status --short` 비어 있음, `git checkout` 미사용. 매 변형 후 `cp` 복원 → `cmp` 바이트 동일(9회 모두 "restored OK"), 마지막에 `git status --short` 출력 없음.

테스트 약칭(`fileTree.test.ts`): T-en = `:43` "sorts with English collation…", T-tie = `:48` "orders names differing only in case…", T-dir = `:53` "keeps folders whose names differ only in case separate…".

| # | 변형 (diff) | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M1 | `localeCompare(b.name, 'en', …)` → `localeCompare(b.name, undefined, …)` (`'en'` 제거) | `fileTree.ts:14` | **없음 (생존)** — 기본 로캘 en-US 환경 |
| M1b | M1과 같음, `LC_ALL=lt_LT.UTF-8 LANG=lt_LT.UTF-8`로 실행 | `fileTree.ts:14` | T-en |
| M2 | `'en'` → `'lt'` | `fileTree.ts:14` | T-en |
| M3 | 동률 해소 `\|\| (a.name < b.name ? …)` 삭제 | `fileTree.ts:15` | T-tie |
| M4 | 동률 해소 반전(`< ? 1 : > ? -1`) | `fileTree.ts:15` | T-tie, T-dir |
| M5 | 폴더 조회를 대소문자 무시로(`n.name.toLowerCase() === name.toLowerCase()`) | `fileTree.ts:26` | T-tie(같은 이름 파일로 보아 예외), T-dir |
| M6 | `{ sensitivity: 'base' }` 제거 | `fileTree.ts:14` | T-tie, T-dir (기본 `variant`는 소문자 우선) |
| M7 | `sensitivity: 'base'` → `'accent'` | `fileTree.ts:14` | 없음 — ASCII 입력에서 동등 변형 |
| M8 | `caseFirst: 'upper'` 추가 | `fileTree.ts:14` | 없음 — `base`에서 무효(동등 변형) |

해석:

- 이전 기록의 생존 변형 N4(로캘·민감도 되돌림)·N5(민감도 제거)·N8(대소문자 무시 폴더)·N9(`'lt'`)는 이제 각각 M1b·M6·M5·M2로 검출된다. 동률 해소는 양방향(M3 삭제, M4 반전) 모두 문다.
- M1은 같은 프로세스에서 기본 로캘을 바꿀 수 없어 en-US 환경의 `npm test`로는 잡히지 않는다. 테스트 이름이 "English collation"을 말하므로, 고정력은 "다른 로캘을 명시한 변경"과 "비영어 환경에서의 실행"까지다(S4, 비차단).

### 4.5 회귀 확인 (빌드 결과물)

| 항목 | 관찰 |
| --- | --- |
| `.monaco-editor` 수 | 시작 1, 모든 탭 닫은 뒤 다시 열기 후 1 |
| 탭 라벨 영역 클릭(왼쪽 여백 3px, 글자 중앙, 위쪽 가장자리) | 모두 선택됨(`elementFromPoint` = `tab-label`) |
| 탭의 라벨-닫기 사이 간격, 닫기 버튼 오른쪽 여백 클릭 | **선택 안 됨**(`elementFromPoint` = `.tab`). `main.py` 탭 3,220px² 중 721px²(22.4%)가 라벨·닫기 어느 쪽도 아님. 그 영역에서도 커서는 `pointer`(`App.css:87`). `dd6841f`에서는 `.tab` 전체에 `onClick`이 있었다 → S1 |
| 닫기 | 키보드(Enter) → 그 탭만 닫힘·선택 변화 없음. 마우스(호버 후 클릭) → 닫힘 |
| ●/× 전환 | 입력 → `is-dirty`; 호버 없음: × `none`·● `inline`; 닫기 버튼 호버: × `inline`·● `none`. 실행 취소 → 해제 |
| 폴더 클릭 | 접힘 → 다시 클릭 펼침 |
| 파일 클릭 | 탭 열림·활성·편집기 포커스 |
| 편집기 안 `Ctrl+Enter` | Terminal 1줄, 줄 수 변화 없음 |
| 탭 0개 `Ctrl+Enter` | `$ python` |
| 콘솔 / `pageerror` / 외부 요청 | 0 / 0 / 0 |
| 개발 모드(StrictMode) | `.monaco-editor` 1, 시작 시 편집기 포커스, ●/해제, `Ctrl+Enter` 1줄, 파일 열기 후 편집기 1개. 콘솔은 Vite debug 2건과 React DevTools 안내 info뿐 |

참고 관찰: 편집기에 포커스가 있을 때 Tab 키는 탭 문자를 넣는다(Monaco 기본, `Ctrl+M`으로 전환). 키보드만으로 편집기를 빠져나가기 어렵다. P01 명세 밖이며 이번 변경과 무관(S5).

### 4.6 P01 완료 기준 재확인

| 기준 | 근거 | 결과 |
| --- | --- | --- |
| 범위 9개 항목 | `P01_ide_shell.md:15-23`; 이전 기록 + 4.5(Monaco·접기·다크 테마는 변경 없음, 이전 기록에서 확인) | 충족. 단축키 문구(`:23`)와 출력(`App.tsx:30`) 일치 |
| `npm run build` 성공 | 4.1 | 충족 |
| 수동 확인: 파일 2개 이상 열기·편집·탭 전환·접기, 단축키 출력 | 4.3·4.5 | 충족 |
| `npm test` 종료 0, 첫 테스트가 트리 변환 | 4.1, `fileTree.test.ts:5` | 충족 |
| R-01(게임 UI 없음) | 화면 | 메뉴·팝업·점수 없음 |
| 의존 방향(아키텍처 §1.1) | Monaco 처리는 `ui/editor/`에만(`CodeEditor.tsx:33`), `App.tsx`에 Monaco 지식 없음 | 충족 |

### 4.7 기록

- `HANDOFF.md`: 4.2 R6 참조. 정확함.
- 작업 로그 §15(`work_log.md:131-139`): R1·R2(제거, 포커스는 파일 변경 시만), R3(구조 변경), R4·R7(동률 해소, 테스트 3개 추가, 10개 통과), R5(Explorer `Ctrl/Cmd+Enter` 실행만), R6 — 코드와 재실행으로 모두 확인. R3 문구 "버튼 중첩 제거"는 사실이나, 그 결과 `tablist`가 `button`을 소유하게 된 점과 탭 클릭 영역 축소(S1)는 적혀 있지 않다.
- `docs/phases/P02_core_loop_prototype.md:25`: 4.2 R1 참조.

## 5. 문제 / 위험

### 차단 (계약 의무)

없음. P01 명세는 탭 클릭 영역·접근성 역할을 규정하지 않으며(`P01_ide_shell.md:15-29`), 범위·완료 기준은 모두 다시 충족을 확인했다.

### 보강 권고 (비차단)

- **S1** `src/ui/tabs/Tabs.tsx:13-25`, `src/app/App.css:79-89` — R3 수정으로 선택 `onClick`이 `.tab` 전체에서 라벨 버튼으로 옮겨져, 라벨-닫기 사이 6px 간격(`:82`)과 오른쪽 여백 6px(`:83`), 닫기 버튼 위아래가 클릭해도 선택되지 않는다(탭 면적의 22.4%). 커서는 여전히 `pointer`(`:87`). VS Code 탭은 전체가 클릭 대상이므로 사용자 기대와 다르다. 권고: `.tab`에 `onClick={() => onSelect(path)}`을 되돌리고 닫기 버튼에서 `stopPropagation`(마우스 전용 처리라 ARIA 구조는 그대로), 또는 간격·여백을 라벨 버튼 안으로 흡수.
- **S2** `src/ui/tabs/Tabs.tsx:11,26` — `tablist`가 `tab` 외에 `button "Close …"`를 직접 소유한다(WAI-ARIA 1.2 `tablist` 필수 소유 요소 = `tab`). 권고: 닫기 버튼을 `tabIndex={-1}`·`aria-hidden`으로 마우스 전용으로 두고 탭에서 `Delete` 키로 닫기, 또는 탭 역할을 빼고 단순 버튼 목록으로 둔다.
- **S3** `src/ui/explorer/Explorer.tsx:43,63`, `src/ui/tabs/Tabs.tsx:18-25` — 모든 트리 항목·탭이 Tab 순서에 들어가 APG의 화살표 키·roving tabindex 패턴과 다르다(이전 R3에서 이어짐). 파일이 늘면(P03~P04) Tab 이동 비용이 커진다.
- **S4** `src/ui/explorer/fileTree.test.ts:43-46` — `'en'` 인자 제거(M1)는 en-US 환경의 `npm test`에서 생존한다. 비영어 로캘(`LC_ALL=lt_LT.UTF-8`)로 한 번 더 도는 CI 단계가 생기면 잡힌다. 지금은 테스트 이름·주석이 이 한계를 밝히지 않는다.
- **S5** `src/ui/editor/CodeEditor.tsx:24-32` — Monaco 기본 Tab 포착으로 키보드만으로 편집기를 빠져나가기 어렵다. P01 범위 밖, 접근성을 다룰 때(P05 등) 함께 검토.

## 6. 판정

**합격**

- R1·R2·R5·R6·R7 해결, R3은 트리 구조가 올바르게 고쳐졌고 탭의 버튼 중첩도 제거되었다(새 비차단 S1·S2). R4는 `'lt'`·동률 양방향·민감도 변형을 모두 검출하며 `'en'` 제거만 환경 의존(S4).
- 빌드·린트·테스트(10개)·빌드 결과물 구동·StrictMode 구동 통과. 콘솔 오류 0건, 외부 요청 0건, `.monaco-editor` 1개.
- P01 범위와 완료 기준 3개를 모두 충족한다. **P01을 Complete로 바꿀 수 있다.** S1(탭 클릭 영역 축소)은 이번 변경이 만든 체감 회귀이므로 P02 착수 전에 되돌리기를 권한다.

## 7. 남은 항목

- P01 상태를 Complete로 바꾸는 것(`docs/phases/00_index.md:8`, `docs/phases/P01_ide_shell.md:3`, `HANDOFF.md:9,23`)은 작업자 몫이다. 검증자는 기존 파일을 수정하지 않았다.
- S1 처리 여부는 작업자 또는 Owner가 정한다.
- 이 기록 파일은 커밋하지 않았다. `dist/`는 재빌드되었다(gitignore 대상). 미리보기·개발 서버는 각 PID로 종료했다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && git log --oneline -1            # HEAD 0de4383
npm run build && npm run lint && npm test             # 10 passed
npx vite preview --port 4174 --strictPort &            # smoke.mjs(4.3·4.5) 실행 후 PID로 종료
node node_modules/.bin/vite --port 4175 --strictPort & # dev.mjs(StrictMode) 실행 후 PID로 종료
cp src/ui/explorer/fileTree.ts <scratch>/fileTree.ts.bak   # 4.4 표의 각 변형 적용 →
npx vitest run src/ui/explorer/fileTree.test.ts       #   실패 테스트 확인 (M1b는 LC_ALL=lt_LT.UTF-8 LANG=lt_LT.UTF-8 앞에 붙여 실행) →
cp <scratch>/fileTree.ts.bak src/ui/explorer/fileTree.ts && cmp src/ui/explorer/fileTree.ts <scratch>/fileTree.ts.bak
```
