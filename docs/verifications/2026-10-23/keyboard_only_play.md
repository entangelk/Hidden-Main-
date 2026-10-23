# 키보드만으로 진행(커서 위치·실행 안내·`next_file()` 따라가기) 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: 커밋 `1ba6c12`(HEAD, `43ffa97` 위), 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 31파일 +115/−21
  - 코드: `src/ui/editor/CodeEditor.tsx`, `src/app/run.ts`, `src/app/App.tsx`, `src/engine/derive.ts`·`render.ts`·`types.ts`, `src/scenario/validate.ts`, 사건 템플릿 13개(`.py`)와 `src/app/hub/main.py`
  - 테스트: `src/app/run.test.ts`, `src/engine/derive.test.ts`, `src/scenario/validate.test.ts`, `src/app/hub/hub.test.ts`
  - 기록: `docs/SOT.md`(v0.9), `docs/architecture/00_overview.md`(v0.8)·`01_data_contracts.md`(v0.7), `README.md`, `CHANGELOG.md`, `docs/daily_logs/2026-10-23/work_log.md` §10
- 정본 기준: SoT v0.9 §3.2·§3.3·§3.5, 아키텍처 §3·§5·§5.2, 데이터 계약 `DerivedState.handoffs`. Owner 합의 요구 ① 커서(처음 보일 때·엔진 텍스트가 바뀔 때 현재 사건 첫 값 끝, `main.py`는 `scenario` 끝) ② 값 줄 바로 아래 실행 안내 주석 + 검증 규칙 `RUN_HINT` ③ 떠난 파일에서 `Ctrl+Enter` → 가리키는 파일 열기(진행 불변, Terminal 한 줄)

## 2. 범위

1. 커서 동작: 탭을 오가거나 다른 곳을 클릭한 뒤 커서를 빼앗는지, 해결할 때마다 열린 모든 파일에 적용되는지, `acceptChange`·실행 취소와의 상호작용, 복원·새로고침·시나리오 전환
2. `runScene` 순서(떠난 파일 확인이 엔딩·사건 없음 확인보다 앞) — 엔딩에서, 가리키는 파일이 현재 파일이 아닐 때, Terminal 문구
3. `RUN_HINT` 검증 규칙(여러 필드, 함수 끝의 값 줄, 오탐·미탐)
4. 템플릿 수정이 슬롯·줄 번호·Traceback·선택지 검사를 깨지 않았는지
5. 문서·SoT 정합성(옛 문구 "실행 대상이 아니다", R-05 등)
6. 명령, 변이, 키보드만 쓰는 브라우저 플레이

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-keys`

- 전체 diff와 `CodeEditor.tsx`의 기존 `revealRef`·`baseRef` 흐름 읽기.
- `RUN_HINT` 경계 사례: `<S>/rh.test.ts`를 별도 설정(`<S>/vc.mjs`, 저장소 수정 없음)으로 실행 — mini 시나리오 복제본의 `write_report` 템플릿을 바꿔 `staticProblems` 결과 확인.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 1회 치환(K6은 두 줄 이동) → `npx vitest run src` → 백업으로 복원 → `cmp`. 커밋하지 않음.
- 편집기 변이: `CodeEditor.tsx`에서 `editor.setPosition(end)` 줄을 지운 빌드를 `<S>/dist-E1`에 만들고 소스는 즉시 복원·`cmp`.
- 브라우저: 원본 `dist`를 `npx vite preview --port 4201 --strictPort`(내 PID 2712·자식 2745·2746), 변이 빌드를 4202(PID 2714·자식 2738·2739)로 서빙. Playwright(설치된 Chromium, **1000×480**). `<S>/k.mjs`(Owner의 `keys.mjs`를 참고해 새로 씀): 로비부터 *Thermal Drift* 엔딩까지 값 입력과 `Ctrl+Enter`는 키보드로만 하고, 커서 빼앗기 확인을 위해서만 일부러 마우스로 다른 줄·탭을 클릭. 커서 위치는 `.cursors-layer .cursor`의 `top`과 같은 `top`의 `.view-line` 텍스트로 판정. `<S>/k2.mjs`: `main.py`의 커서가 다른 파일의 해결 뒤 어떻게 되는지. 콘솔 error/warning·pageerror 수집. 끝난 뒤 내 PID만 종료, 4201·4202 응답 없음 확인.

## 4. 결과

### 4.1 커서 (`CodeEditor.tsx`)

- 구현: 기존 "보일 때 값 줄로 스크롤" 분기(`CodeEditor.tsx:206-211`)에 `editor.setPosition(slot[0].end)`를 더했다. 이 분기는 `revealRef`에 그 파일이 있을 때만 실행되고, `revealRef`는 (a) 모델을 처음 만들 때(`:187`), (b) 엔진 기준 키가 바뀐 모델(`:136`)에 들어간다. 기준 키는 `revision + 엔진 텍스트`(`:127`)라 **어느 사건이든 해결하면 열린 모든 모델이 대상**이 된다. 다만 커서를 옮기는 것은 현재 사건 슬롯이 있는 파일(현재 사건 파일, `main.py`)뿐이고, 떠난 파일·설정 파일은 슬롯이 없어 기존 안내 스크롤 분기로 간다.
- 브라우저(원본, 키보드만):
  1. 로비: 커서 `scenario = 1` 끝 → `Backspace`, `2`, `Ctrl+Enter` → `01_temp_alarm.py` 활성, 커서 `action = 1` 끝.
  2. 해결 직후 `Ctrl+Z`: 텍스트 변화 없음 — `setPosition`은 편집을 만들지 않고, 모델 재작성(`setValue`)이 실행 취소 기록을 비운 상태 그대로.
  3. `action` 해결 → 같은 파일에 추가된 `inspect_unit`의 `unit = "CRAC-1"` 끝으로 이동.
  4. **빼앗기 없음**: 마우스로 `return crac.status(unit)` 줄 클릭 → Explorer에서 `config/facility.py` 열기 → `01` 탭으로 복귀: 커서는 클릭한 줄 그대로(해결이 없었으므로 `revealRef`에 없음, 저장된 view state 복원).
  5. `unit` 해결 → 파일을 떠남: 커서는 방금 해결한 값 줄에 남고, 화면은 `next_file()`까지 보임.
  6. 그 자리에서 `Ctrl+Enter` → `02_unit_control.py` 열림·활성, 커서 `resume = False` 끝, Terminal `[workspace] cooling/01_temp_alarm.py: next_file() → cooling/02_unit_control.py`.
  7. 이후 `resume` → `days`, `02` → `main.py` → `02`(해결 없음)에서 커서 `days = 1` 유지, 새로고침 후 활성 `02`·커서 `days = 1` 끝, `03` 진입 시 `action = 1` 끝, 엔딩 `사건 INC-0340 종결 (원인 규명)`까지 키보드만으로 진행. 콘솔 오류 0.
- 변이 빌드(E1, `setPosition` 없음): 로비에서 커서가 맨 위(0행)에 있어 `Backspace`·`2`가 슬롯 밖 입력으로 거부되고 `Ctrl+Enter`가 기본값 1(*Incident 02:14*)을 고름 — 요구 ①이 실제로 이 줄에 달려 있음을 확인.
- `main.py`(`k2.mjs`): `main.py`를 연 뒤 다른 줄을 클릭하고 사건 파일로 가서 **한 번 해결**한 다음 `main.py`로 돌아오면 커서가 `scenario = 2` 끝으로 옮겨진다. 두 번째 해결 뒤(목록의 상태 문구가 그대로라 `main.py` 엔진 텍스트가 같아도)도 마찬가지 → 비차단 N1.

### 4.2 `runScene` (`run.ts:54-56`)

- 순서: 떠난 파일 확인이 "사건 없음"(엔딩)과 "실행할 파일" 안내보다 앞이다. SoT §3.5 예외("활성 탭이 `next_file()` 안내가 붙은 파일이면 … 안내된 파일을 열고")는 엔딩 여부를 가리지 않으므로 이 순서가 문서와 맞다. 브라우저: 엔딩 뒤 `02`에서 `Ctrl+Enter` → `03` 열림(`… next_file() → cooling/03_rack_audit.py`), 마지막 파일 `03`에서는 `처리할 사건이 없습니다.`
- 가리키는 파일이 현재 파일이 아닐 때(예: 01→02→03 진행 뒤 `01`에서 실행): `02`가 열리고, 거기서 다시 누르면 `03` — 한 칸씩 앞으로 간다. 진행은 바뀌지 않으므로 무해하고, 문구가 어느 파일로 가는지 밝힌다.
- 진행 불변: `open` 결과는 `progress` 없이 돌아오고 App은 `open()`만 부른다(`App.tsx` `run`). 저장 효과도 진행 쪽은 실행되지 않는다.

### 4.3 `RUN_HINT` 검증 규칙 (`validate.ts:175-177`)

`<S>/rh.test.ts` 결과(mini `write_report` 변형):

| 변형 | 결과 |
| --- | --- |
| 원본 | 문제 없음 |
| 값 줄과 안내 사이 빈 줄 | `run hint missing` (SoT "바로 아래"와 일치) |
| 안내 들여쓰기만 다름 | 통과(`trim`) — 화면상 무해 |
| 안내 뒤에 글자 추가 | `run hint missing` |
| 값 줄 끝에 주석(`action = 1  # 1~2`) | 통과 |
| 필드 2개, 안내가 첫 필드 아래만 | `run hint missing` |
| 필드 2개, 안내가 마지막 필드 아래 | 통과 |
| 안내 삭제 | `run hint missing` |

- 오탐 가능성: `functionBlock`은 마지막 코드 줄 뒤의 주석을 본문에 넣지 않으므로, 값 줄이 함수의 마지막 코드 줄이면 바로 아래 안내가 있어도 "없음"으로 잡힌다. 모든 사건에 `return`이 있어 현재는 해당 없음.
- 템플릿 13개와 `main.py`에 안내가 있고 테스트 147개 통과(줄 번호를 단언하는 Traceback 셀 포함 — 안내는 값 줄 **아래**라 그 위 줄 번호는 그대로). 선택지 설명 검사(`optionProblems`)·슬롯 검사 모두 통과.

### 4.4 문서

- SoT v0.9: §3.2 커서·안내 주석(`SOT.md:75-76`), §3.3 `next_file()` 문구에서 "실행 대상이 아니다"를 지우고 §3.5 참조, §3.5 예외 항목, 버전 로그 — 코드와 일치.
- 아키텍처 §3 단계 목록에 떠난 파일 분기, §5 커서 규칙과 이력, §5.2, 계약의 `handoffs` — 일치. 남은 낡은 문장은 N3.

### 4.5 변이 결과

단위(`npx vitest run src`, 147개):

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| K1 떠난 파일 따라가기 끔 | `run.ts:56` | `follows next_file() from a file play has left, and only from there` |
| K2 과잉: 어느 파일에서든 첫 안내를 따라감 | `run.ts:55` | 위 셀 + `after an ending only prints a notice` |
| K3 `handoffs` 비움 | `derive.ts` | 위 셀 + `lists the pointer in handoffs…` |
| K4 안내 검사 끔 | `validate.ts:177` | `reports run hint missing` |
| K5 안내를 첫 필드 아래에서 찾음(`max`→`min`) | `validate.ts:175` | **안 깨짐** — 필드가 2개 이상인 사건이 시나리오에도 검증 테스트에도 없다(4.3의 경계 실험으로만 확인) → N2 |
| K6 떠난 파일 확인을 "사건 없음" 확인 뒤로 | `run.ts:54-56` | **안 깨짐** — 엔딩 뒤 떠난 파일에서의 실행을 단언하는 셀이 없다 → N2 |

편집기(빌드 + 브라우저):

| 변이 | 위치 | 원본과 다른 관찰 |
| --- | --- | --- |
| E1 `setPosition` 제거 | `CodeEditor.tsx:209` | 로비에서 커서가 0행, 키보드 입력이 슬롯 밖이라 거부되어 엉뚱한 시나리오 선택(4.1) |

- 모든 변이 후 `cmp` 일치. 최종 `git status --short`는 이 기록 파일만.

### 4.6 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 147 passed (147)`.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **N1 — `main.py` 커서가 해결할 때마다 되돌아감.** 기준 키에 `revision`이 들어 있어(`CodeEditor.tsx:127`, `:136`) 어느 파일에서든 사건을 해결하면 열린 `main.py`도 `revealRef`에 들어가고, 다음에 `main.py`를 보일 때 커서가 `scenario` 값 끝으로 옮겨진다 — `main.py` 엔진 텍스트가 그대로여도. 재현: `main.py`에서 `return workspace.load…` 줄 클릭 → 사건 파일에서 한 번 해결 → `main.py` 탭 → 커서가 `scenario = 2` 끝. SoT §3.2(`SOT.md:75`)의 "처음 보이거나 새 사건 함수가 추가되면"보다 넓다. 키보드만 쓰는 플레이에는 오히려 편하고 데이터 영향은 없으므로 비차단. 의도라면 SoT 문구를 "엔진 쪽 내용이나 진행이 바뀐 뒤 처음 보일 때"로 맞추고, 아니라면 `main.py`는 엔진 텍스트가 바뀔 때만 넣을 것.
- **N2 — 새 규칙 두 갈래가 테스트로 잠기지 않음.** (a) `RUN_HINT`의 "마지막 필드 아래" 규칙(K5): 필드가 여러 개인 사건이 없어 `max`→`min` 변이가 살아남는다. `validate.test.ts`에 필드 2개 사례를 하나 두면 잠긴다. (b) 엔딩 뒤 떠난 파일에서 `Ctrl+Enter`(K6): 지금 동작(파일 열기)이 SoT §3.5 예외와 맞지만, 순서를 바꿔도 테스트가 통과한다. `run.test.ts`에 엔딩 상태의 떠난 파일 사례를 하나 두면 잠긴다.
- **N3 — 아키텍처 낡은 문장 2곳.** `docs/architecture/00_overview.md:69` "다른 탭에서 누르면 1단계에서 안내만 하므로" — 떠난 파일 예외가 같은 절 단계 목록에는 있으나 이 문장에는 없다. `:177` "모델을 다시 쓸 때 … 커서·스크롤은 유지"는 바로 뒤 커서 이동 규칙(`:115`)과 겉보기에 어긋난다(재작성 자체는 유지하고 그 뒤 §5 규칙이 옮긴다는 뜻이면 그렇게 적을 것). `:115`가 "애니메이션 없음"의 근거로 R-05(해금 연출 규칙)를 드는 것은 기존 인용으로 이번 변경과 무관.
- **N4 — 사소.** `RUN_HINT`는 앞뒤 공백을 무시하므로 들여쓰기가 틀린 안내도 통과한다(화면상 거의 무해). 값 줄이 함수의 마지막 코드 줄이면 안내가 있어도 "없음"으로 잡히는 오탐 가능성(현재 해당 사건 없음).

## 6. 판정

**합격** — 차단 문제 없음.

- 요구 ①: 처음 보일 때·같은 파일에 함수가 추가될 때 커서가 현재 사건 첫 값 끝에 놓이고 화면 안으로 들어온다(작은 창 1000×480). 탭을 오가거나 다른 줄을 클릭한 뒤 해결 없이 돌아오면 커서를 빼앗지 않는다. 새로고침·시나리오 전환 뒤에도 같은 위치. 실행 취소와 충돌 없음. `main.py`만 해결마다 되돌아가는 차이가 있다(N1).
- 요구 ②: 모든 사건 템플릿과 `main.py`에 안내가 있고, 검증 규칙이 빠짐·빈 줄·잘못된 위치를 잡는다.
- 요구 ③: 떠난 파일에서 `Ctrl+Enter`가 가리키는 파일을 열고 진행은 그대로, Terminal 한 줄. 엔딩 뒤에도 같다.
- 로비부터 엔딩까지 마우스 없이 진행 가능(값 입력은 `Backspace`+타이핑, 파일 이동은 `next_file()`에서 `Ctrl+Enter`).

## 7. 남은 일 (결함 아님)

- N1~N4 반영 여부는 작업자/Owner 판단.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-keys
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
npx vitest run --root $S --config $S/vc.mjs --silent=false     # RUN_HINT 경계 사례
git status --short                                   # 변이 전: 비어 있어야 함
cp src/app/run.ts src/engine/derive.ts src/scenario/validate.ts src/ui/editor/CodeEditor.tsx $S/bak/
python3 $M src/scenario/validate.ts "const lastField = Math.max(" "const lastField = Math.min("   # K5 예시
npx vitest run src
cp $S/bak/validate.ts src/scenario/validate.ts && cmp src/scenario/validate.ts $S/bak/validate.ts
npx vite preview --port 4201 --strictPort &           # 끝나면 이 PID만 종료
node $S/k.mjs http://localhost:4201/ ; node $S/k2.mjs http://localhost:4201/
git status --short                                    # 이 기록 파일만
```
