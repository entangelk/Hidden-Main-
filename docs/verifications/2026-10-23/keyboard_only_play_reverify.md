# 키보드만으로 진행 재검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 1차 검증자와 같음, 보강 작업은 하지 않음)
- 대상: `git diff 1ba6c12..HEAD`(HEAD `fce72ac`; 보강 `323936a`, 기록 `fce72ac`), 브랜치 `claude/compassionate-ramanujan-qoaiw1`
  - 코드: `src/ui/editor/CodeEditor.tsx`, `src/scenario/validate.ts`
  - 테스트: `src/scenario/validate.test.ts`(3개), `src/app/run.test.ts`(엔딩 뒤 안내 따라가기)
  - 기록: `docs/architecture/00_overview.md` §3·§5·§6, `docs/daily_logs/2026-10-23/work_log.md` §11, 1차 검증 기록(커밋에 포함 — 1차 검증자 작성본과 바이트 동일함을 `diff`로 확인)
- 1차 기록: [`keyboard_only_play.md`](keyboard_only_play.md)(합격, 비차단 N1~N4)

## 2. 범위

1. N1~N4 보강의 정확성(작업 로그 §11 대응표 기준)
2. 회귀: 커서가 옮겨 가야 할 때 옮겨 가는지 — 같은 파일의 다음 함수, 안내로 연 새 파일, 시나리오 전환, 새로고침. `main.py`는 상태 문구가 바뀔 때(첫 해결 새 게임→진행 중, 엔딩) 텍스트가 바뀌므로 그때 이동하는 것은 정상
3. `npm run lint`, `npm test`, `npm run build`
4. 새 가드 변이, 짧은 브라우저 확인

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-keys2`

- diff 전체 읽기. `CodeEditor.tsx`의 기준 키 형식(`${revision}\n${text}`, `revision`은 숫자라 첫 `\n`이 구분자)과 새 조건 확인.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 치환(K6은 두 줄 이동) → `npx vitest run src` → 백업 복원 → `cmp`. 커밋하지 않음.
- 편집기 변이: `CodeEditor.tsx:138`을 바꾼 빌드 2개(`<S>/dist-E2`, `<S>/dist-E3`), 소스는 즉시 복원·`cmp`.
- 브라우저: 원본 `dist`·E2·E3을 `npx vite preview --port 4211/4212/4213 --strictPort`(내 PID 5131·5133·5135와 자식들)로 서빙. Playwright(설치된 Chromium, 1000×480). `<S>/r.mjs`: *Unlogged Run*을 키보드로 진행하면서 일부러 마우스로 다른 줄을 클릭해 두고, 해결·탭 전환·새로고침·시나리오 전환 뒤 커서 줄(`.cursors-layer .cursor`의 `top`과 같은 `.view-line`)을 기록. 끝난 뒤 내 PID만 종료, 4211~4213 응답 없음 확인.

## 4. 결과

### 4.1 지적별 보강 확인

| 지적 | 보강 | 판정 |
| --- | --- | --- |
| N1 해결마다 `main.py` 커서 복귀 | `CodeEditor.tsx:138` 이전 기준에서 엔진 텍스트 부분만 떼어 새 텍스트와 다를 때만 `revealRef`에 넣음 | 해소(4.2) |
| N2 K5·K6이 테스트로 잠기지 않음 | `validate.test.ts` 두 필드 거부·허용 셀, `run.test.ts` 엔딩 뒤 떠난 파일 `open`·마지막 파일 안내 | 해소(4.3 V1·K6) |
| N3 아키텍처 낡은 문장 | `00_overview.md` §3 실행 대상 문단에 떠난 파일 예외, §5 커서 규칙에 "진행 번호만 바뀐 재작성은 해당하지 않음", §6 재작성 문단에 "텍스트 자체가 바뀐 경우에만 §5 규칙대로 커서 이동" | 해소. 코드와 일치 |
| N4 들여쓰기 무시·마지막 코드 줄 오탐 | `validate.ts:179-180` 템플릿에서 값 줄 다음 줄을 값 줄과 같은 들여쓰기 + 안내와 정확히 비교 | 해소(4.3 V2·V3) |

### 4.2 커서 회귀 확인 (브라우저, 원본)

| 단계 | 커서 |
| --- | --- |
| a `main.py`에서 3번 선택 | `01_scheduler.py`, `action = 1` 끝 |
| b `main.py` 탭, `return workspace.load…` 클릭 | 그 줄 |
| c `01`에서 해결(같은 파일에 다음 함수) | `account = "kim.jh"` 끝 — **이동함** |
| d `main.py` 복귀(상태 새 게임→진행 중으로 텍스트 바뀜) | `scenario = 3` 끝 — 정상 이동 |
| e `01`을 떠난 뒤 `return audit.jobs_by` 클릭 | 그 줄 |
| f 그 자리에서 `Ctrl+Enter` → `02` 열림 | `chamber = 1` 끝 — **이동함** |
| g `02`에서 해결 뒤 `main.py`(상태 그대로) | 클릭해 둔 `return workspace.load…` — **유지** (1차 N1 해소) |
| h 떠난 `01` 복귀 | 클릭해 둔 `return audit.jobs_by…` — 유지 |
| i `02` 복귀 | `scan = False` 끝(해결로 추가된 다음 함수) |
| j 새로고침 | `02`, `scan = False` 끝 |
| k 2번으로 전환 | `01_temp_alarm.py`, `action = 1` 끝 |
| l 3번으로 복귀 | `02_chamber.py`, `scan = False` 끝 |

콘솔 error/warning·pageerror 0. 엔딩 때 `main.py` 상태 문구(진행 중→완료)가 바뀌면 같은 규칙으로 이동한다(코드 경로가 d와 같음).

### 4.3 변이 결과

단위(`npx vitest run src`, 150개):

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| V1 첫 필드 기준(`max`→`min`, 1차 K5) | `validate.ts:175` | `reports run hint under the first of two fields only`, `accepts the run hint under the last of two fields…` |
| V2 다시 `trim` 비교 | `validate.ts:180` | `reports run hint indented differently` |
| V3 템플릿 대신 함수 본문에서 읽기(옛 방식) | `validate.ts:179` | `accepts … right after the last code line` |
| V4 검사 끔 | `validate.ts:180` | 거부 셀 3개 |
| K6 떠난 파일 확인을 "사건 없음" 뒤로(1차에서 생존) | `run.ts:54-56` | `follows next_file() from a file play has left, and only from there` |

편집기(빌드 + 브라우저, 4.2와 같은 스크립트):

| 변이 | 위치 | 원본과 다른 관찰 |
| --- | --- | --- |
| E2 옛 동작(해결마다 항상 넣음) | `CodeEditor.tsx:138` | g에서 커서가 `scenario = 3`으로 되돌아감 |
| E3 과잉: 처음 만들 때만 넣음 | `CodeEditor.tsx:138` | c(같은 파일 다음 함수)·d·i에서 커서가 안 옮겨 감 — c는 `action = 1`에 남음 |

- 덜 엄격(V2·V3·V4·K6·E2)·지나치게 엄격(V1·E3) 양방향 모두 드러난다. 모든 변이 후 `cmp` 일치, 최종 `git status --short`는 이 기록 파일만.

### 4.4 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 150 passed (150)` — 작업 로그 §11과 일치.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **R-N1 — SoT §3.2 문구가 구현보다 좁다.** `docs/SOT.md:75` "파일을 처음 보이거나 새 사건 함수가 추가되면"인데, 구현·아키텍처 §5는 "엔진 텍스트가 바뀌면"이라 `main.py` 상태 문구가 바뀔 때(첫 해결, 엔딩)도 커서가 `scenario`로 옮겨 간다. 이번 요청에서 정상으로 본 동작이고 해도 없으나, SoT에 한 마디("`main.py`는 목록 상태가 바뀔 때도") 더하면 문서와 코드가 같아진다. SoT 변경은 §1에 따라 Owner 합의가 필요하다.
- **R-N2 — 편집기 커서 조건은 브라우저로만 잠김.** `CodeEditor.tsx:138`의 조건은 E2·E3처럼 브라우저 스크립트로만 드러나고 단위 셀이 없다(1차 `gainedHandoff`처럼 순수 함수로 빼면 잠글 수 있다). 기존 편집기 판단들과 같은 처지라 참고 사항.
- **R-N3 — 사소.** `validate.ts:180`의 정확 비교는 템플릿이 CRLF거나 안내 줄 끝에 공백이 있으면 "없음"으로 본다(렌더는 CRLF를 LF로 바꿈). `.gitattributes`가 `.py`를 LF로 고정하므로 현재는 해당 없음.

## 6. 판정

**합격** — 1차 비차단 N1~N4가 모두 정확히 보강되었고 회귀는 없다. 커서는 같은 파일의 다음 함수, 안내로 연 새 파일, 새로고침, 시나리오 전환에서 현재 값으로 옮겨 가고, 텍스트가 그대로인 `main.py`·떠난 파일에서는 플레이어가 둔 자리를 지킨다. 새 테스트와 변이가 1차에서 살아남은 K5·K6을 잡는다.

## 7. 남은 일 (결함 아님)

- R-N1~R-N3 반영 여부는 작업자/Owner 판단.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-keys2
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git status --short                                   # 변이 전: 비어 있어야 함
cp src/scenario/validate.ts src/app/run.ts src/ui/editor/CodeEditor.tsx $S/bak/
python3 $M src/scenario/validate.ts "const lastField = Math.max(" "const lastField = Math.min("   # V1 예시
npx vitest run src
cp $S/bak/validate.ts src/scenario/validate.ts && cmp src/scenario/validate.ts $S/bak/validate.ts
npx vite preview --port 4211 --strictPort &           # 끝나면 이 PID만 종료
node $S/r.mjs http://localhost:4211/
git status --short                                    # 이 기록 파일만
```
