# 첫 플레이 피드백 반영(파일 순번·`next_file()`) 재검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 1차 검증자와 같음, 보강 작업은 하지 않음)
- 대상: 커밋 `8a22a42`(HEAD, `3297b74` 위), 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 15파일 +230/−15
  - 코드: `src/engine/render.ts`, `src/scenario/validate.ts`, `src/ui/editor/handoffReveal.ts`(신규), `src/ui/editor/CodeEditor.tsx`, `src/scenario/incident-0214/main.py`
  - 테스트: `src/ui/editor/handoffReveal.test.ts`(신규), `src/scenario/validate.test.ts`, `src/scenario/scenarioData.test.ts`, `src/engine/derive.test.ts`
  - 기록: `docs/SOT.md`, `docs/architecture/00_overview.md`, `docs/scenario/incident-0214.md`, `docs/daily_logs/2026-10-23/work_log.md` §5, `README.md`, 1차 검증 기록(커밋에 포함 — 내용이 1차 검증자 작성본과 바이트 동일함을 `diff`로 확인)
- 1차 기록: [`feedback_file_order_and_next_file.md`](feedback_file_order_and_next_file.md)(합격, 비차단 N1~N7 + `05_` 변이 생존 + README 1단계)

## 2. 범위

1. N1~N7, `05_` 변이, README 지적 각각의 보강이 정확하고 완전한지(작업 로그 §5 대응표 기준)
2. 보강이 만든 회귀·새 불일치(새 검증 규칙, `handoffReveal.ts`, `render.ts` 반환 줄)
3. `npm run lint`, `npm test`, `npm run build`
4. 새 가드 변이 테스트
5. 짧은 브라우저 재확인

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile`

- `git show 8a22a42` 전체 diff 읽기, 인용 줄 번호 확인.
- 새 검증 규칙의 실제 표적(무순환 파일 재방문)은 저장소 테스트 케이스가 순환도 함께 만들기 때문에(4.1), `<S>/back.test.ts`를 별도 설정(`<S>/vitest.back.mjs`, 저장소 수정 없음)으로 실행해 따로 확인.
- 변이: 사전 `git status --short` 비어 있음 확인 → `<S>/bak2/`에 `cp` 백업 → `<S>/mut.py`로 정확히 1회 치환 → `npx vitest run src` → 역치환 → 백업과 `cmp` 바이트 비교. 커밋하지 않음.
- 브라우저: 새 `npm run build` 결과를 `npx vite preview --port 4175 --strictPort`(내가 띄움, PID 5707·자식 5721·5722, 끝난 뒤 이 PID만 종료, 이후 4175 응답 없음 확인). Playwright 1000×480, 1차의 `<S>/b.mjs`(안내 반환 줄 기대 문자열만 새 형식으로 바꿈)와 `<S>/c2.mjs` 재실행.

## 4. 결과

### 4.1 지적별 보강 확인

| 지적 | 보강 위치 | 판정 |
| --- | --- | --- |
| N1 SoT §5.2 예외·아키텍처 오버레이 범위 | `docs/SOT.md:130` "단, §3.3의 다음 파일 안내 함수는 예외다(v0.7)", 버전 로그 `:196`에 "§5.2 예외" 추가; `docs/architecture/00_overview.md:96` 범위에 안내 함수 추가 + "모두 텍스트를 끼워 넣기만 하며, 이미 보인 텍스트는 바뀌지 않는다" | 해소. §3.4(`:85`)와 §5.2가 같은 예외를 말해 SoT 내부 모순 없음 |
| N2 "가장 마지막 함수" | `docs/SOT.md:78` "가장 마지막 **사건** 함수다(아래 안내 함수는 사건이 아니다)" | 해소 |
| N3 `main.py` "맨 아래" | `src/scenario/incident-0214/main.py:5` "마지막 사건 함수 아래에 다음 파일 안내(next_file)가 붙는다" | 해소. 아키텍처 §5.2와 일치 |
| N4 탭 초기화 근거 | `docs/scenario/incident-0214.md:26`, `work_log.md:24` — 편집 값은 버전 규칙, 탭은 `cleanWorkspace`. 활성 탭이 옛 경로면 `main.py`가 활성이 된다고 명시 | 해소. 브라우저 v3 주입 결과(탭 `['main.py']`, 활성 `main.py`)와 일치 |
| N5 스크롤 자동 테스트 없음 | `src/ui/editor/handoffReveal.ts`의 `gainedHandoff`, `CodeEditor.tsx:131`에서 사용, `handoffReveal.test.ts` 양방향 셀 | 해소(판단 조건). 호출 연결 자체는 여전히 브라우저로만 확인 — 4.3 |
| N6 `workspace` 미정의 | `src/engine/render.ts:80` `return "<경로>"`, `derive.test.ts:160` 갱신 | 해소. 순수 문자열 반환이라 Python으로 그럴듯함 |
| N7 파일 단위 앞으로만 | `src/scenario/validate.ts:204-215` 새 검사, `validate.test.ts:61`, 아키텍처 §5.2 `00_overview.md:124` | 해소. 아래 상세 |
| `05_` 변이 생존 | `scenarioData.test.ts:34` 순번 접두사 단언 | 해소(R7) |
| README 1단계 | `README.md:9` "처음 열려 있는 `main.py`의 사용법을 읽고, `incidents/01_event_001.py` 탭으로 옮깁니다" | 해소. 새 게임은 두 탭을 열고 `main.py`가 활성(`App.tsx:17` `freshWorkspace`) |

N7 상세:

- 규칙: 전이 대상 사건의 스테이지 인덱스가 출발 사건의 것보다 작으면 문제. 같은 스테이지·뒤 스테이지(건너뛰기 포함)는 허용.
- 실제 표적인 **무순환 재방문** 확인(`<S>/back.test.ts`): *Incident 02:14* 복제본에서 `schedule→audit`, `preserve→escalate`, `escalate→power`로 바꾸면(사건 그래프는 무순환) `staticProblems`가 `preserve: goes back to an earlier stage file (escalate)`를 보고하고 `cycle` 메시지는 없음. 1→3 스테이지 건너뛰기(`escalate→power`만)는 문제 0개.
- *Incident 02:14*·mini 모두 새 규칙 통과(`npm test`).

### 4.2 회귀·새 불일치 점검

- `render.ts:80` 반환 줄 변경은 슬롯 계산 뒤 삽입 블록 안의 문구만 바꾼 것이라 오프셋·위치 규칙에 영향 없음. `HANDOFF_DEF`(`def next_file(`)는 그대로라 편집기 판정과 맞음.
- `CodeEditor.tsx`: 상수와 판정 식을 `handoffReveal.ts`로 옮겼을 뿐 의미 동일(`text.includes(DEF) && !previous?.includes(DEF)`). 엔진 → UI 방향 import(`handoffReveal.ts:1`)는 기존과 같은 방향.
- 데이터 계약 `01_data_contracts.md:95`는 여전히 사건 단위 "앞으로만"만 적는다. 파일 단위 규칙은 아키텍처 §5.2(`00_overview.md:124`)에 있고 서로 모순은 아니다(아래 비차단 R-N2).
- 문서 링크: 작업 로그 §5의 1차 기록 링크(`../../verifications/2026-10-23/…`) 경로 유효.

### 4.3 브라우저 재확인 (1000×480, 새 빌드)

- 원인 규명 경로 완주: 파일 이동 4번 모두 보고 있던 파일 화면에 안내 표시, Explorer `01_`~`05_` 생성 순서, 엔딩 `사건 INC-0214 종결 (원인 규명)`.
- 과잉 적용 없음: `01` 이탈 후 맨 위로 → `02` 처음 열기는 값 줄로 스크롤·안내 없음 → `02`에서 해결 → `01` 재열람 시 맨 위 유지.
- 맨 위에 둔 상태에서 `01`을 떠나면 안내 줄로 스크롤됨(`pointer visible = true`) — `CodeEditor.tsx:131`의 연결이 실제로 동작.
- 떠난 파일에서 실행: `실행할 파일: incidents/02_security_audit.py (현재 탭: incidents/01_event_001.py)`.
- 새로고침 후 안내 유지(`return "incidents/02_security_audit.py"`), v3 저장 복원 정상, 콘솔 error/warning·pageerror 0.

### 4.4 변이 결과

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| R1 되돌아감 검사 끔(`&& false`) | `validate.ts:211` | `reports back to an earlier file` |
| R2 과잉: 다른 스테이지로 가는 전이 모두 거부(`<` → `!==`) | `validate.ts:211` | mini·Incident 02:14 통과 셀, 수치 조건 탐색 셀(3개) |
| R3 과잉: 같은 스테이지도 거부(`<` → `<=`) | `validate.ts:211` | 위와 같은 3개 |
| R4 매 해결마다 스크롤(이전 텍스트 검사 제거) | `handoffReveal.ts:7` | `is false when the pointer was already there…` |
| R5 스크롤 안 함(`return false`) | `handoffReveal.ts:7` | `is true when the pointer first appears…` |
| R6 안내 존재 검사 제거 | `handoffReveal.ts:7` | `is false when the pointer was already there or is absent…` |
| R7 `05_` 접두사 제거(1차에서 생존) | `index.ts:34` | `list the stage files in play order…`(새 접두사 단언) |
| R8 옛 반환 줄 복원(`workspace.open(...)`) | `render.ts:80` | `adds next_file() below…` |

- 덜 엄격(R1·R5·R7·R8)과 지나치게 엄격(R2·R3·R4·R6) 양쪽 모두 셀이 깨진다. 모든 변이 후 `cmp` 바이트 일치.

### 4.5 명령 결과

- `npm run lint`: 출력 없음(통과).
- `npm test`: `Test Files 13 passed (13)`, `Tests 127 passed (127)` — 작업 로그 §5의 "127개"와 일치.
- `npm run build`: `✓ built`, 메인 청크 3,021.22 kB(gzip 791.38 kB), 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **R-N1 — 저장소 안 N7 테스트 케이스가 순환도 함께 만든다.** `src/scenario/validate.test.ts:61`의 `report → contain`은 `contain → report`와 순환을 이루므로, 이 케이스는 "무순환이지만 파일을 되돌아가는" 본래 표적을 단독으로 보여 주지 않는다. 셀은 새 메시지를 정확히 기대하므로 R1에는 깨지고, 무순환 표적도 4.1에서 확인했으므로 결함은 아니다. 무순환 케이스(mini에서 가능하지 않다면 *Incident 02:14* 복제본)로 바꾸면 의도가 더 분명해진다.
- **R-N2 — 파일 단위 "앞으로만" 규칙이 데이터 계약에는 없다.** `docs/architecture/01_data_contracts.md:95`는 사건 단위만 적고, 파일 단위는 `00_overview.md:124`에만 있다. 모순은 아니며 시나리오 작성자가 읽을 곳이 한 군데 더 늘었을 뿐이다. 계약 §3에 한 줄 참조를 두면 충분.
- **R-N3 — 사소.** 새 검사는 같은 전이 조건이 여러 개면 같은 메시지를 전이 수만큼 반복한다(4.1 실험에서 2회). `scenarioData.test.ts:34`의 `0${i + 1}`은 스테이지 10개 이상이면 맞지 않는다(현재 5개). 둘 다 동작 문제 없음.
- `CodeEditor.tsx:131`의 **호출 연결**은 여전히 자동 셀이 없고 브라우저로만 확인된다(4.3). 판단 조건은 단위 셀로 잠겼으므로 1차 N5의 요지는 해소된 것으로 본다.

## 6. 판정

**합격** — 1차 비차단 N1~N7, `05_` 변이 생존, README 1단계가 모두 정확히 보강되었고, 보강으로 인한 회귀는 없다. 새 가드(되돌아감 검사, `gainedHandoff`, 순번 접두사, 반환 줄)는 양방향 변이에 모두 깨진다. 남은 R-N1~R-N3은 표현·테스트 의도 수준이며 병합을 막지 않는다.

## 7. 남은 일 (결함 아님)

- R-N1~R-N3 반영 여부는 작업자 판단.
- PR 생성·Owner 병합 후 배포 주소에서 확인, Owner 플레이 테스트(AC-10, R-07).
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나.

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
npx vitest run --root $S --config $S/vitest.back.mjs --silent=false   # 무순환 파일 재방문 검사
git status --short                                   # 변이 전: 비어 있어야 함
cp src/scenario/validate.ts src/ui/editor/handoffReveal.ts src/scenario/incident-0214/index.ts src/engine/render.ts $S/bak2/
python3 $S/mut.py src/ui/editor/handoffReveal.ts "return text.includes(HANDOFF_DEF) && !previousText?.includes(HANDOFF_DEF)" "return false"   # R5 예시
npx vitest run src
python3 $S/mut.py src/ui/editor/handoffReveal.ts "return false" "return text.includes(HANDOFF_DEF) && !previousText?.includes(HANDOFF_DEF)"
cmp src/ui/editor/handoffReveal.ts $S/bak2/handoffReveal.ts
npx vite preview --port 4175 --strictPort &           # 끝나면 이 PID만 종료
node $S/b.mjs && node $S/c2.mjs http://localhost:4175/
git status --short                                    # 이 기록 파일만
```
