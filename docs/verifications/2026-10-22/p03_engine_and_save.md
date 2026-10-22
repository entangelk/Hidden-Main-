# 독립 검증 — P03 데이터 기반 스토리 엔진 + 저장

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유 독립 검증 요청) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | P03 구현 — `src/engine/{types,parser,condition,render,derive}.ts`(+tests), `src/scenario/mini/*`, `src/scenario/scenarioData.test.ts`, `src/persistence/save.ts`(+test), `src/app/{run.ts,run.test.ts,App.tsx,App.css}`, `src/ui/terminal/Terminal.tsx`, P02 프로토타입 삭제, 문서·기록 갱신 |
| 정본 기준 | `docs/phases/P03_story_engine_and_save.md`, `docs/architecture/01_data_contracts.md` v0.5(§3·§5·§6·§8·§9), `docs/architecture/00_overview.md` v0.5(§3·§4·§5·§5.1·§6.x·§7), `docs/SOT.md` §3.3~3.6·AC-03~09·R-05·R-08, DB-01·DB-03·DB-04 |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, 커밋 `bedbd1c`, `c28240a` (범위 `87d0e51..c28240a`). 검증 시작 시 작업 트리 깨끗함(`git status --short` 출력 없음) |

## 2. 범위

1. 스펙 적합성 — P03 범위 항목·완료 기준·결정 3건, 데이터 계약 변경(`Scenario.scenes` 추가, `DerivedState.files`, persistence 쪽 타입 선언)의 정당성과 문서 반영, 의존 방향
2. 엔진 정확성 — `derive.ts`(재생·도달/알림·플래그·전이·엔딩·`apply`·`validPrefix`), `render.ts`(블록 제거·주석 변형·슬롯 계산 순서·고정 값), `condition.ts`, `parser.valuesFit`
3. 저장 정확성 — 복원 규칙 대 계약 §8/§9, 저장기(디바운스·flush·saveNow), App 연결(StrictMode, `pagehide`, 오래된 스냅샷 덮어쓰기 경로), 여러 탭
4. 실제 브라우저 동작 — 빌드 결과물 + Playwright
5. 테스트와 뮤테이션 테스트 (28개)
6. 기록 — HANDOFF, 작업 로그 §21, 인덱스·P03 상태, 결정 기록

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff 87d0e51..c28240a --stat
cat docs/guides/verification.md docs/phases/P03_story_engine_and_save.md docs/architecture/01_data_contracts.md
sed -n 40,230p docs/architecture/00_overview.md; awk '/^### 3.3/,/^## 4/' docs/SOT.md
cat src/engine/{types,derive,render,condition,parser,slots}.ts src/persistence/save.ts src/app/{run.ts,App.tsx} src/ui/terminal/Terminal.tsx src/scenario/mini/*
cat src/engine/*.test.ts src/persistence/save.test.ts src/app/run.test.ts src/scenario/scenarioData.test.ts
# 옛 계약 이름 잔존 탐색
grep -rn "unlockedFiles\|fileView\|Engine\.parse\|prototype\|runPrototype" --include=*.md . ; grep -rn "unlockedFiles\|fileView\|prototype" src
# 의존 방향
grep -rn "^import" src/engine src/persistence src/scenario | grep -v "from '\./\|from 'vitest'"
# 링크·앵커 (스크래치 스크립트, 저장소 밖): docs/**/*.md + HANDOFF.md의 `*.md#앵커` 대상 헤딩 슬러그 대조 → bad 0
npm test; npm run lint; npm run build
# 엣지 케이스 탐침: 저장소 밖 스크래치 vitest 설정(root=스크래치, 저장소 모듈은 절대 경로 import)
npx vitest run --config <scratch>/probe/vitest.config.mjs --silent=false --reporter=verbose
# 브라우저
npx vite preview --port 4174 --strictPort &   # 백그라운드, PID 기록 후 그 PID만 종료
node <scratch>/pw/run.mjs      # 두 엔딩 완주, 변형 주석, 새로고침, 저장소 차단, setItem 예외
node <scratch>/pw/tamper.mjs   # 앱이 돌지 않는 같은 출처 정적 자원(/assets/*.css)에서 저장을 조작한 뒤 앱 로드
# 뮤테이션: cp 백업 → 정확히 1회 나타나는 문자열 치환 → vitest run src/engine src/persistence src/app src/scenario → cp 복원 → filecmp 바이트 비교
python3 -I <scratch>/mut/run.py <scratch>
git status --short   # 출력 없음 확인
```

브라우저 조작 주의: 앱이 열린 상태에서 `localStorage`를 고친 뒤 `reload`하면 `pagehide` 저장이 조작을 덮어쓴다(설계대로의 동작). 그래서 저장 조작 시나리오는 `about:blank` → 같은 출처 정적 CSS 자원 페이지에서 `setItem` → `about:blank` → 앱 로드 순서로 수행했다.

## 4. 결과

### 4.1 스펙 적합성

- 범위 항목: 타입 정본(`src/engine/types.ts:46-114`), `apply`/`derive`/`validPrefix`(`src/engine/derive.ts:86-103`), 전이·플래그·해금·엔딩(`derive.ts:49-71`), `render`→`applyEdits`(`src/engine/render.ts:71-106`, `src/app/App.tsx:51-55`), 함수 단위 진행과 고정 값(`render.ts:93-105`), persistence 어댑터(`src/persistence/save.ts`), 미니 시나리오(`src/scenario/mini/index.ts`) 모두 존재.
- 결정 3건: 지시문 문법(`render.ts:13-14`, 아키텍처 §5.1), 함수 추가 알림(`derive.ts:43`, 아키텍처 §5), 시나리오 순수성 테스트(`src/scenario/scenarioData.test.ts:15-24`). P03 문서 범위 항목과 작업 로그 §21에 기록됨.
- 계약 변경 정당성: `Scenario.scenes`는 `Stage.sceneIds`가 참조할 정의 위치가 계약에 없던 결함의 보정(`01_data_contracts.md:44`, §3.1 표). `DerivedState.files`는 해금 목록과 파일 내용이라는 같은 사실의 이중 표현 제거(`01_data_contracts.md:162`, §5 표 "해금된 파일 목록 → files의 키"). `SaveSnapshot`/`WorkspaceView`/`KeyValueStore`의 persistence 선언은 §1 표와 머리말(`01_data_contracts.md:5`)에 반영. 데이터 계약 가이드 기준에 맞는 정당한 변경으로 판단.
- 옛 이름 잔존: `unlockedFiles` 없음. `fileView`는 `applyEdits(fileView, edits)`의 인자 이름(`00_overview.md:142`, `01_data_contracts.md:188`)으로만 남음 — 타입·필드가 아니므로 문제 없음. `Engine.parse`(`00_overview.md:59`)는 모듈 표기로 `engine/parser.ts`의 `parse`와 일치. `prototype` 언급은 과거 작업 로그 §16~20 기록과 P02 인덱스 행뿐(역사 기록, 정상). 앵커 깨짐 0.
- 의존 방향: 런타임 코드에서 `engine/`은 `./`만 import. `persistence/save.ts:1-2`와 `scenario/mini/index.ts:3`은 engine으로 안쪽 의존. `engine/derive.test.ts:2`가 `scenario/mini`를 import하는 것은 테스트 전용 fixture 의존이며 mini는 engine 타입만 쓰므로 런타임 순환이 없다 — P03 범위가 mini를 "테스트 fixture"로 정의하므로 수용.
- 시나리오 검증(마지막 전이 빈 조건, 함수 순서 = `sceneIds`, 모든 경로 렌더)은 아키텍처 §5·§8과 P04 문서로 P04에 배정됨 — P03 미이행 아님.

### 4.2 엔진 정확성

- 시작 사건: `reach(start, false)`(`derive.ts:46`)로 알림 없이 해금. 같은 파일 다음 함수는 `추가됨`, 새 파일은 `생성됨`(`derive.ts:39-43`). 브라우저에서 두 경로 모두 확인.
- 플래그 불변성: `flags`는 매 전이마다 새 객체로 재할당(`derive.ts:58`)되므로 `flagsAtReach: flags`(`derive.ts:38`)의 참조 캡처는 현재 코드에서 안전. 탐침: `derive(...).flags`를 바꿔도 재파생 결과 불변. **단, 이 성질을 잠그는 테스트가 없다**(뮤테이션 M8 생존, §5).
- 전이 미일치: `if (!transition) break`(`derive.ts:54`)로 `validCount` 미증가 → `apply`가 같은 객체 반환. 그러나 `runScene`은 `apply`가 거부해도 `progress`를 그대로 실어 돌려준다(`src/app/run.ts:56`) → App이 해결로 처리하고 `choices.at(-1)!.sceneId`(`App.tsx:115`)를 읽는다. 첫 사건에서 이 경로가 나면 예외. 현재는 "마지막 전이 빈 조건" 규칙(P04 검증 예정)으로만 막힘 → Hardening H2.
- 엔딩 로그 조회 `?? []`(`derive.ts:64`), `currentSceneId = null`(`derive.ts:63`) 확인. 엔딩 후 모든 `valueSlots` 비어 있음(브라우저 A9 `slots []`).
- `apply`의 거부 시 같은 객체 반환(`derive.ts:95-98`) — 테스트 `toBe(start)`로 잠김(M4 사망).
- 재방문(순환) 전이: `reach`가 기존 `solved`를 지우고 `추가됨`을 다시 남긴다(`derive.ts:38,42`). 계약은 순환을 금지도 허용도 하지 않음 → Hardening H3.
- `render.ts`: 미도달 블록을 역순으로 제거하며 위쪽 빈 줄 포함(`render.ts:79-84`, `blankLinesAbove` `:50-59`). 탐침 결과 시작 화면은 `return monitor.ignore(alert_id)\n\n\nif __name__` — 빈 줄 2개 유지, 꼬리 보존. 변형 해석 후 슬롯 계산(`:86-103`) 순서 정상. 고정 값은 `formatLiteral` → `applyEdits`(`:93-105`)로 표시, 브라우저에서 `action = 2` 고정 확인.
- 지시문: `DIRECTIVE`(`render.ts:13`)는 `m` 플래그 없는 `$`이고 `.`이 `\r`과 맞지 않아, CRLF 템플릿에서는 지시문이 인식되지 않아 두 분기가 그대로 화면에 나오거나(전체 CRLF) `Unclosed @if`가 난다(`@end` 줄만 CRLF). 탐침으로 확인. 저장소에 `.gitattributes` 없음 → Hardening H4. `@else`/`@end` 뒤 인자는 조용히 무시(`:13`의 `(.*)`), 함수 블록 밖 지시문은 해석되지 않고 노출됨 → H4에 포함.
- `condition.ts:9-21`: `==`/`!=` 엄격 비교, 순서 비교는 숫자끼리만. 테스트로 경계 포함·문자열 거부 잠김(M16·M17·M18 사망).
- `parser.valuesFit`(`parser.ts:53-67`): NaN은 범위 비교에서 거짓 → 거부, 정수 필드에 실수 거부. 필드 이름이 바뀐 경우 값 `undefined` → 거부. 여분 키는 길이 비교(`:54`)로만 거부되며 **잠그는 테스트 없음**(M28 생존).

### 4.3 저장 정확성

- 계약 §9 대조: JSON 실패·`schemaVersion` 불일치 → 새 게임 + 한 줄 안내(`save.ts:56-61`, App에서 `warn` 수준 `App.tsx:47-49`). 버전 불일치 → `validPrefix` + 편집 폐기(`save.ts:63-71`). 같은 버전이면 편집 유지. 저장소 `getItem` 예외 → 안내 없이 새 게임(`save.ts:47-52`), `browserStorage` getter 예외 → `null`(`App.tsx:20-26`). `null`·숫자·문자열·배열 JSON → 안내 후 새 게임(탐침 확인).
- **결함(Blocking B1)**: 구조가 깨진 저장에서 `restore`가 예외를 던진다. `progress.choices`에 `null` 항목 → `derive.ts:51`의 `choice.sceneId`에서 TypeError, `values` 누락/`null` → `parser.ts:54`의 `Object.keys`, `workspace.openFiles`가 배열 아님 → `save.ts:35`의 `.filter`. `restore` 주석(`save.ts:42`)은 "Never throws"라고 약속하고, App은 `useState` 초기화(`App.tsx:33`)에서 호출하므로 화면이 비고, 저장이 그대로 남아 **새로고침해도 계속 빈 화면**이다(브라우저 T8·T9: `.monaco-editor` 0개, pageerror, 저장 값 그대로). 계약 §9는 "JSON 파싱 실패"만 명시해 이 경우를 말하지 않는다 — 코드는 `Array.isArray(choices)`까지만 검사(`save.ts:58`)해 일부만 처리하는 상태이므로, 가이드의 "스펙 침묵 + 코드 부분 집행" 계약 공백에도 해당한다.
- 탭 정리·처음 화면 대체: `cleanWorkspace`(`save.ts:33-38`) + 빈 탭이면 `fresh`(`save.ts:71`). 브라우저 T6(알 수 없는 탭만), T7(탭 모두 닫힘) → `main.py` 한 탭으로 복원, 계약 §8 문언대로. 그러나 `restore` 수준의 대체 분기는 **테스트 없음**(M21 생존).
- 안내 문구: 같은 버전인데 재생 불가 항목이 있으면(`save.ts:73-75`) "시나리오가 바뀌어…"가 나와 사실과 다름 → H5.
- 저장기: `schedule`은 대기 스냅샷 교체, `saveNow`/`flush`는 타이머 해제 후 즉시 기록(`save.ts:95-124`). `pagehide`의 `saveNow`가 대기 타이머를 취소하므로 디바운스 타이머가 `pagehide` 뒤 오래된 값을 쓰는 경로 없음. 진행 변경 시 `saveNow`가 대기 스냅샷을 대체하므로 이전 진행의 디바운스 스냅샷이 새 진행을 덮는 경로 없음(`App.tsx:85-91`). StrictMode 이중 effect는 같은 스냅샷을 두 번 쓰는 것뿐(무해). 마운트 시 즉시 저장(`App.tsx:86-88`)은 손상 저장을 새 게임으로 덮어 다음 로드에서 안내가 사라지는 정도(정상).
- 여러 탭(보고만): 마지막에 쓴 탭이 이긴다. `storage` 이벤트 구독이 없어, 오래된 탭의 편집·탭 전환·`pagehide`가 다른 탭의 더 진행된 저장을 덮는다. 검증 중 실제로 관찰됨(앱이 열린 채 저장을 바꾸고 새로고침하면 `pagehide`가 덮음) → H6.

### 4.4 실제 브라우저 (빌드 결과물, Chromium, localStorage 사용 컨텍스트)

| 시나리오 | 관찰 |
| --- | --- |
| 시작 | `.monaco-editor` 1개, `contain` 숨김, 슬롯 `["1"]`, Explorer `config/settings.py`·`main.py` |
| A경로 triage=2 | 로그 `$ python main.py` / `서버 격리 완료` / `[workspace] main.py: contain() 추가됨`; 변형 "출발지를 아직 모른다"(분석 안 함), 지시문 노출 없음, `action = 2` 고정, 슬롯 `["False"]` |
| 입력 직후 새로고침 | `True` 입력 즉시 reload → 슬롯 `["True"]`, 저장 `{"contain":{"isolate":"True"}}` |
| 새 파일 | `[workspace] incidents/report.py 생성됨`, Explorer에 `incidents/report.py` 등장 |
| 비활성 탭 실행 | `실행할 파일: incidents/report.py (현재 탭: main.py)` |
| report 변형 | 격리됨 경로 "격리되었다", 비격리 경로(B) "아직 연결되어" |
| 새로고침(진행 중) | 탭·활성 파일·슬롯 동일, 로그는 재생분 6줄 동일(일시 안내 1줄은 사라짐 — 아키텍처 §3 6단계대로) |
| 탭 전환 직후 새로고침 | 활성 파일 `main.py` 유지 |
| 엔딩 contained / escalated | 각 엔딩 로그 정상(`warn` 색), 엔딩 후 실행 → `처리할 사건이 없습니다.`, 엔딩 후 새로고침 유지 |
| 잘못된 값 7 | Traceback + `line 13, in write_report` + `ValueError: action 값은 1, 2 중 하나여야 합니다 (입력: 7)`, 진행 불변 |
| 저장 조작 T1~T7 | 같은 버전 → 편집 `2` 복원; 버전 0(전부 유효) → 진행 유지·편집 폐기·안내 없음; 버전 0(일부 무효) → `warn` 안내 + 앞부분만, `report.py` 탭 제거; `{bad`·schema 2 → 안내 후 새 게임 |
| 저장 조작 T8·T9 | **빈 화면, pageerror, 새로고침 반복해도 동일** (B1) |
| `localStorage` getter 예외 | 플레이 가능, 새로고침 시 새 게임 |
| `setItem` 예외 | 플레이 가능 |
| 콘솔 오류 / 외부 요청 | T8·T9 외 0건 / 0건 |

### 4.5 테스트와 뮤테이션

- `npm test`: 11 파일 83 테스트 통과(작업 로그 §21의 83과 일치). `npm run lint` 통과, `npm run build` 성공(기존 500kB 청크 경고만).
- 뮤테이션 28개, 각각 cp 백업 → 치환 → `vitest run src/engine src/persistence src/app src/scenario` → cp 복원 → `filecmp` 바이트 동일 확인(28/28 True). 종료 후 `git status --short` 출력 없음.

| ID | 변경 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M1 | 시작 사건도 알림 | `derive.ts:46` | derive — start(시작 상태), transitions(로그) |
| M2 | `추가됨` 알림 제거 | `derive.ts:42` | transitions "appends the next function" |
| M3 | 플래그 병합 순서 반대(옛 값 우선) | `derive.ts:58` | **없음(생존)** |
| M4 | `apply` 항상 추가 | `derive.ts:97` | apply "returns the same progress…" |
| M5 | 엔딩 로그 제거 | `derive.ts:64` | endings "contained" |
| M6 | `sceneId` 비교 제거 | `derive.ts:51` | replay validPrefix (apply 테스트는 `valuesFit`이 흡수) |
| M7 | 엔딩 시 `currentSceneId = null` 제거 | `derive.ts:63` | run "after an ending", apply, endings |
| M8 | 플래그를 제자리 변경(`Object.assign`) | `derive.ts:58` | **없음(생존)** |
| M9 | 위쪽 빈 줄 제거 안 함 | `render.ts:52` | start "only the reached function" |
| M10 | 블록 뒤 줄바꿈 남김 | `render.ts:83` | start "only the reached function" |
| M11 | `@if` 판정 반전 | `render.ts:36` | 변형 4건 |
| M12 | `Unclosed @if` 검사 제거 | `render.ts:45` | rejects malformed directives |
| M13 | 해결 값 고정 생략 | `render.ts:97` | **없음(생존)** |
| M14 | 현재 사건 외 슬롯도 노출 | `render.ts:105` | endings, transitions |
| M15 | 변형에 빈 플래그 사용 | `render.ts:90` | DB-01 변형, 새 파일 변형 |
| M16 | `>=` → `>` | `condition.ts:17` | holds 경계, resolveVariants 숫자 |
| M17 | `every` → `some` | `condition.ts:9` | 7건 |
| M18 | 없는 플래그 `!=`를 거짓으로 | `condition.ts:15` | holds "missing flag" |
| M19 | 버전 달라도 편집 유지 | `save.ts:70` | restore "drops edits…" |
| M20 | 탭 정리 생략 | `save.ts:66` | restore "version change… cleans tabs" |
| M21 | 빈 탭 → `fresh` 대체 생략 | `save.ts:71` | **없음(생존)** |
| M22 | `schemaVersion` 검사 제거 | `save.ts:58` | restore "corrupt JSON or another schema" |
| M23 | 안내 조건 `<` → `<=` | `save.ts:73` | restore 2건 |
| M24 | `flush`의 `clearTimeout` 제거 | `save.ts:100` | 없음(생존) — 타이머가 `pending=null`로 아무것도 안 쓰므로 동등 변이. 결함 아님 |
| M25 | 쓰기 예외 전파(`catch`→`finally`) | `save.ts:107` | createSaver "write failures are swallowed" |
| M26 | 활성 탭 검사 제거 | `run.ts:31` | run "only names the file" |
| M27 | 편집 값 무시 | `run.ts:36` | run 3건 |
| M28 | `valuesFit` 개수 검사 제거 | `parser.ts:54` | **없음(생존)** |

생존 분석:
- M13: `derive.test.ts:44`의 "solved value shown fixed"는 기본값과 같은 `action = 1`을 고르므로 고정 표시가 없어도 통과한다. P03 범위 "해결된 함수의 값 고정 표시"(SoT §3.3, 계약 §6)의 under-strict 잠금이 없다.
- M8: `derive.test.ts:60`은 이름과 달리 "도달 시점 플래그"와 "최종 플래그"를 구분하지 못한다(mini에서 이미 보인 사건의 변형 플래그가 나중에 바뀌는 경로가 없음). 아키텍처 §5.1 "나중에 플래그가 바뀌어도 이미 보인 주석은 바뀌지 않는다"의 잠금 없음.
- M3: 계약 §3 `Effect` "플래그를 이 값으로 설정"(덮어쓰기) — 같은 플래그를 다른 값으로 다시 설정하는 경로가 테스트에 없음.
- M21: 계약 §8 "남은 탭이 하나도 없으면 시작 사건의 파일 하나를 연 처음 화면" — `cleanWorkspace` 단위 테스트(`save.test.ts:79`)는 빈 결과까지만 보고 대체 분기는 안 봄.
- M28: 계약 §9 "재생 중 존재하지 않는 … 필드 … 를 만나면 그 직전까지" — 여분 필드가 붙은 옛 저장의 잘림이 잠기지 않음.

### 4.6 기록

- HANDOFF(`HANDOFF.md:9-15,26-29`): 현재 상태와 다음 작업만 있고 완료 서술 없음. 코드 구성 설명이 실제 파일과 일치.
- 작업 로그 §21(`docs/daily_logs/2026-10-22/work_log.md:204-216`): 파일 목록·결정·계약 보정·테스트 수(83)가 실제와 일치. "손상 → 안내 후 새 게임"은 JSON 파싱 실패에 대해서만 사실(B1).
- 인덱스 `In Progress`(`docs/phases/00_index.md:10`)와 P03 문서 상태(`P03_story_engine_and_save.md:3`) 일치. 결정 3건은 P03 범위 항목에 "→ 결정:"으로 기록됨.

## 5. 문제 / 위험

### Blocking (계약 의무)

- **B1** 구조가 깨진 저장에서 앱이 영구히 빈 화면이 된다 — `src/engine/derive.ts:51`(`null` 선택 항목), `src/engine/parser.ts:54`(`values` 누락), `src/persistence/save.ts:35`(`openFiles` 비배열)에서 예외, `src/persistence/save.ts:42`의 "Never throws" 위반, 호출 지점 `src/app/App.tsx:33`. 계약 §9가 "JSON 파싱 실패"만 정의해 이 경우가 스펙 침묵 상태이므로 (a) 계약 §9에 "형식이 맞지 않는 저장 = 손상"을 명시하고 (b) `restore`가 이를 새 게임 + 안내로 처리하며 (c) `null` 항목·`values` 누락·`workspace` 비정상 각각의 회귀 테스트를 추가해야 한다.
- **B2** 계약이 요구하는 분기 중 잠금이 없는 것(뮤테이션 생존):
  - 해결 값 고정 표시 — `src/engine/render.ts:97-101`, 테스트 `src/engine/derive.test.ts:44`가 기본값과 같은 값을 써서 물지 않음(M13). 기본값과 다른 값(예: `action = 2`)으로 고정 표시를 확인해야 함.
  - 변형 평가 시점 = 도달 시점 플래그 — `src/engine/derive.ts:38`, `src/engine/render.ts:90`(M8). 도달 후 플래그가 바뀌는 시나리오(테스트 내 소형 시나리오)로 이미 보인 주석이 바뀌지 않음을 확인해야 함.
  - 플래그 덮어쓰기 — `src/engine/derive.ts:58`(M3).
  - 복원 시 빈 탭 → 처음 화면 대체 — `src/persistence/save.ts:71`(M21).
  - 옛 저장의 여분 필드 → 그 지점에서 잘림 — `src/engine/parser.ts:54`(M28).

### Hardening (비차단)

- **H2** `runScene`이 `apply` 거부 시에도 `progress`를 돌려줌 — `src/app/run.ts:56`; App은 해결로 처리하고 `src/app/App.tsx:115`에서 첫 사건이면 예외. `apply` 결과가 입력과 같은 객체면 `progress`를 빼는 편이 안전.
- **H3** 이미 도달한 사건으로의 전이 시 `solved` 소실·`추가됨` 중복 — `src/engine/derive.ts:38,42`. 계약에서 순환을 금지(P04 검증)하거나 처리 규칙을 정할 것.
- **H4** 지시문 파싱이 CRLF에 취약 — `src/engine/render.ts:13-14`; `.gitattributes`(`*.py text eol=lf`) 또는 `\r` 제거. `@else`/`@end` 뒤 인자 무시, 함수 블록 밖 지시문 노출도 P04 검증 항목 후보.
- **H5** 같은 버전 재생 실패 시 안내 "시나리오가 바뀌어…"가 사실과 다름 — `src/persistence/save.ts:73-75`.
- **H6** 여러 탭 동시 실행 시 마지막 저장이 이김(오래된 탭의 `pagehide`가 더 진행된 저장을 덮음) — `src/app/App.tsx:93-99`, `src/persistence/save.ts:95-124`. MVP에서 수용할지 Owner 판단 대상.

## 6. 판정

**조건부 합격** — B1(구조가 깨진 저장에서 `restore` 예외 → 영구 빈 화면, 계약 §9 보강 포함)과 B2(해결 값 고정·도달 시점 플래그·플래그 덮어쓰기·빈 탭 대체·여분 필드 잘림의 회귀 잠금 5건)를 닫아야 한다.

- 엔진·저장·실행 경로의 기능 동작은 단위 테스트(83개)와 브라우저 두 엔딩 완주, 새로고침·입력 직후 새로고침·버전 불일치·손상 JSON·저장소 차단에서 스펙대로 동작했다.
- 그러나 P03 완료 기준의 "손상" 처리가 JSON 파싱 실패 밖에서 무너지고, 범위 항목·계약 조항 5개는 테스트가 통과해도 결함을 되살렸을 때 아무것도 실패하지 않는다.
- P03 Complete로 바꾸면 안 된다.

## 7. 미결 사항

- 이 기록 외 저장소 변경 없음. 대상 커밋은 이미 커밋됨, 푸시는 Owner 몫.
- B1·B2 반영 후 재검증 필요. H6(여러 탭)은 Owner 결정 대상.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && npm test && npm run lint && npm run build
# B1 재현 (단위): 스크래치 vitest에서
#   restore({ getItem: () => JSON.stringify({ schemaVersion: 1, scenarioId: 'mini', scenarioVersion: 1,
#     progress: { choices: [null] }, playerEdits: {}, workspace: { openFiles: ['main.py'], activeFile: 'main.py' }, savedAt: '' }),
#     setItem() {} }, miniScenario, fresh)   → TypeError
# B1 재현 (브라우저): npx vite preview --port 4174 → 같은 출처 정적 자원 페이지에서 위 JSON을
#   localStorage['incident-workspace:save:mini']에 기록 → 앱 로드 → 빈 화면, 새로고침해도 동일
# B2 재현: 각 위치를 4.5 표의 M3·M8·M13·M21·M28처럼 바꾸고 npx vitest run → 전부 통과(잠금 없음).
#   cp 백업 → 치환 → 실행 → cp 복원 → cmp 로 바이트 동일 확인
```
