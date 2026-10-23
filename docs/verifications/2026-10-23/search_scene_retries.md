# 탐색형 사건 다시 시도 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-23
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: 커밋 `7e308e2`(HEAD, `05f7ad1` 위) "Let search scenes be retried within a per-scene number of runs", 브랜치 `claude/compassionate-ramanujan-qoaiw1`. 26파일 +210/−19
  - 코드: `src/engine/types.ts`·`derive.ts`, `src/app/App.tsx`, `src/scenario/validate.ts`, 시나리오 3개 `index.ts`와 템플릿 9개
  - 테스트: `src/engine/derive.test.ts`(5개), `src/scenario/validate.test.ts`(6개)
  - 기록: `docs/SOT.md` v0.10 §3.8, 아키텍처 §3·§8, 데이터 계약 `Scene.attempts`·`Transition.miss`·`DerivedState.missesOnCurrent`·§5, 시나리오 문서 3개의 "다시 시도" 표, `work_log.md` §13, README, CHANGELOG
- 비교 기준: `origin/main`(`0309c42`, PR #4 병합 — *Incident 02:14* `version: 4`, *Thermal Drift*·*Unlogged Run* `version: 1`, 시나리오 선택 포함)

## 2. 범위

1. 재생(`derive`): 카운터 초기화, miss의 플래그·효과, miss 때 파일·슬롯 불변, 엔딩, 같은 `sceneId`가 이어지는 `apply`/`validPrefix`, 옛 저장(SoT v0.10 행과 시나리오 문서의 "그 지점까지만 이어진다" 주장)
2. App: 사건이 현재인 동안만 편집 값 유지, 수정 표시, miss 뒤 커서, Terminal 출력 위치
3. 검증기: 상태 키, 새 규칙, 오탐, 탐색 규모
4. 이야기: 반복되는 miss 로그가 자연스러운지, 다시 시도할 때 주석만으로 답을 찾을 수 있는지(R-07), 고른 사건이 정말 탐색형인지(*Incident* `limit`·`room` 등), 빠진 탐색형 사건이 있는지(*Thermal* `alarm`, *Lab* `samples` 등), 안내 주석 위치
5. 문서 정합성, 명령, 변이, 브라우저

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-retry`

- diff 전체와 바뀐 사건 템플릿·전이 읽기. `git fetch` 후 `origin/main`의 시나리오 버전 확인.
- 탐색 규모·옛 저장·검증기 경계: `<S>/r.test.ts`를 별도 설정(`<S>/vc.mjs`, 저장소 수정 없음)으로 실행 — 세 시나리오 `validateScenario` 상태 수·시간, 배포본 형식 저장(*Thermal* v1, *Incident* v4)과 v3 저장의 `restore`, miss 전이에 효과를 단 경우, `attempts: 1`.
- 단위 변이: 사전 `git status --short` 비어 있음 → `<S>/bak/`에 `cp` 백업 → 치환(D5는 한 줄 삽입) → `npx vitest run src` → 백업 복원 → `cmp`. 커밋하지 않음.
- App 변이: `App.tsx`의 "사건이 아직 현재이면 편집 값 유지" 줄을 지운 빌드(`<S>/dist-A1`), 소스는 즉시 복원·`cmp`.
- 브라우저: 원본 `dist`(포트 4231, 내 PID 10363·자식 10389·10390)와 A1(4232, PID 10365·자식 10397·10398). Playwright(설치된 Chromium, 1000×480). `<S>/b.mjs`(Owner의 `retry.mjs`를 참고해 새로 씀): *Unlogged Run*을 키보드로 — 계정 miss → 새로고침 → 두 번째 miss(기회 소진) → 챔버 miss → 챔버 적중 → `main.py` 상태. 커서는 `.cursors-layer .cursor`와 같은 `top`의 줄, 수정 표시는 `.tab.is-dirty`. 끝난 뒤 내 PID만 종료, 4231·4232 응답 없음 확인.

## 4. 결과

### 4.1 재생 (`derive.ts:51-71`)

- miss이고 기회가 남으면(`left > 0`) 실행 로그 + 전이 로그 + "남은 기회 N번" 한 줄만 남기고 `continue` — 플래그·효과·`solved`·다음 사건 공개 모두 건너뛴다. 따라서 파일 텍스트와 슬롯이 그대로다(단위 셀이 `def contain` 없음·슬롯 `triage`만 단언).
- 마지막 기회의 miss는 "기회를 다 썼다" 줄 뒤 보통 전이(효과·다음 사건). 적중이나 다른 전이도 보통 전이이고 `missesOnCurrent`를 0으로 되돌린다. 엔딩에서는 0.
- `apply`/`validPrefix`: 같은 `sceneId`가 이어져도 루프가 매 선택을 현재 사건과 비교하므로 그대로 동작(셀 `replays a save with misses…`).
- miss 전이의 `effects`는 기회가 남은 동안 무시되고 마지막 기회에만 적용된다. 지금 데이터의 miss 전이는 모두 효과가 없어 문제는 없으나 검증기도 테스트도 이를 다루지 않는다 → N1.

### 4.2 옛 저장 — 차단 B1

`<S>/r.test.ts` 결과:

| 저장 | 선택 | 복원 | Terminal 안내 |
| --- | --- | --- | --- |
| *Incident* **v3** | triage, schedule(hour 5), escalate | 2/3 | "시나리오가 바뀌어 일부 진행을 되돌렸습니다." |
| *Incident* **v4** (지금 `main` 배포본) | 같음 | 2/3 | **"저장된 진행 일부를 읽을 수 없어 그 앞까지만 이어갑니다."** |
| *Thermal Drift* **v1** (배포본) | alarm, unit("CRAC-1"), resume, override | 2/4, 현재 `unit`·miss 1 | **같은 "읽을 수 없어"** |

- 이번 커밋은 사건 템플릿(주석)과 재생 의미를 바꿨지만 시나리오 `version`을 올리지 않았다(`incident-0214/index.ts:25` 4, `thermal-drift/index.ts:22` 1, `unlogged-run/index.ts:23` 1). `types.ts`의 `version` 정의("Bumped whenever content changes; decides save compatibility")와 데이터 계약의 버전 규칙에 어긋난다.
- 결과: `origin/main`에 이미 들어간 v4·v1 저장 중, 이번에 탐색형이 된 사건에서 못 찾고 넘어간 플레이는 그 사건까지만 이어지는데, 버전이 같아 **"읽을 수 없어"(손상처럼 읽히는) 안내**가 나온다. 진행 손상은 없지만 안내가 틀리다.
- 기록도 이 사실과 다르다: SoT v0.10 행(`docs/SOT.md` 버전 로그)과 `docs/scenario/incident-0214.md`의 "다시 시도" 절은 **v3** 저장만 말하고 "시나리오 버전 안내가 나온다"고 쓰며, `work_log.md` §13은 "기존 배포(v3) 저장"이라고 쓴다. 실제 배포본은 v4(*Incident*)·v1(나머지 둘)이고 그 저장에는 버전 안내가 나오지 않는다. *Thermal Drift*·*Unlogged Run* 문서는 옛 저장 영향을 말하지 않는다.
- 고칠 것: 세 시나리오 `version`을 올리고(5·2·2), SoT v0.10 행·시나리오 문서·작업 로그의 옛 저장 문장을 배포본 기준으로 바로잡을 것. 버전을 올리면 안내가 "시나리오가 바뀌어 일부 진행을 되돌렸습니다."로 맞춰진다(편집 값 초기화는 어느 쪽이든 같다).

### 4.3 App (`App.tsx` `run`)

- miss 뒤 `derive(…).currentSceneId === solved`이면 편집 값을 지우지 않는다. 브라우저(원본):
  1. 계정 `"admin"` miss: Terminal `[audit] 이 계정은 run-0과 관계가 없다.` → `[workspace] find_owner(): 남은 기회 1번. …`, 값 `account = "admin"` 유지, 커서 그 값 끝, 수정 표시 `01_scheduler.py`.
  2. 새로고침: 같은 파일·같은 값·같은 커서, 남은 기회 줄 1개(재생 로그라 보존).
  3. `"kim.jh"` 두 번째 miss: `… 기회를 다 썼다. 다음으로 넘어간다.` → `lab/02_chamber.py 생성됨`, 해결 값은 엔진 표기로 고정, 수정 표시 없음.
  4. 챔버 2 miss → 값 유지, 4 입력 → 적중, 다음 함수 `scan = False`로 커서 이동, 수정 표시 없음. `main.py` 목록 `[진행 중, 지금 열림]`. 콘솔 오류 0.
- miss 뒤 커서: 엔진 텍스트가 같아 `textChanged`가 거짓 → 커서 이동 없음(키보드로 바로 고쳐 다시 실행 가능). 모델은 진행 번호 때문에 다시 쓰이지만 같은 편집 값으로 쓰여 화면이 같다.
- 변이 A1(유지 줄 제거): miss 직후 값이 기본값 `"kim.jh"`로 돌아가고 수정 표시가 사라짐, 이어 입력한 `"kim.jh"`가 `""kim.jh"`로 꼬여 Traceback — 이 줄이 요구를 지킨다. 자동 셀은 없다(브라우저로만) → N2.

### 4.4 검증기

- 상태 키에 `missesOnCurrent` 포함(`validate.ts:107`). 규칙: `attempts` ≥ 2 정수, `attempts`와 miss 짝, 주석 "기회는 N번"(함수 본문 기준), 전이 전부 miss 거부. `attempts: 1`은 두 문제(정수 규칙·주석 수)로 잡힘.
- 탐색 규모: *Incident* 9,388 상태(약 9초, 기존 상한 20,000 안), *Thermal* 229, *Lab* 247. `validate.test.ts:21` 주석 "8,650 states at version 3"는 낡음(사소).
- "기회는 N번" 주석이 모두 `# @if` 밖에 있어 어느 분기에서나 보인다(템플릿 확인).

### 4.5 이야기

- 고른 10개 사건은 모두 "어디를/무엇을 볼지" 고르는 사건이고 miss 로그가 반복돼도 자연스럽다("그 시간대에는 특이한 작업이 없다", "감사한 계정에 특이 사항이 없다", "입장. 조용하다", "정상 가동", "등록된 실험만 있다" 등). *Thermal* `override`의 miss 로그 "그 전 기록은 조회 범위 밖이다"는 기간을 늘리라는 단서가 되어 다시 시도에 잘 맞는다.
- *Incident* `limit`(경보 기준값): 주석 "낮출수록 작은 변화도 기록한다"가 다시 시도의 방향을 준다. SoT §3.8이 "기준값"을 탐색형으로 명시. 타당.
- *Incident* `room`: 방에 들어가 보는 행동이라 탐색형으로 볼 수 있고, `spike_seen`/`traced_b2` 분기 주석이 B2-07을 가리킨다. 두 번째로 B2-07에 들어가면 `device_found`가 서고 뒤 `device` 주석과도 일관.
- 빠진 탐색형 없음: *Thermal* `alarm`(열 지도/팬 최대/경보 끄기), *Lab* `queue`(대기열 보기/중지/무시)·`samples`(스캔 여부), *Incident* `triage`·`power`(차단기 내림 포함)·`review`·`access`는 상태를 바꾸는 조치가 섞여 있어 결정형으로 두는 것이 SoT §3.8 정의와 맞다.
- R-07: 다시 시도할 때 주석은 그대로이고 miss 로그가 "아님"을 알려 주므로 남은 선택지를 좁힐 수 있다. 안내 문장 위치(선택지 목록 바로 아래, 값 줄 위)도 읽기에 자연스럽다.

### 4.6 변이 결과

단위(`npx vitest run src`, 164개):

| 변이 | 위치 | 깨진 셀 |
| --- | --- | --- |
| D1 miss 무시 | `derive.ts` `if (transition.miss && …)` | 재시도 셀 4개 |
| D2 적중 뒤 카운터 안 되돌림 | `missesOnCurrent = 0` 제거 | `takes the miss … last run`, `advances on a hit after a miss…` |
| D3 남은 기회 하나 어긋남 | `left` 계산 | `stays on the scene…`, `takes the miss … last run` |
| D4 `attempts` 없는 miss도 처리 | `&& scene.attempts` 제거 | **안 깨짐** — 결과적으로 바로 넘어가 같은 사건 ID만 단언하는 셀이 통과(로그에 "기회를 다 썼다"가 끼어듦). 검증기가 이 조합을 막으므로 실해는 없음 → N3 |
| D5 기회가 남은 miss에도 효과 적용 | miss 분기에 `flags = …` 삽입 | **안 깨짐** → N1 |
| V1 상태 키에서 miss 수 제외 | `validate.ts:107` | 세 시나리오 통과 셀 + `accepts a retry scene…`(재시도를 탐색하지 않아 전이 미도달) |
| V2 주석 검사 끔 | `validate.ts` | `reports attempts not explained` |
| V3 `attempts` 없는 miss 허용 | 같은 곳 | `reports miss without attempts` |
| V4 `attempts` 1 허용 | 같은 곳 | `reports attempts below 2` |
| V5 전부 miss 허용 | 같은 곳 | `reports every transition a miss` |

App(빌드 + 브라우저): A1 편집 값 유지 줄 제거 → 4.3대로 드러남.

모든 변이 후 `cmp` 일치. 최종 `git status --short`는 이 기록 파일만.

### 4.7 명령 결과

- `npm run lint`: 종료 코드 0.
- `npm test`: `Test Files 14 passed (14)`, `Tests 164 passed (164)` — 작업 로그 §13과 일치.
- `npm run build`: `✓ built`, 경고 없음.

## 5. 문제 / 위험

### 차단

- **B1 — 시나리오 버전을 올리지 않아 배포본 저장에 틀린 안내, 기록도 배포본과 다름.** 4.2. 세 시나리오 `version` 증가(*Incident* 5, *Thermal Drift* 2, *Unlogged Run* 2)와 SoT v0.10 행·`docs/scenario/*.md`·`work_log.md` §13의 옛 저장 문장 수정. 버전 증가 시 `scenarioData`/검증 테스트 영향은 없다(버전을 단언하는 셀 없음 — 필요하면 추가).

### 비차단

- **N1 — miss 전이의 효과가 마지막 기회에만 적용되는 함정.** `derive.ts`의 miss 분기는 효과를 건너뛰므로, 작성자가 miss에 효과(예: "헛걸음" 플래그)를 달면 마지막 기회에만 서는 비직관적 동작이 된다. 지금 데이터에는 없다(D5 생존). 검증기에 "miss 전이에는 효과를 두지 않는다"를 넣거나 계약에 명시할 것.
- **N2 — App의 편집 값 유지는 브라우저로만 잠김.** A1 변이는 단위 테스트를 통과한다. 판단(`currentSceneId === solved`)을 순수 함수로 빼면 잠글 수 있다. 기존 App 판단들과 같은 처지라 참고.
- **N3 — `ignores miss on a scene without attempts` 셀이 로그를 보지 않음.** D4 변이에서도 통과한다. 검증기가 그 조합을 막으므로 실해는 없고, 셀에 "기회를 다 썼다" 줄이 없음을 단언하면 잠긴다.
- **N4 — 사소.** `validate.test.ts:21` 주석의 상태 수(8,650, v3 기준)가 낡음(지금 9,388). 상한은 여유 있음.

## 6. 판정

**조건부 합격** — B1(시나리오 버전 증가와 옛 저장 서술 수정)을 고치면 합격.

- 재생 규칙(남은 기회 동안 머묾, 마지막 기회에 보통 전이, 적중 시 초기화, 파일·슬롯 불변), App 동작(값·커서·수정 표시 유지, 새로고침 후 남은 기회 복원), 검증기 규칙과 재시도 탐색, 사건 선택과 이야기 모두 요구대로다.
- 단위 가드는 D4·D5를 빼고 양방향 변이에 깨진다(둘은 N1·N3).

## 7. 남은 일 (결함 아님)

- B1 보강 후 재검증. N1~N4 반영 여부는 작업자 판단.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나(변이 빌드는 스크래치패드).

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-retry
M=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/verify-nextfile/mut.py
cd /home/user/Hidden-Main-
npm run lint && npm test && npm run build
git fetch -q origin && git show origin/main:src/scenario/incident-0214/index.ts | grep version   # 4
npx vitest run --root $S --config $S/vc.mjs --silent=false     # 상태 수, 옛 저장 복원, 검증기 경계
git status --short                                   # 변이 전: 비어 있어야 함
cp src/engine/derive.ts src/scenario/validate.ts src/app/App.tsx $S/bak/
python3 $M src/engine/derive.ts "if (transition.miss && scene.attempts) {" "if (transition.miss) {"   # D4 예시
npx vitest run src
cp $S/bak/derive.ts src/engine/derive.ts && cmp src/engine/derive.ts $S/bak/derive.ts
npx vite preview --port 4231 --strictPort &           # 끝나면 이 PID만 종료
node $S/b.mjs http://localhost:4231/
git status --short                                    # 이 기록 파일만
```
