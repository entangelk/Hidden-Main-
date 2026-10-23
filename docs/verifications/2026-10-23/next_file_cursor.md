# `next_file()` 커서·실행 안내 위치 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: 커밋 `e7a2bf3`(HEAD, `5eba296` 위) "Put the cursor on next_file()'s return line and the run hint under it", 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 8파일 +37/−7
  - 코드: `src/engine/render.ts`(`handoffBlock`), `src/ui/editor/reveal.ts`(`handoffCursorOffset`), `src/ui/editor/CodeEditor.tsx`
  - 테스트: `src/ui/editor/reveal.test.ts`
  - 기록: `docs/SOT.md` §3.3·v0.10 행, `docs/architecture/00_overview.md` §5.2, `work_log.md` §15, `CHANGELOG.md`
- 요구(Owner): 안내 함수가 생기면 커서가 방금 해결한 값에서 `next_file()`의 `return` 줄 끝으로 옮겨 가고, 실행 안내 주석은 주석 묶음에서 `return` 바로 아래로 옮긴다.

## 2. 범위

`handoffBlock`·`handoffCursorOffset`·편집기 분기(안내가 새로 생길 때만, `revealRef`·슬롯과의 관계, 새로고침, 떠난 파일 재방문, 마지막 파일 엔딩), 검증기·`main.py` 무영향, "버전 증가 불필요" 주장, 문서, 명령, 변이, 브라우저.

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nfcursor`

- diff와 `CodeEditor.tsx` 분기 전후 읽기.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 치환 → `npx vitest run src` → 백업 복원 → `cmp`. 커밋하지 않음.
- 편집기 변이: 안내 분기의 `editor.setPosition(end)`를 지운 빌드(`<S>/dist-E1`), 소스는 즉시 복원·`cmp`.
- 브라우저: 원본 `dist`(포트 4251, 내 PID 1771·자식 1799·1800)와 E1(4252, PID 1773·자식 1797·1798). Playwright(설치된 Chromium, 1000×480). `<S>/n.mjs`: *Thermal Drift*를 키보드로 진행하며 커서 줄(`.cursors-layer .cursor`와 같은 `top`의 줄)과 `return` 다음 줄 확인. 끝난 뒤 내 PID만 종료, 4251·4252 응답 없음 확인.

## 4. 결과

### 4.1 코드

- `handoffBlock`(`render.ts:73-81`): 주석 두 줄 → 빈 줄 → `return "<경로>"` → 바로 아래 `# Ctrl+Enter(macOS는 Cmd+Enter)로 실행하면 다음 파일로 넘어간다. 왼쪽 Explorer에서 열어도 된다.` 다른 사건의 "값 줄 아래 실행 안내"와 같은 자리다. 안내는 마지막 코드 줄 뒤 주석이라 `functionBlock`의 끝은 여전히 `return` 줄이지만, 안내 함수는 모든 값 슬롯 뒤에 붙으므로 오프셋 영향 없음.
- `handoffCursorOffset`(`reveal.ts`): `def next_file(` 뒤 첫 `return `의 줄 끝. 같은 파일의 앞선 `return`이나 모듈 꼬리(`if __name__`)를 잡지 않는다(셀이 확인).
- 편집기 분기(`CodeEditor.tsx:213-218`): `gainedHandoff`로 안내가 **새로 생긴** 파일만 `revealHandoffRef`에 들어가고, 이 분기는 `revealRef` 분기(현재 사건 슬롯이 있을 때)가 아닐 때만 실행된다. 안내가 생기는 파일은 진행이 막 떠난 파일이라 현재 사건 슬롯이 없으므로 항상 이 분기로 온다.
- 버전: 안내 함수는 진행에서 파생되는 텍스트이고 저장 형식(`choices`·편집 값·탭)에 들어가지 않는다. 사건 템플릿·전이·슬롯 변화가 없으므로 `version`을 올리지 않은 판단이 맞다. 검증기(`RUN_HINT`는 사건 템플릿만 검사)와 `main.py`(앱 템플릿)도 영향 없음 — 테스트 167개 통과.

### 4.2 브라우저 (원본)

1. `CRAC-3` 해결로 `01`을 떠남: 커서 `return "cooling/02_unit_control.py"` 끝, 그 다음 줄이 새 실행 안내.
2. 마우스로 `def next_file(self):` 클릭 → `config/facility.py` → `01` 복귀: 클릭한 줄 유지(안내가 새로 생긴 것이 아니므로 다시 옮기지 않음).
3. `01`에서 새로고침: 커서 1행(`from infra import …`). 모델을 새로 만들 때는 안내가 "새로 생긴" 것이 아니고 현재 슬롯도 없어 커서를 옮기지 않는다 → N2.
4. 그 자리에서 `Ctrl+Enter`: `02` 열림, 커서 `resume = False` 끝(1·3과 무관하게 동작).
5. `02`를 떠날 때도 커서 `return "cooling/03_rack_audit.py"` 끝.
6. 마지막 파일 `03`에서 엔딩: 안내 함수가 없어 커서는 해결한 `recipient = "security"`에 남음(정상). 콘솔 오류 0.

변이 E1(`setPosition` 제거): 1단계에서 커서가 해결한 `unit = "CRAC-3"`에 남음 — 요구가 이 줄에 달려 있음을 확인.

### 4.3 변이 결과 (`npx vitest run src`, 167개)

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| H1 첫 `return` 아무거나 | `reveal.ts` `handoffCursorOffset` | `is the end of the return line of next_file(), not of an earlier return` |
| H2 줄 시작 위치 | 같은 곳 | 같은 셀 |
| H3 줄바꿈 다음 위치 | 같은 곳 | 같은 셀 |
| H4 `def` 줄 기준 | 같은 곳 | 같은 셀 |
| R1 실행 안내를 다시 `return` 위 주석 묶음으로 | `render.ts:73-81` | **안 깨짐** → N1 |

편집기(빌드 + 브라우저): E1 → 4.2 마지막 문단.

모든 변이 후 `cmp` 일치. 최종 `git status --short`는 이 기록 파일만.

### 4.4 문서

SoT §3.3 문장 추가와 v0.10 행, 아키텍처 §5.2, 작업 로그 §15, CHANGELOG 모두 코드와 일치. 옛 문구("여기서 Ctrl+Enter … 그 파일이 열린다")는 코드·현행 문서에 남아 있지 않다(과거 기록에만).

### 4.5 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 167 passed (167)` — 작업 로그 §15와 일치.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **N1 — 안내 주석 위치는 테스트로 잠기지 않음.** `reveal.test.ts`는 `handoffBlock`을 픽스처로 쓰지만 커서 오프셋만 본다. 안내를 `return` 위로 되돌려도(R1) 167개가 통과한다. `return` 다음 줄이 안내임을 단언하는 셀 하나면 잠긴다.
- **N2 — 새로고침·처음 열기에서 떠난 파일의 커서는 1행.** 떠난 파일을 새로 만든 모델로 보일 때(새로고침, 시나리오 전환 뒤 그 파일이 활성) 현재 슬롯도 "새로 생긴 안내"도 아니라 커서가 맨 위에 있고, 작은 창에서는 `next_file()`이 화면 밖일 수 있다. `Ctrl+Enter`는 커서와 무관하게 다음 파일을 열므로 진행은 막히지 않는다. 요구("안내가 생기면")의 범위 밖이라 참고 사항 — 원하면 "현재 슬롯이 없고 안내가 있는 파일을 처음 보일 때"도 같은 위치로 둘 수 있다.

## 6. 판정

**합격** — 안내 함수가 새로 생길 때만 커서가 `return` 줄 끝으로 옮겨 가고, 실행 안내는 `return` 바로 아래에 있다. 재방문 시 커서를 빼앗지 않고, 마지막 파일 엔딩·검증기·`main.py`·저장에 영향이 없으며 버전 유지 판단도 맞다.

## 7. 남은 일 (결함 아님)

- N1·N2 반영 여부는 작업자 판단.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nfcursor
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git status --short                                   # 변이 전: 비어 있어야 함
cp src/ui/editor/reveal.ts src/ui/editor/CodeEditor.tsx src/engine/render.ts $S/bak/
python3 $M src/ui/editor/reveal.ts "text.indexOf('return ', text.indexOf(HANDOFF_DEF))" "text.indexOf('return ')"   # H1 예시
npx vitest run src
cp $S/bak/reveal.ts src/ui/editor/reveal.ts && cmp src/ui/editor/reveal.ts $S/bak/reveal.ts
npx vite preview --port 4251 --strictPort &           # 끝나면 이 PID만 종료
node $S/n.mjs http://localhost:4251/
git status --short                                    # 이 기록 파일만
```
