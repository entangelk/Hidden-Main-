# 독립 재검증 — P03 데이터 기반 스토리 엔진 + 저장

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유 재검증 요청) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | 커밋 `70c160a` — `src/persistence/save.ts`(+test: `isSnapshot` 모양 검사, 안내 문구), `src/engine/{render,derive}.ts`(CRLF 정규화), `src/engine/derive.test.ts`(인라인 소형 시나리오 포함 신규 테스트), `src/app/run.ts`(`apply` 거부 가드), `.gitattributes`, 데이터 계약 §3·§9, P04 문서, HANDOFF, 작업 로그 §22 |
| 정본 기준 | `docs/phases/P03_story_engine_and_save.md`, `docs/architecture/01_data_contracts.md`(§3·§7·§8·§9), `docs/architecture/00_overview.md`(§5·§5.1), 이전 기록 `docs/verifications/2026-10-22/p03_engine_and_save.md`(조건부 합격, B1·B2, H2~H6) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, 범위 `c28240a..70c160a`. 검증 시작 시 작업 트리 깨끗함(`git status --short` 출력 없음) |

## 2. 범위

1. 이전 지적 B1·B2·H2~H6의 해소 여부(코드·테스트·계약)
2. 새 코드의 회귀·공백 — `isSnapshot`의 과잉 엄격/과소 엄격, 안내 문구 대 계약, CRLF 정규화 위치, `runScene` 가드
3. 뮤테이션 테스트(이전 생존 5종 재적용 + 새 분기 16종)
4. 빌드·린트·테스트, 실제 브라우저 회귀와 손상 저장 재현
5. 기록 — 작업 로그 §22, 계약 §3·§9 추가 문구, HANDOFF

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat c28240a..70c160a
git diff c28240a..70c160a -- src .gitattributes HANDOFF.md docs/architecture docs/daily_logs docs/phases
cat -n src/persistence/save.ts src/engine/{derive,render,parser,slots}.ts src/app/{App.tsx,run.ts} src/ui/editor/{CodeEditor.tsx,acceptChange.ts}
cat -n src/persistence/save.test.ts src/engine/derive.test.ts
npm test; npm run lint; echo $?; npm run build
# 탐침(저장소 밖 스크래치 vitest, root=스크래치, 저장소 모듈 절대 경로 import):
#   snapshot() 출력 왕복(빈 playerEdits, openFiles [], activeFile null) + 적대적 입력 9종에 대해
#   restore → derive → applyEdits → runScene 이 예외 없이 끝나는지
npx vitest run --config <scratch>/re/probe/vitest.config.mjs --silent=false
# 뮤테이션: cp 백업 → 정확히 1회 나타나는 문자열 치환 → vitest run src/engine src/persistence src/app src/scenario
#           → cp 복원 → filecmp 바이트 비교 (21/21 True), 종료 후 git status --short 출력 없음
python3 <scratch>/re/mut/run.py
# 브라우저: npx vite preview --port 4174 --strictPort (백그라운드, PID 기록 후 그 PID와 자식만 종료)
node <scratch>/re/pw/run.mjs      # 두 엔딩, 입력 직후 새로고침, 진행 중·엔딩 후 새로고침, 저장소 차단, setItem 예외,
                                  # E: 실행 후 탭 모두 닫고 새로고침(앱이 직접 쓴 activeFile null 저장)
node <scratch>/re/pw/tamper.mjs   # 같은 출처 정적 CSS 페이지에서 저장 조작 → about:blank → 앱 로드
git status --short   # 출력 없음 확인
```

`run.mjs`의 A11~A14(앱이 열린 채 `localStorage`를 고치고 새로고침)는 `pagehide` 저장이 조작을 덮어써 판정에 쓰지 않았다(이전 기록 §3과 같은 이유). 저장 조작 판정은 모두 `tamper.mjs`로 했다.

## 4. 결과

### 4.1 이전 지적 해소 여부

| ID | 상태 | 근거 |
| --- | --- | --- |
| B1 | 해소 | `isSnapshot`(`src/persistence/save.ts:41-59`)이 파싱 결과의 모양을 검사하고 실패하면 손상 안내 후 새 게임(`save.ts:81`). 계약 §9(`01_data_contracts.md:243`)에 "모양이 다르면 손상", "복원은 예외를 던지지 않는다" 명시. 회귀 테스트 `save.test.ts:56` 12종. 브라우저 T8(`choices: [null]`)·T9(`openFiles` 문자열)·T10(`values` 없음): 편집기 1개, `warn:저장된 진행을 읽을 수 없어 처음부터 시작합니다.`, pageerror 0, 저장이 새 게임으로 덮여 두 번째 새로고침도 정상(안내 없음). |
| B2 | 해소 | 이전 생존 5종 재적용 결과 모두 실패(§4.3): M3 → `derive.test.ts:148`, M8 → `derive.test.ts:139`, M13 → `derive.test.ts:82`, M21 → `save.test.ts:78`, M28 → `derive.test.ts:204`·`save.test.ts:83`. |
| H2 | 반영(잠금 없음) | `src/app/run.ts:56-58` — `apply`가 같은 객체를 돌려주면 `progress`를 싣지 않음. 단 이를 잠그는 테스트가 없다(뮤테이션 H2 생존). mini 시나리오는 모든 사건의 마지막 전이가 빈 조건이라 현재 도달 불가 경로 → 비차단(§5 H7). |
| H3 | 반영 | 계약 §3(`01_data_contracts.md:95`) "전이는 앞으로만", P04 검증 항목(`P04_incident_0214_scenario.md:20`)에 추가. 엔진은 그대로(`derive.ts:38,42`) — P04 테스트가 막는 구조로 정리됨. |
| H4 | 대부분 반영 | `.gitattributes`(`*.py text eol=lf`), `render.ts:78`·`derive.ts:72`에서 `\r\n?` → `\n`. 테스트 `derive.test.ts:189`이 템플릿·초기 파일 양쪽을 잠금(H4a·H4b 사망). 함수 밖 지시문 노출은 P04 검증 항목으로 이관(`P04…md:20`). `@else`/`@end` 뒤 인자 무시(`render.ts:13`의 `(.*)`)는 언급 없음 → H8로 이월. |
| H5 | 해소 | `save.ts:93-97` 같은 버전이면 "저장된 진행 일부를 읽을 수 없어 그 앞까지만 이어갑니다.", 다른 버전이면 기존 문구. 계약 §9(`01_data_contracts.md:244`)에 규칙 추가, 테스트 `save.test.ts:83`(뮤테이션 H5 사망). 브라우저 T12에서 `warn` 한 줄 + 앞부분만 복원 확인. |
| H6 | 문서화 | 계약 §9(`01_data_contracts.md:248`) 알려진 한계, `HANDOFF.md:24`. Owner 보고 여부는 기록상 주장만 있음(작업 로그 §22) — 검증 범위 밖. |

### 4.2 새 코드 점검

- **과소 엄격(예외가 남는가)**: `isSnapshot` 통과 후 `restore`(`save.ts:83-98`) → 첫 렌더(`derive`·`applyEdits`)·`runScene`을 적대적 입력 9종으로 탐침, 예외 0건. 대상: `scenarioVersion: 1e999`(JSON.parse가 `Infinity`로 읽음 → 버전 변경 경로, 편집 폐기), 선택에 여분 속성, `values`/`playerEdits`의 `__proto__`·`constructor` 키(JSON.parse가 자기 속성으로 만들고 조회는 정해진 사건·필드 이름으로만 함), 선택 200,000개(189ms, `validPrefix`가 엔딩 뒤에서 멈춤), 100,000자 편집 값, 탭 100,000개. `NaN`은 JSON에 표현되지 않아 `null` → 거부(`save.ts:47`), 값의 `Infinity`는 `Number.isFinite`(`save.ts:42`)로 거부.
- 탐침에서 본 비정상 수용(예외 아님, 조작된 저장에서만): 같은 탭 경로 중복(`openFiles: ['main.py','main.py']`)이 그대로 복원돼 브라우저 T13에서 `main.py` 탭 2개가 활성으로 보임 → H9. 줄바꿈이 든 편집 값은 화면에 줄을 끼워 넣지만 실행 시 `not_literal`로 거부되고 예외 없음(앱 입력 경로는 `acceptChange.ts:11`이 줄바꿈 거부) — 문제 아님.
- **과잉 엄격(앱이 쓴 저장을 거부하는가)**: 현재 코드는 거부하지 않는다 — 탐침에서 `snapshot()` 출력(빈 `playerEdits`, `openFiles: []`, `activeFile: null`)이 안내 없이 진행 그대로 복원, 브라우저 E(실행 후 탭 모두 닫고 새로고침 — 저장 `{"edits":{},"ws":{"openFiles":[],"activeFile":null}}`)에서 진행 유지·`main.py` 탭으로 복원, T11 동일. **그러나 이 방향을 잠그는 테스트가 없다**: `activeFile: null` 거부(OS1), 빈 `openFiles` 거부(OS3), 빈 객체 거부(OS4 — 실행 직후의 거의 모든 저장이 `playerEdits: {}`), 실수 값 거부(OS5) 뮤테이션이 모두 생존(§4.3). 테스트의 `saved()`(`save.test.ts:14-24`)는 항상 비어 있지 않은 `playerEdits`와 문자열 `activeFile`을 쓰고, `save.test.ts:78`도 `activeFile: 'gone.py'`이다. 계약 §8(`01_data_contracts.md:216-222`)은 `activeFile: string | null`과 "남은 탭이 없으면 처음 화면"을, §7(`:208`)은 해결 시 편집 삭제(→ 빈 `playerEdits`)를 규정하므로, 계약에 맞는 저장은 손상으로 처리되면 안 된다는 "발동하지 않아야 할" 분기다 → **Blocking B3**.
- 안내 문구·수준: 계약 §9는 "Terminal에 한 줄 안내"만 규정(문구·수준 미지정). 코드 문구 3종(`save.ts:81,95,96`)은 상황과 맞고, App은 `warn` 수준으로 한 줄 표시(`App.tsx:47-49`). 같은 버전 부분 재생 시 편집 폐기(`save.ts:90`)는 계약 `:244` "편집 값 폐기"와 일치.
- CRLF 정규화 위치: 화면 텍스트의 원천은 `Stage.template`(`render.ts:78`)과 `initialFiles.content`(`derive.ts:72`) 둘뿐이고, 지시문 해석·슬롯 계산·`functionBlock`은 모두 정규화 뒤의 텍스트에서 돈다(`render.ts:80-105`). 나머지 텍스트(`LogLine.text`)는 Terminal 출력이라 오프셋 계산에 쓰이지 않음. 편집 값은 `acceptChange.ts:11`이 `\r`/`\n`을 거부. 빠진 원천 없음.
- `runScene` 가드(`run.ts:56-58`): `next === progress` 비교는 `apply`의 "거부 시 같은 객체" 계약(`derive.ts:95-98`, 테스트 `derive.test.ts:178`)에 기대므로 올바르다. App은 `progress`가 없으면 아무것도 바꾸지 않음(`App.tsx:114`). 잠금 없음은 H7.

### 4.3 뮤테이션 (21종, 21/21 바이트 동일 복원)

| ID | 변경 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M3 | 플래그 병합 순서 반대 | `derive.ts:58` | `derive.test.ts:148` |
| M8 | 플래그 제자리 변경(`Object.assign`) | `derive.ts:58` | `derive.test.ts:139` |
| M13 | 해결 값 고정 생략 | `render.ts:98` | `derive.test.ts:82` |
| M21 | 빈 탭 → `fresh` 대체 생략 | `save.ts:91` | `save.test.ts:78` |
| M28 | `valuesFit` 개수 검사 제거 | `parser.ts:54` | `derive.test.ts:204`, `save.test.ts:83` |
| B1a | `isSnapshot` 호출 제거(파싱 실패만 손상) | `save.ts:81` | `save.test.ts:47`, `:56` |
| B1b | 선택 항목 검사 제거 | `save.ts:52` | `save.test.ts:56` |
| B1c | `playerEdits` 검사 제거 | `save.ts:53` | `save.test.ts:56` |
| B1d | 탭 원소 문자열 검사 제거 | `save.ts:56` | `save.test.ts:56` |
| B1e | `sceneId` 문자열 검사 제거 | `save.ts:52` | `save.test.ts:56` |
| B1f | `scenarioVersion` 숫자 검사 제거 | `save.ts:47` | `save.test.ts:56` |
| B1g | `workspace` 객체 검사 제거 | `save.ts:54` | `save.test.ts:56` |
| OS1 | `activeFile: null` 거부 | `save.ts:57` | **없음(생존)** |
| OS2 | 문자열 값 거부 | `save.ts:42` | `save.test.ts:91`(옛 저장의 `'yes'`가 우연히 잡음) |
| OS3 | 빈 `openFiles` 거부 | `save.ts:55` | **없음(생존)** |
| OS4 | 빈 객체(`playerEdits: {}`·`values: {}`) 거부 | `save.ts:43` | **없음(생존)** |
| OS5 | 정수가 아닌 숫자 값 거부 | `save.ts:42` | **없음(생존)** |
| H5 | 같은 버전 문구 제거 | `save.ts:94` | `save.test.ts:83` |
| H2 | 거부돼도 `progress` 반환 | `run.ts:58` | **없음(생존)** |
| H4a | 템플릿 CRLF 정규화 제거 | `render.ts:78` | `derive.test.ts:189` |
| H4b | 초기 파일 CRLF 정규화 제거 | `derive.ts:72` | `derive.test.ts:189` |

이전 생존 5종(M3·M8·M13·M21·M28)은 각자 자기 이름의 테스트에 걸린다(한 테스트가 몰아서 흡수하지 않음). B1 계열은 모두 12종 묶음 테스트 하나(`save.test.ts:56`)에 걸리지만 각 항목이 그 묶음 안의 서로 다른 입력에 대응하므로 수용.

### 4.4 빌드·린트·테스트

- `npm test`: 11 파일 90 테스트 통과(작업 로그 §22의 90과 일치). `npm run lint`: 출력 없음, 종료 코드 0. `npm run build`: 성공(`✓ built in 3.17s`), 기존 500kB 청크 경고만.

### 4.5 실제 브라우저 (빌드 결과물, Chromium)

| 시나리오 | 관찰 |
| --- | --- |
| A경로(contained) | 시작 시 `contain` 숨김·슬롯 `["1"]` → `action=2` 실행: `contain() 추가됨`, 변형 "아직 모른다", 지시문 노출 없음, `action = 2` 고정 → 입력 직후 새로고침 슬롯 `["True"]` 유지 → `report.py 생성됨` → 다른 탭 실행 안내 → 진행 중 새로고침: 탭·슬롯·로그 6줄 동일 → 탭 전환 직후 새로고침 활성 탭 유지 → 엔딩 로그 → 엔딩 후 `처리할 사건이 없습니다.` → 엔딩 후 새로고침 유지 |
| B경로(escalated) | 변형 "찾아냈다", 비격리 변형, 잘못된 값 7 → Traceback `line 13, in write_report`, 엔딩 `warn` 줄 |
| 저장소 getter 예외 / `setItem` 예외 | 플레이 가능 |
| E: 실행 후 탭 모두 닫고 새로고침 | 저장 `openFiles: []`, `activeFile: null`, `playerEdits: {}` → 진행 유지, `main.py` 탭, 안내 없음 |
| T1 같은 버전 | 편집 `2` 복원 |
| T8 `choices: [null]` / T9 `openFiles` 문자열 / T10 `values` 없음 / T4 `{bad` | 편집기 1개, `warn` 안내 1줄, 새 게임, pageerror 없음. T8 두 번째 새로고침도 정상 |
| T11 탭 없음 + 빈 편집 | 진행 유지, `main.py` 탭 |
| T12 같은 버전 부분 재생 | `warn:저장된 진행 일부를 읽을 수 없어 그 앞까지만 이어갑니다.` + 앞부분 |
| T13 탭 중복 | `main.py*` 탭 2개 표시(H9) |
| 콘솔 오류 / 외부 요청 | 0건 / 0건 |

### 4.6 기록

- 작업 로그 §22(`docs/daily_logs/2026-10-22/work_log.md:218-229`): "변이 28건 중 22건 검출"은 이전 기록 생존 6건(M3·M8·M13·M21·M24·M28)과 일치. "깨진 모양 12종"은 `save.test.ts:59-70` 12항목과 일치. "변이 5종 직접 적용해 모두 실패"는 재현됨. 테스트 90개 일치. 정확.
- 계약 §3(`01_data_contracts.md:95-96`)·§9(`:243-244,248`) 추가 문구는 코드와 일치. 단 §9의 "모양이 계약과 다름" 판정 기준은 예시(`등`)로만 적혀 있고, 코드가 받아들이는 쪽(빈 객체, `null` 활성 탭)은 §7·§8에서 따라 나온다 — 문서 수정은 필요 없고 B3 테스트로 잠그면 충분.
- HANDOFF: 완료 서술 없음, 다음 작업 "P03 재검증"(`HANDOFF.md:30`) 정확. `HANDOFF.md:9`의 "독립 검증 대기"는 재검증 대기와 의미상 같아 문제 삼지 않음.

## 5. 문제 / 위험

### Blocking (계약 의무)

- **B3** 모양 검사의 "발동하지 않아야 할" 분기에 잠금이 없다 — `src/persistence/save.ts:43`(빈 객체), `:55`(빈 `openFiles`), `:57`(`activeFile: null`). 계약 §7(`01_data_contracts.md:208`, 해결 시 편집 삭제 → `playerEdits: {}`)과 §8(`:216-222`, `activeFile: string | null`, 탭 없음 허용)에 맞는 저장을 손상으로 처리하는 과잉 교정(OS1·OS3·OS4)이 테스트 90개를 모두 통과한다. 현재 코드는 올바르게 동작하지만(탐침·브라우저 E·T11), 회귀 시 실행 직후 새로고침마다 진행이 사라진다. 조건: `snapshot()`으로 만든 저장 — `playerEdits: {}`, `workspace: { openFiles: [], activeFile: null }` — 이 안내 없이 진행 그대로 복원되는 테스트 1개(`save.test.ts`에 추가).

### Hardening (비차단)

- **H7** `runScene` 가드(`src/app/run.ts:56-58`)를 잠그는 테스트 없음(뮤테이션 H2 생존). 마지막 전이가 빈 조건이 아닌 인라인 시나리오로 `progress` 미반환을 확인하면 잠긴다. P04의 "마지막 전이는 빈 조건" 검증이 생기면 도달 불가.
- **H8** (H4 이월) `@else`/`@end` 뒤 인자를 조용히 무시 — `src/engine/render.ts:13`. P04 검증 항목에 추가하거나 인자가 있으면 오류로.
- **H9** 조작된 저장의 탭 중복이 그대로 복원돼 같은 탭이 둘 보임 — `src/persistence/save.ts:34-38`(`cleanWorkspace`가 중복 제거 안 함), `save.ts:55-56`. 앱 자신은 중복을 쓰지 않음(`App.tsx:138`). 예외는 없음.
- **H10** 실수 값(`number` 필드) 수용 잠금 없음(OS5 생존) — `src/persistence/save.ts:42`. mini에 `number` 필드가 없어 지금은 결과 차이가 안내 문구뿐. P04에서 `number` 필드가 생기면 왕복 테스트에 포함 권장.
- H6(여러 탭)은 알려진 한계로 문서화됨 — Owner 수용 여부만 남음.

## 6. 판정

**조건부 합격** — B3(앱이 쓰는 정상 저장 — 빈 `playerEdits`, 빈 `openFiles`, `activeFile: null` — 이 손상으로 처리되지 않음을 잠그는 왕복 테스트 1개)를 추가해야 한다.

- B1은 코드·계약·회귀 테스트·브라우저(영구 빈 화면 해소) 모두에서 닫혔다. 적대적 입력 9종에서도 예외 없음.
- B2의 5개 규칙은 이전에 살아남던 뮤테이션을 각자 자기 테스트가 잡는다.
- H2~H5는 반영, H6은 문서화. 두 엔딩·새로고침 복원·입력 직후 새로고침 회귀 없음, 콘솔 오류·외부 요청 0.
- 그러나 B1 수정이 새로 만든 "정상 저장은 통과" 분기는 과잉 교정을 되살려도 아무 테스트도 실패하지 않는다. 가이드상 빠진 over-strict 잠금은 차단 사유다.
- P03 Complete는 B3 테스트 추가 후 가능(추가 재검증은 그 테스트가 OS1·OS3·OS4를 잡는지 확인하는 정도로 충분).

## 7. 미결 사항

- 이 기록 외 저장소 변경 없음(작업 트리 바이트 동일, `git status --short`에 이 파일만 새로 보임). 대상 커밋은 이미 커밋됨, 푸시는 Owner 몫.
- H6 수용 여부는 Owner 결정 대상.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git status --short && npm test && npm run lint && npm run build
# B3 재현: src/persistence/save.ts 를 cp 백업 후 아래 중 하나로 바꾸고 npx vitest run src/persistence → 전부 통과(잠금 없음)
#   OS1: (workspace.activeFile === null || typeof workspace.activeFile === 'string')  →  typeof workspace.activeFile === 'string'
#   OS3: Array.isArray(workspace.openFiles) &&  →  Array.isArray(workspace.openFiles) && workspace.openFiles.length > 0 &&
#   OS4: isObject(x) && Object.values(x).every(ok)  →  isObject(x) && Object.keys(x).length > 0 && Object.values(x).every(ok)
#   이후 cp 복원 → cmp 로 바이트 동일 확인
# B1 브라우저: npx vite preview --port 4174 → 같은 출처 정적 자원(/assets/*.css)에서
#   localStorage['incident-workspace:save:mini'] = 정상 저장에 progress: { choices: [null] } → about:blank → 앱 로드
#   → 편집기 표시, warn 안내 1줄, 새로고침해도 정상
```
