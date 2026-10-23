# 탐색형 사건 다시 시도 재검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 1차 검증자와 같음, 보강 작업은 하지 않음)
- 대상: 커밋 `3ccaa13`(보강)과 `7b4afaa`(origin/main 병합), 브랜치 `claude/compassionate-ramanujan-qoaiw1`
  - `git diff 3ccaa13 7b4afaa` 비어 있음 — 병합은 내용 변화 없음(`origin/main`의 `0309c42`가 이미 이 브랜치의 조상).
  - 코드: `src/app/run.ts`(`cleared`), `src/app/App.tsx`, `src/scenario/validate.ts`(miss 효과 규칙), 시나리오 `version` 3곳
  - 테스트: `src/app/run.test.ts`, `src/engine/derive.test.ts`, `src/scenario/validate.test.ts`
  - 기록: `docs/SOT.md` v0.10 행, `docs/architecture/01_data_contracts.md`(`miss` 주석), `docs/scenario/*.md` 3개, `work_log.md` §13·§14, 1차 기록(커밋에 포함 — 검증자 작성본과 바이트 동일함을 `diff`로 확인)
- 1차 기록: [`search_scene_retries.md`](search_scene_retries.md)(조건부 합격, 차단 B1, 비차단 N1~N4)

## 2. 범위

B1·N1~N4 보강 확인, 회귀(배포된 v4·v1 저장 복원 시 버전 안내·편집 값 초기화), `npm run lint`·`npm test`·`npm run build`, 새 가드 변이, 짧은 브라우저 확인.

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-retry2`

- diff 읽기, 병합 diff가 빈 것 확인.
- 옛 저장 복원: `<S>/r.test.ts`를 별도 설정(`<S>/vc.mjs`, 저장소 수정 없음)으로 실행 — *Incident* v4(miss 뒤 진행 있음/없음), *Thermal* v1, *Unlogged* v1, *Incident* v5의 `restore` 결과.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 치환 → `npx vitest run src` → 백업 복원 → `cmp`. 커밋하지 않음.
- 브라우저: `npm run build` 결과를 `npx vite preview --port 4241 --strictPort`(내 PID 12384, 자식 12397·12398)로 서빙. 1차 스크립트 `…/verify-retry/b.mjs` 재실행, `<S>/seed.mjs`로 배포본 형식 *Thermal* v1 저장(miss 뒤 진행, 편집 값, active 키)을 심고 첫 화면 확인. 1000×480. 끝난 뒤 내 PID만 종료, 4241 응답 없음 확인.

## 4. 결과

### 4.1 보강 확인

| 지적 | 보강 | 판정 |
| --- | --- | --- |
| B1 버전 미증가·기록 불일치 | `version` *Incident* 5, *Thermal Drift* 2, *Unlogged Run* 2. SoT v0.10 행이 버전 증가와 "시나리오가 바뀌어 일부 진행을 되돌렸습니다" 안내를 명시, 시나리오 문서 3개에 v5/v2 항목, 작업 로그 §13 정정 + §14 | 해소(4.2). 시나리오 문서의 상태 수(229·247)도 실측과 일치 |
| N1 miss 효과 함정 | `validate.ts` "a miss transition sets flags" 규칙 + 셀, 계약 `miss` 주석에 "effects는 비워 둔다" | 해소(E1·E2) |
| N2 편집 값 유지가 브라우저로만 잠김 | `runScene`이 사건을 지나쳤을 때만 `cleared: scene.id`(miss로 머물면 없음), App은 `cleared`만 따름. `run.test.ts` 셀(보통 해결·첫 miss·마지막 기회 miss) | 해소(C1~C3). App 쪽은 `cleared`를 그대로 쓰는 세 줄이라 판단이 순수 함수로 옮겨졌다 |
| N3 약한 셀 | `ignores miss on a scene without attempts`가 `missesOnCurrent` 0과 "기회" 로그 없음까지 단언 | 해소(1차 D4 변이가 이제 깨짐) |
| N4 낡은 주석 | `validate.test.ts:21` "9,388 states at version 5" | 해소 |

### 4.2 옛 저장 복원 (회귀 확인)

| 저장 | 복원 | 안내 | 편집 값 |
| --- | --- | --- | --- |
| *Incident* v4, schedule miss 뒤 escalate까지 | 2/3 | 시나리오가 바뀌어 일부 진행을 되돌렸습니다. | `{}` |
| *Incident* v4, miss 없이 triage만 | 1/1 | 없음 | `{}`(버전 규칙) |
| *Thermal* v1, unit miss 뒤 resume까지 | 2/3 | 시나리오가 바뀌어 … | `{}` |
| *Unlogged* v1, owner miss 뒤 chamber까지 | 2/3 | 시나리오가 바뀌어 … | `{}` |
| *Incident* v5(같은 버전) | 2/2 | 없음 | 유지 |

- 브라우저: 배포본 형식 *Thermal* v1 저장을 심고 열면 Terminal 끝에 `[crac] 정상 가동, 냉각 100%.` → `[workspace] inspect_unit(): 남은 기회 1번. …` → `시나리오가 바뀌어 일부 진행을 되돌렸습니다.` 저장된 활성 탭(`02_unit_control.py`)은 아직 다시 생기지 않은 파일이라 빠지고 `main.py`가 활성 — 기존 탭 복원 규칙(SoT §3.6)대로이며, `main.py`에서 그대로 `Ctrl+Enter`하면 현재 사건 파일(`01`)로 이어진다. 콘솔 오류 0.

### 4.3 브라우저 (1차 스크립트 재실행)

1차와 같은 결과: 계정 miss 뒤 값·커서·수정 표시 유지 → 새로고침 후 유지 → 두 번째 miss에서 "기회를 다 썼다"와 함께 진행, 수정 표시 사라짐 → 챔버 miss 뒤 값 유지 → 4로 적중, 다음 함수로 커서 → `main.py` `[진행 중, 지금 열림]`. 콘솔 오류 0.

### 4.4 변이 결과 (`npx vitest run src`, 166개)

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| C1 항상 `cleared`(miss 뒤에도 지움) | `run.ts:75` | `clears the edits of a scene it moved past, and keeps them after a miss` |
| C2 `cleared` 안 줌(지우지 않음) | `run.ts:75` | 같은 셀 |
| C3 다음 사건 ID를 `cleared`로 | `run.ts:75` | 같은 셀 |
| E1 miss 효과 규칙 끔 | `validate.ts:199` | `reports miss with effects` |
| E2 과잉: 모든 전이의 효과를 금지 | `validate.ts:199` | mini·세 시나리오 통과 셀 등 6개 |
| D4(1차 생존) `attempts` 없는 miss도 처리 | `derive.ts` | `ignores miss on a scene without attempts…` |

모든 변이 후 `cmp` 일치. 최종 `git status --short`는 이 기록 파일만.

### 4.5 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 166 passed (166)` — 작업 로그 §14와 일치.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

없음.

### 비차단

- **R-N1 — 버전 증가로 miss가 없던 저장도 편집 값이 조용히 초기화됨(참고).** 4.2 둘째 행처럼 진행은 전부 이어져도 버전이 달라 편집 중이던 값이 기본값으로 돌아가고, 진행이 잘리지 않았으므로 안내 줄도 없다. SoT §3.6 버전 규칙 그대로의 동작이고 *Incident* 문서는 이를 적었으나, *Thermal Drift*·*Unlogged Run* 문서의 v2 항목은 잘린 경우만 말한다. 한 줄 보태면 충분.

## 6. 판정

**합격** — B1(버전 증가와 기록 정정)과 N1~N4가 모두 정확히 보강되었고 회귀는 없다. 배포된 v4·v1 저장은 이제 올바른 버전 안내와 함께 miss 지점까지 복원되고, miss 뒤 편집 값 유지 판단은 단위 셀로 양방향이 잠겼다.

## 7. 남은 일 (결함 아님)

- R-N1 반영 여부는 작업자 판단. 새 PR 생성·Owner 병합 후 배포 주소에서 확인.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나.

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-retry2
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
git diff 3ccaa13 7b4afaa --stat                      # 비어 있음
npm run lint && npm test && npm run build
npx vitest run --root $S --config $S/vc.mjs --silent=false     # 옛 저장 복원
git status --short                                   # 변이 전: 비어 있어야 함
cp src/app/run.ts src/scenario/validate.ts src/engine/derive.ts $S/bak/
python3 $M src/app/run.ts ": { lines: [], progress: next, cleared: scene.id }" ": { lines: [], progress: next }"   # C2 예시
npx vitest run src
cp $S/bak/run.ts src/app/run.ts && cmp src/app/run.ts $S/bak/run.ts
npx vite preview --port 4241 --strictPort &           # 끝나면 이 PID만 종료
node /tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-retry/b.mjs http://localhost:4241/
node $S/seed.mjs http://localhost:4241/
git status --short                                    # 이 기록 파일만
```
