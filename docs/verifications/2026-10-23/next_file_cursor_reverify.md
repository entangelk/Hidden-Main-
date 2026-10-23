# `next_file()` 커서 재검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 1차 검증자와 같음, 보강 작업은 하지 않음)
- 대상: 커밋 `eec5242`(HEAD, `e7a2bf3` 위), 브랜치 `claude/compassionate-ramanujan-qoaiw1`
  - `src/ui/editor/CodeEditor.tsx`(안내 분기 조건), `src/ui/editor/reveal.test.ts`(안내 위치 단언)
  - `docs/architecture/00_overview.md` §5.2, `work_log.md` §15, 1차 기록(커밋에 포함 — 검증자 작성본과 바이트 동일함을 `diff`로 확인)
- 1차 기록: [`next_file_cursor.md`](next_file_cursor.md)(합격, 비차단 N1·N2)

## 2. 범위

N1·N2 보강 확인, 회귀(재방문·진행 번호만 바뀐 재작성에서 커서를 빼앗지 않는지, 안내가 없는 `main.py`·설정 파일 무영향), 명령, 변이, 브라우저(떠난 파일에서 새로고침 포함).

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nfcursor2`

- diff 읽기. 새 조건이 참이 되는 경우를 `revealRef`(모델을 처음 만들 때, 또는 엔진 텍스트가 실제로 바뀔 때만 들어감 — `textChanged`)와 대조.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 변이 → `npx vitest run src` → 백업 복원 → `cmp`. 커밋하지 않음.
- 편집기 변이 빌드 2개(`<S>/dist-E1`, `<S>/dist-E2`), 소스는 즉시 복원·`cmp`.
- 브라우저: 원본 `dist`(4261, 내 PID 2987·자식 3033·3034), E1(4262, PID 2989·자식 3042·3043), E2(4263, PID 2991·자식 3026·3027). Playwright(설치된 Chromium, 1000×480). `<S>/s.mjs`: *Thermal Drift* — `01`을 떠남 → `def next_file` 클릭·다른 파일·복귀 → 새로고침 → `Ctrl+Enter`로 `02` → `02`에서 해결 → `01`·`main.py`·`config/facility.py` 보기. 끝난 뒤 내 PID만 종료, 4261~4263 응답 없음 확인.

## 4. 결과

### 4.1 보강 확인

| 지적 | 보강 | 판정 |
| --- | --- | --- |
| N1 안내 주석 위치가 테스트로 잠기지 않음 | `reveal.test.ts`가 `return` 다음 줄이 실행 안내임을 단언 | 해소(R1 변이가 깨짐) |
| N2 새로고침 뒤 떠난 파일 커서 1행 | `CodeEditor.tsx:213-215` 두 집합을 모두 꺼낸 뒤, 현재 슬롯이 없을 때 "안내가 새로 생김" **또는** "처음 보이거나 텍스트가 바뀐 파일에 안내가 있음"이면 `return` 줄 끝으로 | 해소(4.2 3단계) |

- 빼앗기 없음의 근거: 떠난 파일의 엔진 텍스트는 이후 바뀌지 않으므로(파일 단위 앞으로만, 검증기 규칙) 다른 해결 뒤에는 `textChanged`가 거짓이라 `revealRef`에 들어가지 않는다. 재방문은 저장된 view state를 복원한다. `main.py`·설정 파일에는 `def next_file(`이 없어 새 조건이 참이 될 수 없다.
- 두 집합을 항상 꺼내도록 바뀐 것: 안내가 생기는 파일은 현재 슬롯이 없어 이전에도 둘째 분기로 왔으므로 동작 차이 없음.

### 4.2 브라우저

| 단계 | 원본 | E1(새 조건 없음) | E2(`revealed &&` 없음) |
| --- | --- | --- | --- |
| 1 `CRAC-3` 해결로 `01`을 떠남 | `return "cooling/02_unit_control.py"` 끝 | 같음 | 같음 |
| 2 `def next_file` 클릭 → 다른 파일 → `01` | 클릭한 줄 유지 | 같음 | **`return` 줄로 빼앗김** |
| 3 `01`에서 새로고침 | `return …` 끝 | **1행**(안내가 화면 밖) | `return …` 끝 |
| 4 `Ctrl+Enter` → `02` | `resume = False` 끝 | — | 같음 |
| 5 `02`에서 해결 뒤 `01`(진행 번호만 바뀐 재작성) | 클릭한 줄 유지 | — | **`return` 줄로 빼앗김** |
| 6 `main.py`(이 작업 공간에서 처음) | `scenario = 2` 끝 | — | 같음 |
| 7 `config/facility.py`(처음) | 1행 | — | 1행 |

원본 콘솔 error/warning·pageerror 0. E1은 3단계에서 안내 줄이 화면에 없어 스크립트의 다음 클릭이 멈춤(그 자체가 N2 재현).

### 4.3 변이 결과

| 변이 | 위치 | 결과 |
| --- | --- | --- |
| R1 실행 안내를 `return` 위로 되돌림 | `render.ts` `handoffBlock` | `is the end of the return line of next_file()…` 깨짐(1차에서 생존) |
| E1 새 조건 제거(`gained`만) | `CodeEditor.tsx:215` | 브라우저 3단계 1행 |
| E2 과잉: 안내만 있으면 항상 | `CodeEditor.tsx:215` | 브라우저 2·5단계 커서 빼앗김 |

편집기 조건은 브라우저로만 잠긴다(판단의 재료인 `textChanged`·`gainedHandoff`·`handoffCursorOffset`은 단위 셀이 있음) — 참고 사항. 모든 변이 후 `cmp` 일치, 최종 `git status --short`는 이 기록 파일만.

### 4.4 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 167 passed (167)`.
- `npm run build`: `✓ built`, 경고 없음.
- 아키텍처 §5.2와 작업 로그 §15 문장이 코드와 일치.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

없음. (편집기 분기 조건 자체는 브라우저로만 확인된다는 점은 이전 편집기 판단들과 같은 처지라 참고로만 둔다.)

## 6. 판정

**합격** — N1·N2가 정확히 보강되었고, 재방문·다른 파일의 해결 뒤에는 커서를 빼앗지 않으며, 안내가 없는 `main.py`·설정 파일은 영향이 없다. 새로고침 뒤 떠난 파일을 열면 커서가 `return` 줄에 있어 바로 `Ctrl+Enter`로 이어갈 수 있다.

## 7. 남은 일 (결함 아님)

- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nfcursor2
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git status --short                                   # 변이 전: 비어 있어야 함
cp src/engine/render.ts src/ui/editor/CodeEditor.tsx $S/bak/
python3 $M src/ui/editor/CodeEditor.tsx "} else if (gained || (revealed && model.getValue().includes(HANDOFF_DEF))) {" "} else if (gained) {"   # E1 예시
npx vite build --outDir $S/dist-E1 --emptyOutDir
cp $S/bak/CodeEditor.tsx src/ui/editor/CodeEditor.tsx && cmp src/ui/editor/CodeEditor.tsx $S/bak/CodeEditor.tsx
npx vite preview --port 4261 --strictPort &           # 끝나면 이 PID만 종료
node $S/s.mjs http://localhost:4261/
git status --short                                    # 이 기록 파일만
```
