# 4차 재검증 — P01 IDE 셸 (보강 H1~H5 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P01 4차 재검증") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `5b0782d` "Harden P01 explorer: pure tree navigation with tests, tab focus mode, ARIA group". 범위 `git diff eaa1695..5b0782d` — `src/ui/explorer/treeNav.ts`(신규), `src/ui/explorer/treeNav.test.ts`(신규), `src/ui/explorer/Explorer.tsx`, `src/ui/explorer/fileTree.test.ts`, `src/ui/tabs/Tabs.tsx`, `src/ui/editor/monaco.ts`, `HANDOFF.md`, `docs/daily_logs/2026-10-22/work_log.md` §16·§17 (3차 재검증 기록도 같은 커밋에 포함) |
| 정본 기준 | `docs/phases/P01_ide_shell.md`(범위·완료 기준), `docs/guides/verification.md`, `CLAUDE.md` §2·§3, 이전 기록 `p01_ide_shell_reverify3.md`(합격, 보강 H1~H5) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `5b0782d`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. H1~H5 처리 상태(file:line)
2. Explorer 리팩터(`treeNav`)의 동작 동등성 — roving tabindex, 화살표·Home/End·Enter/Space·`Ctrl+Enter`, 부모 계산(DOM → 경로 문자열) 동등성. 실제 브라우저
3. 편집기: `Ctrl+M` 후 Tab이 편집기를 벗어나는지, 일반 Tab은 들여쓰기인지
4. 뮤테이션: `treeNav.ts`(끝 고정, 부모 계산, ArrowRight/Left 분기, Tab 정지점 대체, 접힘 처리), `fileTree.ts`의 `'en'` 인자
5. 회귀: 빌드·린트·테스트, 콘솔, 외부 요청, `.monaco-editor` 1개
6. 기록: 작업 로그 §16 정정·§17, HANDOFF

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat eaa1695..5b0782d
git diff eaa1695..5b0782d -- src HANDOFF.md docs/daily_logs
cat -n src/ui/explorer/treeNav.ts src/ui/explorer/Explorer.tsx src/ui/explorer/fileTree.ts
set -o pipefail
npm run build; echo $?     # 0 (500kB 청크 경고만, HANDOFF.md:18에 기록된 기존 사항)
npx tsc -b; echo $?        # 0
npm run lint; echo $?      # 0
npm test                   # 2 files, 20 passed
grep -o "editor.action.toggleTabFocusMode" dist/assets/index-*.js   # 1건 (번들 포함 확인)
npx vite preview --port 4174 --strictPort &   # npm PID 11652, sh 11665, vite 11666 — 끝난 뒤 셋 다 PID로 kill
node <scratch>/v4/smoke.mjs     # 3차 smoke + 키 입력마다 tabindex=0 개수, 부모 동등성, role=group
node <scratch>/v4/tabfocus.mjs  # 편집기: 일반 Tab / Ctrl+M 후 Tab / Ctrl+M 두 번 후 Tab
python3 <scratch>/v4/mutate.py  # 뮤테이션 19건 (cp 백업 → 변형 → vitest → 백업 복원 → filecmp)
```

Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs`(사전 설치 Chromium). 스크립트는 저장소 밖 scratch 디렉터리(`/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/v4/`)에 있다. `smoke.mjs`는 3차 기록의 스크립트에 (a) 모든 키 입력 직후 `tabIndex===0` 항목 수 검사, (b) 각 `[role=treeitem]`의 DOM 상위 treeitem `data-path`와 경로 문자열로 계산한 부모가 같은지 검사, (c) `.tabs`의 `role`/`aria-label` 검사를 더한 것이다.

## 4. 결과

### 4.1 H1~H5 처리 상태

| 항목 | 상태 | 근거 |
| --- | --- | --- |
| H1 generic `div`의 `aria-label` | 해결 | `src/ui/tabs/Tabs.tsx:13` `role="group"`. 접근성 스냅샷 `group "Open editors"` 아래 `button "main.py"`, `button "Close main.py"`. `[role=tab],[role=tablist]` 0개 |
| H2 `Ctrl+M` 서술 오류 | 해결 | `src/ui/editor/monaco.ts:7-8` import 추가, 번들에 `editor.action.toggleTabFocusMode` 1건. 키 바인딩 출처 `node_modules/monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js:18-19`(Ctrl+M, mac Ctrl+Shift+M)와 주석(`monaco.ts:7`) 일치. 브라우저 실측은 4.3 |
| H3 `'en'` 고정 테스트 | 해결 | `src/ui/explorer/fileTree.test.ts:43-54` — `String.prototype.localeCompare` 스파이로 둘째 인자가 `'en'`인지 확인, `finally`에서 복원. 뮤테이션 M17·M18에서 검출(4.4) |
| H4 다음 작업 불일치 | 해결 | `HANDOFF.md:23-24` = `work_log.md:193-194` (1. P01 4차 보강분 재검증, 2. P02) |
| H5 순수 함수 분리 | 해결(잔여 N1) | `src/ui/explorer/treeNav.ts:4-14`(`visiblePaths`), `:18-24`(`tabStopPath`), `:36-65`(`treeKeyAction`), `Explorer.tsx:92-93,96-112`에서 사용. 테스트 `treeNav.test.ts:8-73` 10개. 단, 부모 계산은 한 단계 깊이만 고정됨(N1) |

### 4.2 Explorer 동작 동등성 (브라우저, 표본 트리 `config/settings.py`, `incidents/event_001.py`, `main.py`)

| 확인 | 관찰 |
| --- | --- |
| `tabIndex=0` 정확히 1개 | 키 입력 33회 각각의 직후 모두 1개. 그 밖에 초기, 마우스로 폴더 접기, 포커스 이동 없는 합성 click으로 기억 항목 숨김, 마우스로 파일 행 클릭, 탭 클릭으로 활성 파일 변경 후에도 1개 |
| 기억 항목이 숨겨질 때 | 합성 click으로 `config` 접음(포커스 이동 없음) → 정지점이 활성 파일 `main.py`로 대체(`treeNav.ts:23`의 focused → active → 첫 항목 순서). 마우스로 접으면 클릭한 `config`가 정지점 |
| Tab 진입 | 페이지에서 Tab → `main.py` |
| 위/아래/Home/End | 아래: `config→settings.py→incidents→event_001.py→main.py`, 끝에서 고정. 위: 역순, 처음에서 고정. Home/End 정상 |
| ArrowRight | 열린 폴더 → 첫 자식, 접힌 폴더 → 펼침(포커스 유지), 파일 → 변화 없음 |
| ArrowLeft | 자식 → 부모, 열린 폴더 → 접힘(포커스 유지), 접힌 최상위 폴더 → 변화 없음, 최상위 파일 → 변화 없음 |
| Enter/Space | 파일 열기(`config/settings.py`, `main.py`), 폴더 접기/펼치기 |
| `Ctrl+Enter` | 파일 항목: 실행 +1, 열기 없음. 폴더 항목: +1, 펼침 유지(`Explorer.tsx:97` 조기 반환) |
| 포커스 윤곽선 | 키보드 포커스 시 해당 행 1개, 마우스 클릭 후 0개 |
| 부모 동등성 | 모든 항목에서 DOM 상위 treeitem의 `data-path` = 경로 문자열 부모(`config/settings.py→config`, `incidents/event_001.py→incidents`, 최상위 3개는 둘 다 `null`) |

코드 리뷰:
- 부모 계산 동등성: 이전 구현은 `li.parentElement.closest('[role=treeitem]')`(DOM), 지금은 `parentOf`(`treeNav.ts:33`, 마지막 `/` 앞). `buildFileTree`가 폴더 경로를 `parts.slice(0, i + 1).join('/')`(`fileTree.ts:25`)로 만들고 자식은 그 폴더의 `children`에 들어가므로(`:33-38`), 어떤 깊이에서도 "마지막 `/` 앞" = 직속 부모 폴더 경로 = DOM 상위 `li`의 경로다. 동등하다. 차이는 빈 세그먼트 경로(`/a.py`, `a//b.py`)뿐인데 표본·시나리오 경로에는 없다.
- 이동 대상 찾기: `Explorer.tsx:109-111`은 `data-path`(`:121`)를 `CSS.escape`로 정확히 일치 검색한다. 경로는 트리에서 유일(`fileTree.ts:21` `new Set`)하므로 대상이 하나로 정해진다.
- `visible`은 렌더마다 다시 계산되고(`Explorer.tsx:92`) 키 핸들러가 그 렌더의 값을 쓴다. 렌더된 `li` 순서와 같은 순회(`treeNav.ts:6-11` ↔ `Explorer.tsx:138` `{open && ...}`)라 어긋나지 않는다(브라우저 순서 일치로 확인).
- 복잡도: 렌더마다 `visiblePaths` O(n) + `includes` O(n), 키마다 `indexOf` O(n) + `querySelector` O(n). P04 규모에서 문제 없음.

### 4.3 편집기 Tab (`tabfocus.mjs`, 매번 새 페이지, `main.py` 첫 줄 앞에 커서)

| 시나리오 | 결과 |
| --- | --- |
| 일반 Tab | 포커스 편집기 안 유지, 첫 줄 `"    from incidents import event_001"`(들여쓰기), 탭 ● |
| `Ctrl+M` → Tab | 포커스가 편집기 밖(`BODY`), 텍스트 변경 없음, ● 없음 |
| `Ctrl+M` 두 번 → Tab | 다시 들여쓰기(토글 동작 확인) |

편집기 뒤에 Tab으로 갈 요소가 없어 포커스가 `body`로 간다. "편집기를 벗어난다"는 작업 로그 §17 H2(`work_log.md:155`) 서술과 일치한다. macOS `Ctrl+Shift+M`은 이 환경(Linux)에서 실측하지 않았고 소스(`toggleTabFocusMode.js:19`)로만 확인했다.

### 4.4 뮤테이션 (검증자 방식: `cp` 백업 → 변형 → `npx vitest run --reporter=verbose src/ui/explorer/` → 백업 복원 → `filecmp.cmp(shallow=False)`; `git checkout` 미사용)

| ID | 변형 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M1 | 위쪽 끝 고정 제거 `Math.max(0, i)` | `treeNav.ts:40` | `treeNav.test.ts:40` up/down/home/end clamped |
| M2 | 아래쪽 끝 고정 제거 `Math.min(len-1, i)` | `treeNav.ts:40` | `:40` |
| **M3** | 부모 `lastIndexOf('/')` → `indexOf('/')` | `treeNav.ts:33` | **없음 (생존)** |
| **M4** | 부모 `path.split('/')[0]` (최상위 폴더) | `treeNav.ts:33` | **없음 (생존)** |
| M5 | ArrowRight `isFolder &&` 제거(파일도 펼침) | `treeNav.ts:55` | `:54` ArrowRight |
| M6 | ArrowRight 열린 폴더 `focusAt(index)` | `treeNav.ts:56` | `:54` |
| M7 | ArrowRight `item.open ?` 제거 | `treeNav.ts:56` | `:54` |
| M8 | ArrowLeft 접기 분기 삭제 | `treeNav.ts:58` | `:63` ArrowLeft |
| M9 | ArrowLeft 최상위에서 자기 자신으로 focus | `treeNav.ts:60` | `:63` |
| M10 | Tab 정지점 `visible.includes` 제거 | `treeNav.ts:23` | `:30` skips hidden |
| M11 | 우선순위 `[active, focused]` | `treeNav.ts:23` | `:24` prefers focused |
| M12 | 대체 `?? undefined` | `treeNav.ts:23` | `:24`, `:30` |
| M13 | 접힘 무시(`!collapsed.has` 제거) | `treeNav.ts:9` | `:13` hides children, `:30` |
| M14 | 접힌 폴더 자체도 숨김 | `treeNav.ts:8-9` | `:13`, `:30` |
| M15 | Enter 폴더 `open: item.open` | `treeNav.ts:45` | `:48` Enter/Space |
| M16 | ArrowUp → `index + 1` | `treeNav.ts:49` | `:40` |
| M17 | `'en'` → `undefined` | `fileTree.ts:14` | `fileTree.test.ts:45` pinned English locale |
| M18 | `'en'` → `'lt'` | `fileTree.ts:14` | `fileTree.test.ts:45`, `:56` English collation |
| M19 | `'en'` → `['en']` (동등한 표기) | `fileTree.ts:14` | `fileTree.test.ts:45` |

- 19건 모두 복원 후 바이트 동일(`filecmp` True), 마지막에 `git status --short` 출력 없음.
- M3·M4 생존: 테스트 트리(`treeNav.test.ts:5`)와 표본 데이터가 한 단계 깊이뿐이라 "마지막 `/`"와 "첫 `/`"가 구별되지 않는다. 현재 코드는 옳지만(4.2), 2단 이상 폴더에서 ArrowLeft가 직속 부모가 아닌 최상위로 가는 회귀를 아무 테스트도 잡지 못한다(N1). 3차 기록이 DOM 방식에 대해 "깊이와 무관하게 맞다(코드 리뷰만)"라고 했던 성질이 이번 리팩터로 테스트 가능해졌는데 고정되지 않았다.
- M19: 스파이 테스트는 의미가 같은 `['en']`도 실패시킨다. 형식까지 고정하는 다소 엄격한 테스트지만, 정렬 결과 테스트(`:56`)가 영어 기본 로캘에서 `'en'` 제거를 못 잡는 한계를 보완하려는 의도(`:43-44` 주석)와 맞으므로 결함으로 보지 않는다.

### 4.5 회귀

- `npm run build` 0, `npx tsc -b` 0, `npm run lint` 0, `npm test` 2 files / 20 passed(작업 로그 `work_log.md:158` "20개 통과"와 일치).
- 빌드 결과물: `.monaco-editor` 1개(시작·끝), 편집 후 `main.py` ●, `event_001.py` 접기 아이콘 2개·보이는 줄 6→2, 편집기 안 `Ctrl+Enter` +1, 편집기 밖 +1. 탭: 간격·오른쪽 끝 클릭 선택, 비활성 탭 닫기 비선택, 라벨 Enter/Space 선택, 라벨·닫기에서 `Ctrl+Enter`는 실행만, 닫기 Enter 닫힘.
- 콘솔 error/warning 0(`smoke.mjs`, `tabfocus.mjs` 모두), 외부 요청 0. `smoke.mjs` FAILS 0.

### 4.6 기록

- `work_log.md:147`(S4), `:148`(S5) 정정: 처음 서술이 틀렸다는 사실과 17번에서의 해결을 함께 적었다. 정직하며 3차 기록 H2·H3 지적과 일치한다.
- `work_log.md:154-158`(§17 H1~H5): 각 항목이 코드와 일치(4.1). H2의 "Ctrl+M 후 Tab으로 편집기 밖" 서술은 4.3 실측과 일치. H5의 "좌우 키 규칙 포함"은 사실이나 중첩 깊이 부모는 빠져 있다(N1).
- `work_log.md:146`(§16 S3)의 "기억한 항목이 접힌 폴더에 가려지면 첫 보이는 항목으로 대체"는 코드와 다르다. 실제 대체 순서는 활성 파일 → 첫 보이는 항목(`treeNav.ts:16-17,23`, 테스트 `treeNav.test.ts:24-28`, 브라우저에서 `main.py`로 대체). 이번 커밋이 §16을 정정하면서 이 줄은 그대로 두었다(N2).
- `HANDOFF.md`: 24줄(`:3` 표기와 일치), 완료 서사 없음, `:23-24` 다음 작업이 작업 로그 `:193-194`와 일치. `:9` "P01 완료, 다음은 P02"와 `:23` "P01 4차 보강분 재검증 (진행 중)"은 보강분 재검증이 진행 중이라는 뜻으로 모순 아님.

## 5. 이슈 / 위험

### 차단 (계약 의무)

없음. P01 범위·완료 기준은 이전 기록들에서 충족이 확인됐고, 이번 변경은 그 위의 접근성·테스트 보강이며 회귀가 없다.

### 보강 권고 (비차단)

- **N1** `src/ui/explorer/treeNav.test.ts:5-6,63-68` / `src/ui/explorer/treeNav.ts:33` — 부모 계산이 한 단계 깊이에서만 시험된다. `lastIndexOf`→`indexOf`(M3), 최상위 폴더 반환(M4)이 생존. 예: `buildFileTree(['a/b/c.py'])`에서 `treeKeyAction('ArrowLeft', file('a/b/c.py'), …)`가 `{ type: 'focus', path: 'a/b' }`인지 고정하는 경우 하나를 추가하면 둘 다 잡힌다.
- **N2** `docs/daily_logs/2026-10-22/work_log.md:146` — S3의 "첫 보이는 항목으로 대체" 서술이 코드(`treeNav.ts:23`: 기억 항목 → 활성 파일 → 첫 항목)와 다르다. 다음 기록 갱신 때 정정 권장.

## 6. 판정

**합격** (Pass)

- H1~H5 모두 해결을 코드와 실제 브라우저로 확인(H5는 잔여 N1).
- `treeNav` 리팩터 후 키보드 동작이 3차 기록과 동일: 키 입력 33회를 포함한 모든 관찰 상태에서 tab stop 1개, 화살표·Home/End·Enter/Space·`Ctrl+Enter` 일치, 경로 기반 부모 = DOM 부모(전 항목 실측 + 임의 깊이 코드 논증).
- `Ctrl+M` 후 Tab은 편집기를 벗어나고, 일반 Tab은 들여쓰기.
- 뮤테이션 19건 중 17건 검출. 생존 2건(M3·M4)은 현재 코드가 옳은 상태에서의 테스트 공백(N1)이며 P01 계약 밖.
- 빌드·타입·린트 0, 테스트 20개 통과, 콘솔·외부 요청 0, `.monaco-editor` 1개.

## 7. 남은 항목

- N1·N2 처리 여부는 작업자 또는 Owner가 정한다.
- 이 기록 파일은 커밋하지 않았다. 다른 저장소 파일은 수정하지 않았다(`dist/`는 재빌드, gitignore 대상). 미리보기 서버는 PID 11652(npm)·11665(sh)·11666(vite)으로 종료했다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && git log --oneline -1          # HEAD 5b0782d
npm run build && npx tsc -b && npm run lint && npm test   # 20 passed
npx vite preview --port 4174 --strictPort &          # PID 기록
node smoke.mjs        # FAILS 0, 키 입력마다 tabindex=0 1개, parentEq 전부 ok
node tabfocus.mjs     # plain: inEditor true·들여쓰기 / Ctrl+M: inEditor false·변경 없음
python3 mutate.py     # M3·M4만 exit 0, 나머지 exit 1, 모두 restored identical True
kill <npm PID> <sh PID> <vite PID>
```
