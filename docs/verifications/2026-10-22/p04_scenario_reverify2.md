# 독립 2차 재검증 — P04 시나리오 *Incident 02:14*

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유 2차 재검증 요청) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | 커밋 `78166b2` (`git diff 63307d7..78166b2`) — `src/scenario/incident-0214/{index.ts,security_audit.py,sublevel_access.py}`(`version: 3`), `src/ui/editor/CodeEditor.tsx`(`revision` prop), `src/app/App.tsx`, `src/engine/render.ts`(export), `src/scenario/validate.ts`(+test), 문서, 작업 로그 §26 |
| 이전 기록 | `docs/verifications/2026-10-22/p04_scenario_reverify.md` (조건부 합격, 차단 B4·B5, 하드닝 H-R1~H-R6) |
| 정본 기준 | `docs/phases/P04_incident_0214_scenario.md`, `docs/scenario/incident-0214.md` v3, `docs/architecture/00_overview.md` §5(`:94`)·§6.2(`:151-152`) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `78166b2`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. B4·B5, H-R1~H-R6 상태. 이전 생존 뮤테이션(V6, V12b, V13, V13b, V14, N2) 재적용
2. `revision` 변경의 회귀 — 다른 사건 슬롯의 입력 덮어쓰기, 편집 값 정리와의 시차, 공개 스크롤, 빠른 입력, 실행 취소
3. 바뀐 사건의 모든 가지(의심 계정 유무에 따른 `review`, 잠금 유무에 따른 장치 화면), 문서 표 대 `index.ts`
4. 검증기의 "참이 되지 않는 `@if`" 검사와 상태 수 상한
5. 실제 브라우저 — 두 엔딩, 장치 미발견, 의심 계정 없음, 새로고침, 콘솔 오류, 외부 요청
6. `npm run build` / `npm run lint` / `npm test`
7. 기록 정확성, P04 상태, 사람 몫 항목(AC-10, R-07)

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat 63307d7..78166b2; git diff 63307d7..78166b2 -- src docs
cat -n src/ui/editor/CodeEditor.tsx src/app/App.tsx src/scenario/validate.ts src/engine/render.ts src/engine/derive.ts
npm run build; npm run lint; echo $?; npx vitest run
```

- `derive`·검증기 확인: 임시 테스트 파일 `src/scenario/zz_probe2.test.ts`(실행 직후 삭제, 이후 `git status --short` 출력 없음)에서 `validateScenario(incident0214)`의 문제 목록·상태 수·`variantOutcomes`와 다섯 경로의 `handle_device`, 두 경로의 `review_access` 렌더 결과를 스크래치패드 파일로 출력.
- 뮤테이션: 검증자는 커밋하지 않으므로 `git checkout`을 쓰지 않았다. 스크래치패드 `mut.py`/`mut2.py`가 `cp` 백업 → 정확히 1회 나오는 문자열 치환(assert) → `npx vitest run src/scenario/`(M1~M4는 `validate.test.ts`만) → 백업 복사로 원복 → `git diff --quiet -- <파일>`(내용 비교; 시작 시 트리가 깨끗했으므로 HEAD와 같으면 원래와 바이트 동일). NV4는 10분 시간 제한에 걸려 스크립트가 원복 전에 멈췄고, 즉시 백업 파일로 수동 원복·백업 삭제·남은 vitest 프로세스(내가 띄운 것) 종료 후 `git diff --quiet` 통과를 확인했다.
- 브라우저: `npm run build` 후 `npx vite preview --port 4174 --strictPort`(백그라운드, PID 31100 → 자식 31118·31119). Playwright(`/opt/node22/lib/node_modules/playwright/index.mjs`, 설치된 Chromium, 1280×2400 — 파일 전체 줄이 그려지도록 세로를 늘림) 스크립트는 스크래치패드(`play.mjs`, `undo.mjs`). 경로마다 새 브라우저 컨텍스트(저장소 비어 있음). 값 입력은 값 슬롯 클릭 → End → Backspace(현재 리터럴 길이) → `keyboard.type(delay 0)` → 곧바로 `Control+Enter`. 화면 텍스트는 `.view-line`을 top 순으로 이어 붙여 읽음. 끝난 뒤 위 세 PID만 종료.

## 4. 발견 사항

### 4.1 이전 지적의 상태

| ID | 상태 | 근거 |
| --- | --- | --- |
| B4 | 해소 | `locked`는 `action == 1`이고 `backup_suspect`일 때만(`index.ts:86-91`), 장치 화면 문구는 `device_locked`(`sublevel_access.py:104-106`)이며 이 플래그는 B2-07 입장 시 `locked`일 때만 설정(`index.ts:145-150`). `derive`: admin·B2-03, admin·B2-07, backup·잠금·B2-03, backup·감시·B2-07에서 "잠겨 있다" 없음, backup·잠금·B2-07에서만 있음. 브라우저 P1(있음), P3·P4(빈 방, 없음) 일치 |
| B5 | 해소 | `revision`(`App.tsx:156`)이 키에 들어가(`CodeEditor.tsx:118, 142`) 진행이 바뀌면 모델을 다시 씀. 브라우저: `set_limit`에 `50.0` → 해결 직후 `limit = 50`; `escalate`에 ` False` → `notify_security = False`; `preserve_logs`에 ` False` → `keep_logs = False`; `submit_report`에 `'archive'` → `recipient = "archive"`. 네 경우 모두 새로고침 전후 파일 전체 텍스트 동일 |
| H-R1 | 해소 | 의심 계정이 없으면 다른 설명·선택지(`security_audit.py:33-38`)와 로그 "계정 정책을 확인했다"(`index.ts:92`). 브라우저 P2·P3에서 확인 |
| H-R2 | 해소 | V6→`string option not explained`(`validate.test.ts:63`), N2→`number range not explained`(`:69`), V14→`missing function`(`:61`), V12b→`field without a literal slot`(`:62`), V13·V13b→`explores the values next to a number condition…`(`:85`). 각자 자기 테스트 하나만 실패(§6) |
| H-R3 | 부분 | "참이 되지 않는 `@if`" 검출 추가(`validate.ts:114-123, 222-224`, 테스트 `validate.test.ts:75`). "거짓이 되지 않는 `@if`"(죽은 `@else`)는 검사하지 않음 — NV3 생존(H2-2) |
| H-R4 | 해소 (문서 수정) | `incident-0214.md:66`가 "폐기 장비 보관실"로 짐작 가능하다고 사실대로 적음 |
| H-R5 | 대체로 해소 | `incident-0214.md:81`. 문서 목록(`:74-79`)의 검사는 삭제 시 모두 테스트가 실패함(V6·N2·V14·V12b·V13·V13b·NV1·M1·M4 및 이전 기록의 V1~V5·V11·V12·N1·N3~N5). 목록에 없는 두 검사(시작 사건 존재 `validate.ts:144`, 스테이지 목록 포함 `:156-157`)는 지워도 통과(M2·M3, H2-3) |
| H-R6 | 해소 (기록 수치 틀림) | 상한 테스트 `validate.test.ts:20` (`< 20_000`). 실제 상태 수는 **8,650**인데 주석 `validate.test.ts:19`는 "about 11.5k", 작업 로그 `work_log.md:277`은 "약 1.2만"(H2-4) |

### 4.2 `revision` 변경의 회귀 확인 (`CodeEditor.tsx`, `App.tsx`)

- **다른 사건 슬롯의 입력을 덮어쓸 수 있는가:** 슬롯은 현재 사건에만 있고(`render.ts:108`), 실행은 현재 사건 파일이 활성일 때만 진행한다(`run.ts:31-32`). `revision`은 실행 성공 시에만 바뀐다(`App.tsx:107-110`). 따라서 리비전이 바뀌는 순간 입력 중인 "다른 사건의 슬롯"은 존재하지 않는다. 브라우저: `triage`에 `2` 입력 → `main.py` 탭에서 실행(거부, `revision` 그대로) → 복귀 시 값 `2` 유지 → 실행 수락.
- **해결한 사건의 편집 값 정리와의 시차:** `setProgress`와 `updateEdits`(삭제)가 같은 핸들러 안에서 호출되어(`App.tsx:110-115`) React 19 자동 배치로 한 번에 커밋된다. 효과는 새 `revision`과 정리된 `edits`를 함께 받으므로, 지워지기 전 편집 값으로 모델을 다시 쓰는 창은 코드상 없다. 이전 기록이 남긴 "커밋과 효과 사이의 키 입력" 경우는 그대로이며(재현 안 됨) 화면 영향 없음.
- **모든 모델 재작성:** 리비전이 바뀌면 열린 모든 모델이 키 불일치로 루프에 들어가지만(`CodeEditor.tsx:116-125`), 텍스트가 같으면 쓰지 않는다(`:122`). `revealRef`에 모든 경로가 들어가나(`:124`) 공개는 슬롯이 있을 때만(`:194`), 즉 현재 사건 파일에서만 일어난다. 동작 변화 없음.
- **빠른 입력:** `audit_logins`에서 80자 따옴표 문자열을 지연 0으로 입력 후 즉시 `Control+Enter` 12회 — 값 줄과 Terminal 오류 줄이 12/12 정확히 일치. 이후 `"backup"` 즉시 실행 수락. 새로고침 중간 저장(`set_limit`에 `33` 입력 후 새로고침 → `33` 복원) 정상.
- **실행 취소 — 새 결함 (B6).** 스테이지의 마지막 사건을 엔진 표기와 같은 글자로 풀면(예: `escalate`에 `True`) 해결 후 엔진 텍스트와 모델 텍스트가 같아 `CodeEditor.tsx:122`가 `setValue`를 건너뛰고, 그래서 Monaco 실행 취소 스택에 방금 입력한 기록이 남는다. 이때 `Ctrl+Z`를 누르면: ① 이미 고정된 값 줄이 되돌려지고 ② 그 변경은 슬롯 밖이라 거부되는데 ③ 거부 처리(`CodeEditor.tsx:153-163`)가 `undo()`를 한 번 더 불러 한 단계 더 되돌린다. 브라우저: `Ctrl+Z` 1회 → `notify_security = Tr`, 2회 → `notify_security =`, 5회 → `notify_security = False`. 엔진·저장은 `True` 그대로(새로고침하면 `True`), 탭에 수정 표시도 없다. 아키텍처 §5 "화면 텍스트 = `applyEdits(render, 편집)`"(`00_overview.md:94`)과 §6.2 "거부하면 그 변경만 되돌린다"(`:151`)를 모두 어긴다. 같은 파일에 다음 함수가 추가되는 해결(`triage`, `schedule`)이나 다른 표기로 해결(`50.0`)한 경우는 `setValue`가 스택을 비워 `Ctrl+Z` 5회에도 변화 없음. 같은 코드 경로가 `63307d7`·`2effc5e`에도 있으므로 이번 커밋이 만든 회귀는 아니고, 이번 검증에서 처음 찾았다(이전 기록의 "Ctrl+Z 5회 변화 없음"은 함수가 추가되는 경우였던 것으로 보인다).

### 4.3 시나리오 일관성 (바뀐 사건의 모든 가지)

| 경로 | `review_access` 화면 | `review` 로그·플래그 | `handle_device` 화면 |
| --- | --- | --- | --- |
| backup, 1 (잠금), B2-07 | backup 설명 + "1. backup 계정을 잠근다." | "backup 계정을 잠갔다", `locked` | BACKUP-02 + "인증 실패 — backup 계정이 잠겨 있다" |
| backup, 2 (감시), B2-07 | 같음 | "감시 규칙을 걸었다", `locked` 없음 | BACKUP-02, 잠금 문구 없음 |
| backup, 1, B2-03 | 같음 | `locked` | 빈 방, 잠금 문구 없음 |
| admin/guest, 1 | "특이점이 없었다" + "1. 계정 정책만 다시 확인한다." | "계정 정책을 확인했다. 바뀐 것은 없다.", 효과 없음 | B2-07이면 BACKUP-02(잠금 문구 없음), 아니면 빈 방 |
| admin/guest, 2 | "2. 전체 계정에 감시 규칙을 건다." | "감시 규칙을 걸었다" | 위와 같음 |

- 문서 전이표 `incident-0214.md:34`(review)·`:39`(room)·`:40`(device)와 `index.ts:86-93, 145-152, 161-166` 일치. 주석 변형표 `:51`(review `backup_suspect`)·`:55`(device `device_found`, `device_locked`)와 템플릿 지시문 일치. `variantOutcomes`의 15개 지시문 목록이 변형표 10행과 정확히 대응.
- 모든 플래그가 읽힌다: `locked`는 이제 `index.ts:146`의 전이 조건에서만 읽힌다. 화면에서는 직접 쓰이지 않는다.

### 4.4 검증기

- **도달 시점 플래그:** `derive`는 다음 사건에 도달할 때 효과를 반영한 뒤의 `flags`를 `flagsAtReach`로 기록한다(`derive.ts:58, 67, 38`). 검증기는 사건이 현재일 때의 `state.flags`로 `@if`를 평가하므로(`validate.ts:121`) 렌더와 같은 값이다. 상태 키 중복 제거(`:107-109`) 뒤에 기록하지만 키가 (사건, 플래그)이므로 놓치는 조합이 없다. 같은 사건 안의 같은 지시문(`handle_device`의 `@if device_found == True` 두 줄)은 키가 같아 합쳐지는데, 조건이 같으므로 문제없다.
- **거짓 양성:** 실제 시나리오 문제 목록 `[]`. 15개 지시문 모두 `{false, true}`를 본다(프로브).
- **NV2**(평가에 빈 플래그 사용) → 실제·미니 시나리오 테스트 실패. **NV3**(거짓도 한 번은 나와야 한다로 강화) → 생존: 지금 데이터에 항상 참인 `@if`가 없고, 이를 고정하는 테스트도 없다(H2-2).
- **상태 수 상한:** 8,650 / 20,000(약 2.3배 여유), `validateScenario` 8.3초(프로브 측정). 이번 변경으로 `locked` 설정 경로가 줄어 이전 11,518보다 작아졌다.

### 4.5 실제 브라우저 (프로덕션 빌드, 4174)

| 경로 | 입력(13회) | 결과 |
| --- | --- | --- |
| P1 resolved | 1, 2, True, `"backup"`, 1, True, 1, 20, 1, `"B2-07"`, 1, 1, `"security"` | 잠금 문구 있음, "사건 INC-0214 종결 (원인 규명)" |
| P2 sealed | 3, 5, False, `"guest"`, 2, False, 3, 80, 2, `"B2-11"`, 3, 2, `'archive'` | 의심 없음 화면, 빈 방, `recipient = "archive"`, "원인 미상" |
| P3 장치 미발견·의심 없음 | 1, 2, ` False`, `"admin"`, 1, True, 2, `50.0`, 1, `"B2-03"`, 2, 1, `"facility"` | 의심 없음 화면, `limit = 50`, 빈 방(잠금 문구 없음), "원인 미상" |
| P4 의심·잠금·빈 방 | 1, 2, True, `"backup"`, 1, ` False`, 1, 20, 1, `"B2-03"`, 1, 1, `"security"` | 빈 방, 잠금 문구 없음, "원인 미상" |

- 각 경로 시작 시 `main.py`에서 실행 → `실행할 파일: incidents/event_001.py (현재 탭: main.py)`.
- 콘솔 error/warning 0건, `pageerror` 0건, 자기 호스트 밖 요청 0건.

### 4.6 빌드·린트·테스트

- `npm run build`: 성공(3.71s). 기존 500kB 청크 경고만.
- `npm run lint`: 종료 코드 0.
- `npx vitest run`: 테스트 파일 12개, 테스트 116개 모두 통과(9.51s).

### 4.7 기록

- 작업 로그 §26(`work_log.md:270-279`): B4·B5·H-R1~H-R5 서술은 재현됨. "검사 삭제 변이 6종 모두 실패"(`:275`) 사실. 테스트 116개 사실. 상태 수 "약 1.2만"(`:277`)은 틀림(실제 8,650).
- 시나리오 문서 v3·아키텍처 `00_overview.md:152`: 데이터·코드와 일치. 다만 `:151`과 실제 동작이 B6에서 어긋난다.
- P04: 문서 `P04_incident_0214_scenario.md:3`과 인덱스 `00_index.md:11` 모두 In Progress. HANDOFF `HANDOFF.md:9`는 "진행 중 — 독립 검증 대기", `:33`에서 AC-10·R-07을 Owner 몫으로 남김 — 달성 주장 없음.

## 5. 문제 / 위험

### 차단 (계약 의무)

- **B6 — 해결 직후 `Ctrl+Z`가 고정된 값을 화면에서 되돌림.** `CodeEditor.tsx:122`가 모델 텍스트가 같으면 `setValue`를 건너뛰어 실행 취소 스택이 남고, 거부 처리 `CodeEditor.tsx:153-163`이 실행 취소로 생긴 변경을 다시 `undo()`로 "되돌려" 한 단계 더 거슬러 간다. 스테이지 마지막 사건을 엔진 표기와 같은 글자로 풀면(`escalate`=`True`, `preserve_logs`=`True`, `set_limit`=`20`, `handle_device`=`2`, `submit_report`=`"security"` 등 흔한 입력) 재현된다. 화면이 `notify_security = Tr`처럼 진행과 다른(심지어 문법이 깨진) 값을 보이며, 새로고침해야 돌아온다. 아키텍처 `00_overview.md:94`(화면 정의)와 `:151`(거부 시 그 변경만 되돌림) 위반 — B5와 같은 종류. 이번 커밋의 회귀는 아니다(같은 경로가 `63307d7`·`2effc5e`에 있음). 예: 리비전이나 엔진 텍스트가 바뀐 모델은 텍스트가 같아도 다시 써서 스택을 비우고, 거부 처리에서 `e.isUndoing`이면 `redo()`, `e.isRedoing`이면 `undo()`로 되돌리기. 회귀 확인(브라우저 또는 컴포넌트 수준) 포함.

### 하드닝 권고 (비차단)

- **H2-1** (이야기 의견) 잠금 문구가 이제 backup을 잠근 플레이어만 보는 "보상"이 됐는데, 잠그지 않은 플레이어(감시)는 장치 화면에서 다른 차이가 없다. 의도라면 그대로 둬도 된다.
- **H2-2** 죽은 `@else` 검출: `@if`가 도달 시점에 한 번도 거짓이 되지 않는 경우도 보고(`validate.ts:222-224`에 `!outcomes.has(false)` 한 줄과 테스트). 지금 데이터에서는 거짓 양성 없음(NV3로 확인).
- **H2-3** 문서 목록 밖 검사 두 개(`validate.ts:144` 시작 사건, `:156-157` 스테이지 목록)에도 `it.each` 한 줄씩(M2·M3 생존).
- **H2-4** (기록) 상태 수를 실제 값(8,650)으로 고칠 것: `validate.test.ts:19`, `work_log.md:277`.
- **H2-5** (기존 H-R6 연장) 상한 2만은 지금 2.3배 여유. 플래그 하나 추가로 넘을 수 있으니 시나리오 확장 전에 증분 재생 검토.

## 6. 뮤테이션 요약

| ID | 변경 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| V6 | 문자열 옵션 설명 검사 삭제 | `validate.ts:71` | `reports string option not explained` (이전 생존 → 이제 잡힘) |
| N2 | 수치 범위 설명 검사 삭제 | `:73` | `reports number range not explained` (이제 잡힘) |
| V14 | 함수 누락 검사 삭제 | `:151` | `reports missing function` (이제 잡힘) |
| V12b | 리터럴 슬롯 없음 검사 삭제 | `:169` | `reports field without a literal slot` (이제 잡힘) |
| V13 | 수치 후보의 경계값 전부 제거 | `:26` | `explores the values next to a number condition…` (이제 잡힘) |
| V13b | ±1 제거(경계값만) | `:26` | `explores the values next to a number condition…` (이제 잡힘) |
| NV1 | 참이 되지 않는 `@if` 보고 삭제 | `:223` | `reports comment variant that is never true` |
| NV2 | 지시문 평가에 빈 플래그 | `:121` | mini, Incident 02:14, `explores the values…` (3개) |
| NV3 | (과잉 엄격) 참·거짓 모두 필요 | `:223` | 없음 — 생존, 거짓 양성도 없음(H2-2) |
| NV4 | 상태 중복 제거 삭제 | `:108-109` | 10분 안에 끝나지 않음(경로 폭발) — 판정에서 제외 |
| M1 | 중첩 `def` 검사 삭제 | `:163` | `flags a directive left outside a function and a nested def` |
| M2 | 스테이지 목록 포함 검사 삭제 | `:157` | 없음 — 생존(H2-3) |
| M3 | 시작 사건 존재 검사 삭제 | `:144` | 없음 — 생존(H2-3) |
| M4 | 화면 지시문 검사 삭제 | `:101` | `flags a directive left outside a function and a nested def` |
| S1 | 장치 문구를 `@if locked`로 되돌림(B4 재도입) | `sublevel_access.py:104` | `passes Incident 02:14…` (`device_locked` 읽히지 않음) |
| S2 | 잠금 전이에서 `backup_suspect` 조건 제거(B4 재도입) | `index.ts:87` | `passes Incident 02:14…` (전이 1 사용 안 됨) |
| S3 | B2-07 잠금 전이에서 `locked` 조건 제거 | `index.ts:146` | `passes Incident 02:14…` |

S1·S2는 검증기의 다른 검사(읽히지 않는 플래그, 쓰이지 않는 전이)가 2차로 잡은 것이다. 모든 원복은 `git diff --quiet -- <파일>` 통과, 최종 `git status --short`는 이 기록 파일만.

## 7. 판정

**조건부 합격** — B6(스테이지 마지막 사건을 엔진 표기와 같은 글자로 푼 직후 `Ctrl+Z`가 고정된 값을 화면에서 되돌려 아키텍처 §5·§6.2와 어긋남) 해소 필요

- B4·B5는 해소됐다(`derive`와 브라우저 4경로, 네 가지 다른 표기, 새로고침 전후 비교).
- 이전에 살아남은 뮤테이션 V6·V12b·V13·V13b·V14·N2는 이제 모두 각자의 테스트가 실패한다.
- `revision` 변경은 다른 슬롯 입력·빠른 입력·공개 스크롤에 회귀를 만들지 않았다(80자 12회 손실 0).
- B6은 이번 커밋의 회귀가 아니라 기존 결함이지만, B5와 같은 계약(화면 정의)을 어기므로 같은 기준으로 차단으로 둔다.
- P04를 사람 플레이 테스트 항목 말고 완료로 표시할 수 있는가: **아니오**. B6 해소(및 확인) 후 가능하다. 나머지 완료 기준(검증 테스트 통과, 두 엔딩 완주)은 충족됐다.

## 8. 남은 일 (결함 아님)

- B6 반영 후 재검증(브라우저에서 해결 직후 `Ctrl+Z`/`Ctrl+Y` 확인).
- Owner 플레이 테스트: AC-10(첫 플레이 10~20분), R-07(비개발자 관찰) — 미완이며 이 검증으로 대신할 수 없다.
- 검증자는 커밋하지 않았다. 이 기록 파일만 새로 생겼다.

## 9. 재현

```bash
cd /home/user/Hidden-Main-
npm run build && npm run lint && npx vitest run
npx vite preview --port 4174 --strictPort &   # 끝나면 이 PID와 그 vite 자식만 종료
# Playwright(저장소 밖, 경로마다 새 컨텍스트): event_001.py 탭 → 값 슬롯 클릭·End·Backspace·keyboard.type(delay 0) → 즉시 Control+Enter, 13회
# B6 재현: 1, 2, True 로 event_001.py의 세 사건을 푼 뒤 그 탭에서 Ctrl+Z 1회 → notify_security = Tr, 새로고침 → True
# B5 확인: set_limit에 50.0 → limit = 50 (새로고침 전후 동일)
# B4 확인: backup·잠금·B2-07에서만 handle_device에 "backup 계정이 잠겨 있다"
```
