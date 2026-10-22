# 3차 재검증 — P01 IDE 셸 (보강 S1~S5 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P01 3차 재검증") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `eaa1695` "P01 complete: tab click area, plain-button tabs, roving tree keyboard navigation". 범위 `git diff 0de4383..eaa1695` — `src/ui/explorer/Explorer.tsx`, `src/ui/tabs/Tabs.tsx`, `HANDOFF.md`, `CHANGELOG.md`, `docs/daily_logs/2026-10-22/work_log.md` §16, `docs/phases/P01_ide_shell.md`, `docs/phases/00_index.md`(2차 재검증 기록도 같은 커밋에 포함) |
| 정본 기준 | `docs/phases/P01_ide_shell.md`(범위·완료 기준 :13-29), `docs/guides/verification.md`, `CLAUDE.md` §2·§3 |
| 이전 기록 | `p01_ide_shell.md`(합격), `p01_ide_shell_reverify.md`(합격), `p01_ide_shell_reverify2.md`(합격, 보강 S1~S5) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `eaa1695`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. S1~S5 처리 상태(file:line), S4·S5를 한계로 둔 근거(작업 로그 §16)의 정확성
2. Explorer 키보드 모델(roving tabindex, 화살표·Home/End·Enter/Space, `Ctrl/Cmd+Enter`, 포커스 표시) — 실제 브라우저 + 코드 리뷰
3. 탭: 클릭 영역, 닫기, 키보드 선택, `Ctrl+Enter`, ARIA
4. 회귀: 빌드·린트·`npm test`, 빌드 결과물(`.monaco-editor` 1개, ● 표시, 접기, 편집기 안팎 `Ctrl+Enter`, 콘솔, 외부 요청)
5. 기록: HANDOFF, CHANGELOG, P01 Complete 표기 일관성

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat 0de4383..eaa1695
git diff 0de4383..eaa1695 -- src HANDOFF.md CHANGELOG.md docs/daily_logs docs/phases
cat -n src/ui/explorer/Explorer.tsx src/ui/tabs/Tabs.tsx src/app/App.tsx src/ui/editor/monaco.ts
npm run build; echo $?      # 0 (500kB 청크 경고만, HANDOFF에 기록된 기존 사항)
npm run lint; echo $?       # 0
npm test                    # 1 file, 10 passed
npx vite preview --port 4174 --strictPort &   # npm PID 10417, 자식 vite PID 10467 — 끝난 뒤 둘 다 PID로 kill
node <scratch>/v3/smoke.mjs   # Playwright(/opt/node22/lib/node_modules/playwright/index.mjs), Chromium
node <scratch>/v3/s5.mjs      # S5: Monaco 안에서 Ctrl+M / Ctrl+Shift+M 후 Tab
grep -n KeyM node_modules/monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/*.js
```

`smoke.mjs`는 매 단계마다 `[role=treeitem]` 중 `tabIndex===0`인 항목 수, `document.activeElement`, 윤곽선(`outline-style`)이 그려진 `.explorer-row`, 탭 목록·활성·●, Terminal의 `$ python` 줄 수를 읽어 비교한다. 콘솔 error/warning·pageerror와 `localhost:4174`/`data:`/`blob:` 외 요청을 수집한다.

## 4. 결과

### 4.1 S1~S5 처리 상태

| 항목 | 상태 | 근거 |
| --- | --- | --- |
| S1 탭 클릭 영역 | 해결 | `Tabs.tsx:19`(`.tab` 전체 `onClick`), `:27-30`(닫기 `stopPropagation`). 브라우저: 라벨-닫기 사이 간격(`elementFromPoint`=`.tab`)·탭 오른쪽 끝 클릭 모두 선택됨 |
| S2 tablist 소유 위반 | 해결(잔여 H1) | `Tabs.tsx:13,21` — `tablist`/`tab` 역할 제거, 활성 탭 라벨에 `aria-current="true"`. `[role=tab],[role=tablist]` 0개. 단, 역할 없는 `div`에 `aria-label`이 남음(H1) |
| S3 roving tabindex | 해결 | `Explorer.tsx:19,30-40,43-81,90-93`. 4.2 참조 |
| S4 `'en'` 제거 생존 | 미해결, 한계로 기록 — 근거 일부 과장(H3) | `work_log.md:147`, `fileTree.test.ts:43-46`, `fileTree.ts:14` |
| S5 편집기 Tab 포착 | 미해결, 범위 밖으로 기록 — **근거가 사실과 다름**(H2) | `work_log.md:148`, `src/ui/editor/monaco.ts:2-7` |

S4 판단: "기본 로캘이 영어면 `'en'` 제거가 생존한다"와 "lt_LT 환경에서 검출된다"는 2차 기록(4.4 M1b)과 일치한다. 그러나 "테스트 안에서 기본 로캘을 바꿀 방법이 없어 더 다루지 않는다"는 과장이다. 기본 로캘은 못 바꾸지만 `vi.spyOn(String.prototype, 'localeCompare')`로 `'en'` 인자 전달을 직접 고정할 수 있다. 또 2차 기록이 권한 "테스트 이름·주석에 한계 명시"도 반영되지 않았다(`fileTree.test.ts:43`). P01 완료 기준(`P01_ide_shell.md:29`)은 트리 변환 함수 테스트의 존재·통과만 요구하므로 비차단.

S5 판단: "Monaco의 `Ctrl+M`(탭 포커스 모드)으로 빠져나갈 수 있다"(`work_log.md:148`)는 이 빌드에서 거짓이다. 해당 키 바인딩은 `monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode.js:18-19`(Ctrl+M, mac은 Ctrl+Shift+M)에 등록되는데, `src/ui/editor/monaco.ts:2-7`은 이 contrib를 import하지 않는다. 브라우저에서 편집기 클릭 → `Ctrl+M` → `Tab` 결과: 포커스는 편집기에 남고(`inEditor:true`) 텍스트가 바뀌어 탭이 ●가 됨. `Ctrl+Shift+M`도 같음. 2차 기록 `p01_ide_shell_reverify2.md:130`의 "`Ctrl+M`으로 전환" 관찰도 같은 오류를 담고 있다(그 검증자가 실측하지 않은 서술). P01 범위에 접근성 요구가 없으므로 비차단이지만, 기록의 사실 오류는 고쳐야 한다(H2).

### 4.2 Explorer 키보드 모델 (브라우저, 표본 트리 `config/settings.py`, `incidents/event_001.py`, `main.py`)

| 확인 | 관찰 |
| --- | --- |
| `tabIndex=0` 정확히 1개 | 초기(`main.py`=활성 파일), Tab 진입 후, 자식 포커스, End 후, Space 후, 마우스로 폴더 접기 후, 마우스로 파일 행 클릭 후, 탭 클릭으로 활성 파일 변경 후, 포커스된 항목이 DOM에서 사라진 후(합성 click으로 포커스 이동 없이 부모 접기) — 모든 단계에서 1개 |
| 기억 항목이 숨겨질 때 | `focusedPath`=`settings.py`인 채 `config`를 접으면(포커스는 body로) Tab 정지점이 활성 파일 `main.py`로 대체(`Explorer.tsx:40`). 마우스로 접으면 클릭한 폴더 `li`가 포커스를 받아 정지점이 `config` |
| Tab 진입 | 페이지 처음에서 Tab → `main.py` |
| 위/아래/Home/End | 아래: `config→settings.py→incidents→event_001.py→main.py`, 끝에서 고정. 위: 역순, 처음에서 고정. 화면 순서 = DOM 순서(`ul.explorer-tree` 순회) |
| ArrowRight | 열린 폴더 → 첫 자식, 접힌 폴더 → 펼침(포커스 유지), 파일 → 변화 없음 |
| ArrowLeft | 자식 → 부모, 열린 폴더 → 접힘(포커스 유지), 접힌 최상위 폴더 → 변화 없음, 최상위 파일 → 변화 없음 |
| Enter/Space | 파일 열기(`config/settings.py`, `main.py` 탭 활성), 폴더 접기/펼치기 |
| `Ctrl+Enter` | 파일 항목: 실행 줄 +1, 열기 없음. 폴더 항목: +1, 펼침 상태 유지(`Explorer.tsx:44` 조기 반환 → `App.tsx:36-40`) |
| 포커스 윤곽선 | 키보드 포커스 시 해당 행 1개만(`App.css:46-53`, 직계 자식 선택자라 부모 폴더 포커스가 자식 행에 번지지 않음). 마우스 클릭 후 0개(`:focus-visible`) |

코드 리뷰:
- `visibleItems`(`Explorer.tsx:11-14`)는 DOM 순서에 의존한다. 접힌 폴더의 자식은 렌더되지 않으므로(`:106` `{open && ...}`) DOM 순서 = 보이는 순서. 렌더 중의 `visible`(`:31-38`)과 같은 순회라 서로 어긋나지 않는다.
- 중첩 `onFocus` 버블링: React `onFocus`는 버블하지만 `:92` `e.target === e.currentTarget` 가드로 부모 폴더가 자식 포커스를 가로채지 않는다. `onKeyDown`도 `:44`에서 같은 가드.
- 오래된 `focusedPath`: `paths`가 바뀌어 사라진 경로는 `visible.includes`(`:40`)에서 걸러진다. 상태에 값은 남지만 무해.
- `itemProps` 펼침(`:86-95,99,111`): `key`는 펼침 밖에서 직접 지정, 폴더/파일 고유 속성은 뒤에 붙음. 문제 없음.
- 경계: ArrowRight 열린 폴더에서 `focusAt(index + 1)`(`:71`)은 자식이 없는 폴더라면 다음 형제로 간다. `buildFileTree`는 파일 경로에서만 폴더를 만들므로 빈 폴더가 생기지 않아 지금은 도달 불가.
- 중첩 폴더(2단 이상)는 표본 데이터에 없어 브라우저로 못 봤다. ArrowLeft의 `parentElement?.closest('[role=treeitem]')`(`:75`)는 `li > ul[role=group] > li` 구조에서 가장 가까운 상위 항목을 찾으므로 깊이와 무관하게 맞다(코드 리뷰만).
- 복잡도: 렌더마다 `collectVisible` O(n) + `includes` O(n), 키 입력마다 `querySelectorAll` O(n). P04 시나리오 규모에서 문제 없음.

### 4.3 탭

| 확인 | 관찰 |
| --- | --- |
| 탭 아무 곳 클릭 | 라벨-닫기 간격, 오른쪽 끝·위쪽 모서리 클릭 → 선택 |
| 닫기 | 비활성 탭 닫기 → 닫히고 활성 탭 그대로(`stopPropagation`). 닫기 버튼에서 Enter → 닫힘 |
| 라벨 Enter/Space | 선택(네이티브 button click이 `.tab`으로 버블) |
| `Ctrl+Enter` | 비활성 탭 라벨에서: 실행 +1, 선택 안 됨. 닫기 버튼에서: +1, 닫히지 않음(`App.tsx:38` `preventDefault`가 버튼 기본 동작을 막음) |
| 접근성 트리 | `button "main.py"`, `button "Close main.py"`. `tab`/`tablist` 없음. `.tabs`의 `aria-label="Open editors"`는 접근성 트리에 나타나지 않음(H1) |

### 4.4 회귀

- `npm run build` 0, `npm run lint` 0, `npx tsc -b` 0, `npm test` 10 passed.
- 빌드 결과물: `.monaco-editor` 1개(시작·끝), 편집 후 `main.py` 탭 ●, `event_001.py` 접기 아이콘 2개·클릭 시 보이는 줄 6→2, 편집기 안 `Ctrl+Enter` +1, 편집기 밖(`EXPLORER` 제목 클릭 후) +1.
- 콘솔 error/warning 0, 외부 요청 0.

### 4.5 기록

- `HANDOFF.md:9` "P01 완료, 다음은 P02", `:23` 다음 작업 P02. 완료 서사 없음, 23줄. 코드 설명(`:10`)은 현재 상태와 일치.
- `docs/phases/00_index.md:8` Complete, `docs/phases/P01_ide_shell.md:3` Complete — 일치.
- `CHANGELOG.md:5,8-12`: "독립 검증 3회(모두 합격)"은 커밋 시점 기록 3개(`p01_ide_shell*.md`)와 일치.
- `work_log.md:183` 다음 단계 1번이 "P01 3차 보강분 최종 재검증"인데 HANDOFF 다음 작업에는 없다. 이 기록으로 해소되므로 사소(H4).
- `work_log.md:148` S5 서술 오류(H2), `:147` S4 서술 과장(H3).

### 4.6 뮤테이션

UI 키보드 코드에는 단위 테스트가 없어 뮤테이션 테스트 대상이 아니다(브라우저 관찰로 대신함). 이번 변경은 `fileTree.ts`·테스트를 건드리지 않았다. 순수 함수로 뺄 후보는 H5.

## 5. 이슈 / 위험

### 차단 (계약 의무)

없음. P01 범위(`P01_ide_shell.md:13-23`)와 완료 기준(`:25-29`)은 모두 충족하며, 이번 변경은 그 위의 접근성 보강이다.

### 보강 권고 (비차단)

- **H1** `src/ui/tabs/Tabs.tsx:13` — 역할 없는 `div`(generic)에 `aria-label`. WAI-ARIA 1.2는 generic에 `aria-label`을 금지하며 실제로 접근성 트리에 이름이 나타나지 않는다. `role="group"`(또는 `toolbar`)을 붙이거나 `aria-label`을 뺀다.
- **H2** `docs/daily_logs/2026-10-22/work_log.md:148` — "Monaco의 `Ctrl+M`으로 빠져나갈 수 있다"는 사실이 아니다. `src/ui/editor/monaco.ts:2-7`이 `toggleTabFocusMode` contrib를 import하지 않아 단축키가 없다(브라우저 실측). 서술을 고치거나, 탈출 수단이 필요하면 `monaco.ts`에 `monaco-editor/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode` import 한 줄을 추가(P05 등 접근성 단계에서 결정). 2차 기록 `p01_ide_shell_reverify2.md:130`도 같은 오류.
- **H3** `work_log.md:147`, `src/ui/explorer/fileTree.test.ts:43` — S4 "방법이 없다"는 과장. `localeCompare` spy로 `'en'` 인자를 고정할 수 있고, 최소한 테스트 주석에 en 기본 로캘 한계를 적는다.
- **H4** `HANDOFF.md:23` / `work_log.md:183` — 다음 작업 목록 불일치(이 기록으로 해소). 다음 갱신 때 맞춘다.
- **H5** `src/ui/explorer/Explorer.tsx:31-40,51-76` — 보이는 경로 계산·Tab 정지점 선택(`visiblePaths(tree, collapsed)`, `pickTabStop(visible, focused, active)`)과 키→다음 경로 결정(`nextFocus(key, visible, node, collapsed)`)을 순수 함수로 빼면 roving tabindex 불변식("정지점 1개, 숨은 항목 대체")과 ArrowLeft/Right 분기를 Vitest로 고정·뮤테이션할 수 있다. 지금은 DOM 순서와 브라우저 관찰에만 의존.

## 6. 판정

**합격** (Pass)

- S1·S2·S3 해결을 실제 브라우저에서 확인. roving tabindex는 모든 관찰 상태에서 정지점 1개, 화살표·Home/End·Enter/Space·`Ctrl+Enter` 동작이 APG 트리 패턴과 일치. 탭 클릭 영역 복구, 닫기 비선택, 키보드 선택, `Ctrl+Enter` 실행 전용 확인.
- 회귀 없음: 빌드·린트·테스트 10개, `.monaco-editor` 1개, ●, 접기, 편집기 안팎 단축키 각 1회, 콘솔·외부 요청 0.
- S4는 근거가 일부 과장, S5는 근거가 사실과 다르다(H2·H3). 둘 다 P01 계약 밖이라 판정에 영향 없음.
- **P01 Complete 유지가 타당하다.**

## 7. 남은 항목

- H1~H5 처리 여부는 작업자 또는 Owner가 정한다. 특히 H2(작업 로그 사실 오류)는 다음 기록 갱신 때 고칠 것을 권한다.
- 이 기록 파일은 커밋하지 않았다. 다른 저장소 파일은 수정하지 않았다(`dist/`는 재빌드, gitignore 대상). 미리보기 서버는 PID 10417(npm)·10467(vite)로 종료했다. 스크립트는 저장소 밖 scratch 디렉터리에 있다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && git log --oneline -1           # HEAD eaa1695
npm run build && npm run lint && npm test            # 10 passed
npx vite preview --port 4174 --strictPort &           # PID 기록
node smoke.mjs                                        # 4.2~4.4 표의 각 확인(FAILS 0)
node s5.mjs                                           # Ctrl+M / Ctrl+Shift+M 후 Tab → inEditor:true, 텍스트 변경
kill <npm PID> <vite 자식 PID>
```
