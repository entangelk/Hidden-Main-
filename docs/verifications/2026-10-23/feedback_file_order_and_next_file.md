# 첫 플레이 피드백 반영(파일 순번·`next_file()`) 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: 커밋 `3297b74`(HEAD), 브랜치 `claude/compassionate-ramanujan-qoaiw1`. `git diff b07b908..HEAD`(README 커밋 `facfb49` 포함, 17파일 +234/−36)
  - 코드: `src/engine/derive.ts`, `src/engine/render.ts`, `src/ui/editor/CodeEditor.tsx`, `src/scenario/validate.ts`, `src/scenario/incident-0214/index.ts`·`main.py`
  - 테스트: `src/engine/derive.test.ts`, `src/scenario/validate.test.ts`, `src/scenario/scenarioData.test.ts`
  - 기록: `docs/SOT.md`(v0.7), `docs/architecture/00_overview.md` §5.2, `docs/architecture/01_data_contracts.md`, `docs/scenario/incident-0214.md`, `HANDOFF.md`, `CHANGELOG.md`, `docs/daily_logs/2026-10-23/work_log.md`, `README.md`
- 정본 기준: `docs/SOT.md` v0.7 §3.3·§3.4·§5.4, `docs/architecture/00_overview.md` §5.2, Owner 합의 요구 1(파일 순번, 시나리오 버전 3→4)·요구 2(`next_file()`)

## 2. 범위

1. `derive`/`renderStage` 변경의 정확성: 현재 사건 슬롯 오프셋 불변, 엔딩, v3 저장 복원, `apply`·`validPrefix` 영향
2. `CodeEditor` 스크롤 로직: 안내 함수가 **새로 생길 때만** 동작하는지, 정리(cleanup)·오래된 ref 문제
3. 떠난 파일에서 `Ctrl+Enter`(`src/app/run.ts`)
4. 새 테스트의 양방향성 + 변이 테스트
5. `npm run lint`, `npm test`, `npm run build`
6. 브라우저(작은 창): 스크롤, Explorer 순서, 새로고침 유지, 콘솔 오류
7. 문서 정합성과 생성 텍스트·`main.py`의 Python 그럴듯함

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile`

- 코드 읽기: `git show 3297b74`, 관련 파일 전문(`render.ts`, `derive.ts`, `slots.ts` `functionBlock`, `save.ts`, `run.ts`, `CodeEditor.tsx`, `validate.ts`, 템플릿 `.py`).
- 엔진 출력 덤프: `<S>/dump.test.ts`를 별도 vitest 설정(`<S>/vitest.config.mjs`, 저장소 파일 수정 없음)으로 실행 — 사건 2·3·4개 해결 시점의 `01_event_001.py` 꼬리·슬롯, `02_security_audit.py` 슬롯, v3 저장(옛 경로 탭·편집 값 포함)의 `restore` 결과.
- 브라우저: `npm run build` 결과를 `npx vite preview --port 4175 --strictPort`(내가 띄움, PID 3265와 자식 3282·3283)로 서빙. Playwright(`/opt/node22/lib/node_modules/playwright/index.mjs`, 설치된 Chromium, **1000×480**). 스크립트 `<S>/b.mjs`(원인 규명 경로 완주, 과잉 적용 확인, 새로고침, v3 저장 주입), `<S>/c2.mjs`(맨 위로 스크롤한 상태에서 파일을 떠날 때 스크롤 여부). 각 시나리오는 새 브라우저 컨텍스트. 콘솔 error/warning·pageerror 수집.
- UI 변이: `CodeEditor.tsx`의 안내 스크롤 분기를 끈 빌드를 `<S>/dist-mut`에 따로 만들고(소스는 즉시 역편집·바이트 비교로 복원) 포트 4176(PID 3544와 자식 3560·3561)으로 서빙해 `c2.mjs`로 비교.
- 끝난 뒤 내가 띄운 preview 프로세스만 PID로 종료(4175·4176 응답 없음 확인).
- 변이 테스트: 사전 점검 `git status --short` 비어 있음 확인. 검증자는 커밋하지 않으므로 `<S>/bak/`에 `cp` 백업 → `<S>/mut.py`로 정확히 1회 치환(변이) → 집중 테스트(`npx vitest run src/engine src/scenario`) → 역치환 → 백업과 `cmp` 바이트 비교. 모든 변이 후 `cmp` 일치, 최종 `git status --short`는 이 기록 파일만.

## 4. 결과

### 4.1 엔진 (`derive.ts`, `render.ts`)

- 기록: `src/engine/derive.ts:69-71` — 다른 파일의 사건으로 넘어갈 때만 `handoffs.set(from, to)`. 엔딩 분기(`:64-67`)는 기록하지 않으므로 마지막 파일에는 안내가 붙지 않는다. 정확.
- 삽입: `src/engine/render.ts:126-133` — 해결 값 고정·슬롯 계산(`applyEdits`)이 모두 끝난 뒤 마지막으로 도달한 사건 함수의 `functionBlock` 끝 바로 뒤에 같은 들여쓰기로 넣는다. 반환 슬롯은 `currentSceneId`의 것만인데, 안내가 붙는 파일은 현재 사건이 없는 파일이므로 반환 슬롯이 비어 있고, 현재 파일에는 안내가 붙지 않는다. 따라서 **현재 사건의 슬롯 오프셋은 움직일 수 없다**. 덤프로 확인: `02_security_audit.py`의 슬롯 텍스트 `['1']`, 안내 없음.
- 덤프 출력(사건 3개 해결 직후 `01_event_001.py` 꼬리):

  ```python
          notify_security = True

          return notify.security(notify_security)

      def next_file(self):
          # 이 파일의 사건은 여기까지다.
          # 다음 사건 파일이 생성됐다: incidents/02_security_audit.py
          # 왼쪽 Explorer에서 그 파일을 열어 이어서 진행한다.

          return workspace.open("incidents/02_security_audit.py")
  ```

  클래스 안·같은 들여쓰기·값 슬롯 없음. 소형 시나리오(`if __name__` 꼬리 있음)에서는 꼬리 앞에 들어감을 테스트가 단언(`derive.test.ts:157-165`).
- `apply`·`validPrefix`: `replay`의 `validCount` 계산 경로는 바뀌지 않았다(`handoffs`는 렌더 입력일 뿐). 영향 없음.
- 템플릿 원문·시나리오 데이터에 안내 문구가 없고, 문구·경로는 `handoffBlock`(`render.ts:73-81`)이 다음 파일 경로로 만든다. 정본은 진행 기록이며 저장 형식 변경 없음 — 요구 2의 "엔진 생성, 데이터 비저장"과 일치.
- 예약어: `src/scenario/validate.ts:152`가 템플릿의 `def next_file(` 줄을 잡는다.

### 4.2 저장 복원 (v3 → v4)

- 사건 id가 그대로라 v3 진행은 전부 재생된다. 덤프·브라우저 모두: v3 저장(진행 3개, 탭 `main.py, incidents/event_001.py, incidents/security_audit.py`, 활성 `incidents/security_audit.py`, 편집 값 있음) → 진행 3개 유지, 편집 값 `{}`(버전 불일치 규칙), 탭 `['main.py']` 활성 `main.py`, Explorer `01_event_001.py, 02_security_audit.py`, `01` 파일에 안내 함수 있음, 콘솔 오류 0. 진행이 모두 이어지므로 Terminal 안내 줄은 없다(`save.ts:89-93`의 조건대로).
- 옛 경로 탭이 사라지는 것은 버전 규칙이 아니라 "보이지 않는 파일 탭 제외"(`save.ts:35-39` `cleanWorkspace`, SoT §3.6 "아직 해금되지 않은 파일의 탭은 복원하지 않는다") 때문이다 → N4.

### 4.3 편집기 스크롤 (`CodeEditor.tsx`)

- 판정 조건 `CodeEditor.tsx:133`: 엔진 텍스트가 바뀐 모델 중 **이전 기준 문자열에 `def next_file(`이 없고 새 텍스트에 있을 때만** 표시. 기준 문자열에 `revision`이 섞여 있어 이후 매 해결마다 다시 들어오지만, 그때는 이전 기준에도 안내가 있어 다시 표시되지 않는다. 모델 생성 시(처음 열기·새로고침)는 루프 밖이라 표시되지 않는다.
- 실행 `CodeEditor.tsx:208-212`: 같은 파일의 값 스크롤(`revealRef`)이 우선이지만, 안내가 붙는 순간 그 파일에는 현재 사건 슬롯이 없으므로 `slotsRef.current.length === 0` → 안내 줄로 스크롤. 정리: `:83`에서 `revealHandoff.clear()`, 다른 ref와 같은 방식. 오래된 ref 문제 없음.
- 브라우저(1000×480, 원인 규명 경로 완주): 4번의 파일 이동마다 보고 있던 파일 화면에 `def next_file`과 다음 경로가 보임, Explorer는 매번 `01_…`부터 생성 순서, 마지막 `[사건 INC-0214 종결 (원인 규명)]`, 콘솔 오류 0.
- 과잉 적용 없음(새 컨텍스트): `01` 이탈 직후 안내 보임 → `Ctrl+Home`으로 맨 위 → `02`를 처음 열면 값 줄(`target =`)로 스크롤되고 안내 없음 → `02`에서 한 번 해결 → `01` 재열람 시 맨 위 그대로(첫 줄 `from infra import …`, 안내로 다시 스크롤하지 않음).
- 새로고침 후 `01`을 열면 맨 위(자동 스크롤 없음), `Ctrl+End`로 안내 유지 확인. "생길 때 스크롤" 요구와 일치.
- 스크롤이 실제로 이 코드 덕인지: `escalate` 해결 직전 `Ctrl+Home`으로 맨 위(값 줄도 화면 밖)에 둔 뒤 실행 — 원본 빌드(4175) `pointer visible = true`, 안내 스크롤 분기를 끈 변이 빌드(4176) `pointer visible = false`. **브라우저에서만 잡히고 자동 테스트 셀은 없다** → N5.

### 4.4 떠난 파일에서 실행 (`run.ts`)

- `01`에서 `Ctrl+Enter` → `실행할 파일: incidents/02_security_audit.py (현재 탭: incidents/01_event_001.py)`. 안내 함수의 내용과 같은 방향을 가리키므로 자연스럽다. `run.ts`는 바뀌지 않았고 안내 함수는 슬롯이 없어 실행 대상이 될 수 없다.

### 4.5 테스트 양방향성과 변이 결과

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| M1 기록 제거(`handoffs.set` 없음) | `derive.ts:71` | `adds next_file() below…`, `does not add it while…`(뒤 셀의 엔딩 단언 `toHaveLength(1)`) |
| M2 같은 파일 안 이동도 기록(`to !== from` 제거) | `derive.ts:71` | `does not add it while play is still in the file…` |
| M3 파일 끝에 붙임 | `render.ts:132` | `adds next_file() below…`(`if __name__` 앞 단언) |
| M4 들여쓰기 없음 | `render.ts:131` | `adds next_file() below…` |
| M5 첫 번째 도달 함수 아래 | `render.ts:129` | `adds next_file() below…`(`contain` 바로 뒤 정규식) |
| M6 방향 반대(`set(to, from)`) | `derive.ts:71` | 두 셀 모두 |
| M7 예약어 검사 제거 | `validate.ts:152` | `reports reserved next_file()` |
| M8a 마지막 파일만 순번 제거(`05_` → 없음) | `index.ts:34` | **안 깨짐** |
| M8b 가운데 파일 순번 제거(`03_` → 없음) | `index.ts:32` | `list the stage files in play order in the Explorer…` |
| M9 슬롯 앞(함수 위)에 삽입 | `render.ts:132` | `adds next_file() below…` |
| UI: 안내 스크롤 분기 끔 | `CodeEditor.tsx:210` | 자동 셀 없음, 브라우저 비교로만 확인(4.3) |

- M8a가 안 깨지는 이유: `case_report.py`는 `0`으로 시작하는 이름들 뒤로 정렬되어 Explorer 순서가 여전히 맞다. 셀은 "이름 규칙"이 아니라 관찰 가능한 결과(Explorer 순서)를 잠그며, 그 결과가 실제로 유지되므로 결함이 아니다.
- 덜 엄격(기능 제거: M1·M6·M7·M8b)과 지나치게 엄격/과잉 적용(M2·M3·M5·M9) 양쪽 모두 셀이 있다. 슬롯 불변 셀(`leaves the new file's slots where they are`)은 위 변이 어느 것에도 깨지지 않았는데, 이는 설계상 안내가 현재 파일에 붙지 않기 때문이고 M9(슬롯 앞 삽입)는 위치 셀이 막는다.
- 모든 변이 후 `cmp` 바이트 일치로 복원 확인.

### 4.6 명령 결과

- `npm run lint`: 출력 없음(통과).
- `npm test`: `Test Files 12 passed (12)`, `Tests 124 passed (124)`.
- `npm run build`: `✓ built`, 메인 청크 3,021.14 kB(gzip 791.31 kB), 경고 없음.

### 4.7 문서·README

- SoT v0.7 버전 로그(`docs/SOT.md:196`), §3.3(`:80`), §3.4(`:85`), §5.4(`:140-147`), 아키텍처 §5.2(`00_overview.md:118-124`), 데이터 계약 예시(`01_data_contracts.md:57`), 시나리오 문서 표(`incident-0214.md:16-20`), HANDOFF(v0.7, 37줄 — 실제 `wc -l` 37), CHANGELOG — 코드와 일치.
- 옛 경로 잔존: `src/ui/explorer/treeNav.test.ts`(임의 경로 테스트 데이터, 무관), `index.ts:37` 주석(템플릿 원본 파일명 그대로라 정확), `docs/plan/ideation.md:192`(원천 기획, 수정 금지). 문제 없음.
- README(`facfb49`): 명령·Node 버전·배포 절차·실행 규칙(활성 탭) 모두 실제와 일치. "1. Explorer에서 `main.py`를 엽니다"는 새 게임이 이미 `main.py`를 활성 탭으로 열고 시작하므로 불필요한 단계일 뿐 틀린 안내는 아니다.
- `main.py`: `importlib.import_module("incidents.01_event_001")`은 숫자로 시작하는 모듈을 import하는 올바른 Python 방법. 그럴듯함.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **N1 — SoT 내부 불일치(§5.2 P1 목록).** `docs/SOT.md:130` "진행에 따른 기존 파일 내용 변경도 P1이다(DB-01)"는 그대로인데, v0.7은 §3.4(`:85`)에만 예외를 추가했다. 안내 함수는 진행에 따라 이미 열린 파일에 텍스트를 추가하므로 §5.2 문구를 문자 그대로 읽으면 P1 기능이 MVP에 들어간 것으로 읽힌다. 같은 예외 문구를 §5.2에도 달거나 §3.4를 참조하도록 할 것. 마찬가지로 `docs/architecture/00_overview.md:96` "오버레이 범위(MVP)" 목록에 §5.2 안내 함수가 빠져 있다. 같은 줄의 "이미 보인 텍스트는 바뀌지 않는다"는 기존 텍스트를 고치지 않고 아래에 추가만 하므로 문자 그대로는 위반이 아니지만, 범위 목록에 한 항목을 더하는 것이 맞다. (SoT 문구 변경은 §1에 따라 Owner 합의 범위 안에서 — 이미 합의된 내용의 반영이다.)
- **N2 — SoT §3.3 "실행 대상은 항상 가장 마지막 함수다"(`docs/SOT.md:78`).** 떠난 파일의 마지막 함수는 이제 `next_file()`이다. 바로 아래 새 항목(`:80`)이 "실행 대상이 아니다"라고 밝히므로 모순은 해소되지만, `:78`에 "(사건 함수 중)" 정도를 넣으면 더 정확하다. 문구 수준.
- **N3 — `main.py:5` "그 파일 맨 아래에 다음 파일 안내가 붙는다".** 아키텍처 §5.2는 "파일 맨 끝이 아니"라고 명시한다. *Incident 02:14*의 사건 파일에는 모듈 꼬리가 없어 실제로는 맨 아래가 맞으므로 플레이어 안내로는 정확하다. 다른 시나리오로 옮길 때만 주의.
- **N4 — 탭 초기화 근거 오기.** `docs/scenario/incident-0214.md:26`, `docs/daily_logs/2026-10-23/work_log.md:24`가 옛 경로 탭이 "버전 규칙(SoT §3.6)에 따라" 초기화된다고 적었으나, 버전 규칙은 편집 값만 초기화한다. 탭은 해당 경로 파일이 보이지 않아서 `cleanWorkspace`(`src/persistence/save.ts:35-39`)가 뺀다(SoT §3.6 둘째 항목). 결과는 같다. 실제 동작: v3 저장의 활성 탭이 옛 경로였다면 복원 후 `main.py`만 열린 상태로 시작하고 Terminal 안내 줄은 없다(진행은 전부 이어지므로). Explorer와 안내 함수로 찾을 수 있어 실제 피해는 작다.
- **N5 — 안내 스크롤의 자동 테스트 없음.** `CodeEditor.tsx:133`, `:210-211`을 끄는 변이는 테스트 124개를 모두 통과하고 브라우저에서만 드러난다(4.3). 기존 값 스크롤(`revealRef`)도 같은 처지라 이 슬라이스만의 퇴행은 아니며, 판정 조건("이전 기준에 없고 새 텍스트에 있음")을 순수 함수로 빼면 단위 셀로 잠글 수 있다. 선택 사항.
- **N6 — Python 그럴듯함: `workspace`가 정의되지 않은 이름.** `render.ts:80`이 만드는 `return workspace.open("…")`의 `workspace`는 어떤 템플릿에서도 import되지 않는다(예: `src/scenario/incident-0214/event_001.py:1`은 `from infra import alerts, scheduler, notify`). 실제 Python 독자·린터에게는 `NameError`/undefined name으로 보인다. 플레이에는 영향 없음. 문구를 `return "incidents/…"`처럼 바꾸거나 주석만 두는 방식이 더 그럴듯하다. 취향 수준.
- **N7 — "파일은 앞으로만" 가정이 검증되지 않음(잠재).** `derive.ts:34`의 주석 "forward-only, so at most one each"는 **사건** 그래프의 무순환(`validate.ts`, 데이터 계약 §3 `01_data_contracts.md:95`)만 보장되고, **파일** 순서(A→B→A)는 막지 않는다. 사건 a1→b1→a2처럼 파일을 되돌아오는 시나리오에서는 A가 현재 파일인데도 B를 가리키는 안내가 현재 사건 함수 아래에 남고(슬롯 뒤라 오프셋은 안전), 이후 A를 떠나면 안내 대상이 덮어써진다. 순번 파일명도 같은 선형 가정에 기댄다. 현재 두 시나리오에서는 도달 불가. 검증기에 "스테이지는 `stages` 순서대로만 넘어간다" 검사를 넣거나 계약에 가정을 적어 둘 것.

## 6. 판정

**합격** — 차단 문제 없음. N1(SoT §5.2·아키텍처 §5 범위 목록 문구)은 다음 문서 수정 때 같이 고치는 것을 권장한다.

- 요구 1: 사건 파일 5개가 `01_`~`05_` 순번, Explorer 이름순이 곧 생성 순서(테스트·브라우저), 시나리오 `version: 4`.
- 요구 2: 다른 파일로 넘어갈 때만 떠난 파일의 마지막 도달 사건 함수 바로 아래(같은 들여쓰기, 모듈 꼬리 앞)에 슬롯 없는 `next_file()`이 엔진에서 생성되고, 마지막 파일·엔딩에는 붙지 않으며, 생길 때 한 번만 화면 안으로 스크롤된다. `next_file`은 검증기가 예약어로 막는다.
- 현재 사건 슬롯 오프셋 불변, `apply`/`validPrefix` 무영향, v3 저장은 진행 유지·편집 값 초기화로 오류 없이 복원.
- 엔진 셀은 덜 엄격·과잉 적용 양방향 변이에 모두 깨진다.

## 7. 남은 일 (결함 아님)

- 비차단 N1~N7 반영 여부는 작업자/Owner 판단.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(`dist/`는 gitignore, 변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
npx vitest run --root $S --config $S/vitest.config.mjs --silent=false   # 엔진 출력·v3 복원 덤프
git status --short                                   # 변이 전: 비어 있어야 함
cp src/engine/derive.ts src/engine/render.ts src/scenario/validate.ts src/scenario/incident-0214/index.ts $S/bak/
python3 $S/mut.py src/engine/derive.ts "if (to !== from) handoffs.set(from, to)" "void to"   # M1 예시
npx vitest run src/engine src/scenario
python3 $S/mut.py src/engine/derive.ts "void to" "if (to !== from) handoffs.set(from, to)"
cmp src/engine/derive.ts $S/bak/derive.ts
npx vite preview --port 4175 --strictPort &           # 끝나면 이 PID만 종료
node $S/b.mjs                                         # 완주·과잉 적용·새로고침·v3 저장
node $S/c2.mjs http://localhost:4175/                 # 맨 위에서 파일을 떠날 때 스크롤
git status --short                                    # 이 기록 파일만
```
