# 독립 검증 — 초기 프로젝트 문서 + P01 1단계 골격

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner ("독립검증" 요청, 상위 에이전트 경유) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | 초기 SoT·아키텍처·페이즈·결정 브리프·기록 문서, P01 1단계 코드 골격 |
| 정본 기준 | `docs/plan/ideation.md` 기획안 v0.1(원천 입력), `docs/SOT.md` v0.2, `docs/guides/verification.md`, `docs/guides/phase-and-decision-briefs.md`, `docs/guides/data-contracts.md`, `docs/guides/records-and-handoff.md` |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, 커밋 `0900a11`, `1a2571d`, `2b2b0e3` (범위 `55b5923..2b2b0e3`, HEAD `2b2b0e37d27eba580221237c20111575c9bc34b0`). 작업 트리 깨끗함(`git status --short` 출력 없음) |

## 2. 범위

1. ideation 충실도 — 원칙·MVP P0/P1/P2·스테이지 표·완료 기준(§10)·위험 대응이 SoT/아키텍처/페이즈에 반영되었는지, 또는 명시적으로 보류·결정되었는지
2. 문서 간 내부 일관성 — SoT ↔ 아키텍처 ↔ 페이즈 ↔ 브리프 ↔ HANDOFF/작업 로그/CHANGELOG, DB-01~04(B) 반영과 잔존 "미결/대기" 문구, 인덱스와 페이즈 문서의 상태 일치
3. 결정 브리프 형식 — 선택지 표 보존, 해결 기록(날짜·근거·상태)
4. 데이터 계약 — 소유권, 중복 표현, `00_overview.md` ↔ `01_data_contracts.md` 모순
5. 링크·앵커
6. 기록 규칙 — HANDOFF 완료 서술 금지, 작업 로그 필수 섹션, 한국어 규칙
7. 코드 골격 — `npm run build` / `npm run lint` / `npm test` / `npx vitest run --passWithNoTests`, 설정 점검, P01 범위·아키텍처 §7 디렉터리 계획과의 정합

뮤테이션 테스트: **해당 없음.** 대상 범위에 동작 코드(`src/app/App.tsx:1-3`은 빈 `div` 반환)와 테스트가 없어 되살릴 결함이나 물어야 할 가드가 없다.

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git log --oneline 55b5923..HEAD
git diff --stat 55b5923..HEAD
git diff 55b5923..HEAD --stat -- docs/plan/ideation.md   # 출력 없음 = ideation 미수정
cat -n docs/plan/ideation.md docs/SOT.md docs/architecture/*.md docs/phases/*.md docs/decision_briefs/*.md HANDOFF.md CHANGELOG.md docs/daily_logs/2026-10-22/work_log.md
# 잔존 문구 탐색
grep -rnE '대기|미결|미정|결과에 따라|Waiting|undecided|선택 시' docs/SOT.md docs/architecture docs/phases docs/decision_briefs HANDOFF.md CHANGELOG.md docs/daily_logs
# 링크·앵커: 상대 경로 존재 + GitHub 방식 헤딩 슬러그 대조 (스크래치 스크립트, 저장소 밖)
python3 -I links.py /home/user/Hidden-Main- docs/SOT.md docs/architecture/00_overview.md docs/architecture/01_data_contracts.md docs/phases/*.md docs/decision_briefs/*.md HANDOFF.md CHANGELOG.md docs/daily_logs/2026-10-22/work_log.md
# 골격
npm run build; echo $?
npm run lint;  echo $?
npm test;      echo $?
npx vitest run --passWithNoTests; echo $?
npm ls --depth=0
# lint가 실제로 규칙을 적용하는지 확인: 저장소 밖 임시 파일에 `debugger` 넣고 실행
npx oxlint -c .oxlintrc.json <scratch>/probe.ts; echo $?
wc -l HANDOFF.md
```

ideation의 각 절(§1.2, §2.1~2.4, §3.1~3.2, §4.2~4.4, §5, §5.1, §6.1~6.3, §7.1~7.3, §8, §9, §10, §11, §12)을 한 줄씩 대응 문서와 대조했다.

## 4. 결과

### 4.1 ideation 충실도

- `docs/plan/ideation.md`는 범위 내에서 수정되지 않았다(diff 출력 없음).
- 설계 원칙 9개(ideation:25-33) → R-01~R-07(`docs/SOT.md:38-44`)에 모두 대응. 원칙 3의 "조건식" 수정은 P1로 명시(`docs/SOT.md:67`). R-08(`docs/SOT.md:45`)은 ideation:248, :354에서 유도된 것으로 근거 있음.
- P0 15개(ideation:362-376) → `docs/SOT.md:104-110`에 전부 대응.
- P1 8개(ideation:380-387) → `docs/SOT.md:114-115`에 전부 대응. 단 "사용자 선택 이력"이 "사용자 선택 이력 UI"로 바뀌었고, "히든 엔딩"(ideation:215는 "후속 버전으로 분리")이 P1로 분류되었다(`docs/SOT.md:114`, `docs/decision_briefs/01_mvp_dynamic_content_scope.md:36`). 가정 표시가 없다 → 개선 권고 H8.
- P2 6개(ideation:391-396) → `docs/SOT.md:119` 전부 대응.
- 스테이지 표(ideation:190-196) → `docs/SOT.md:123-129` 동일. 초기 파일·함수 수(ideation:198-200) → `docs/SOT.md:131-132`.
- 완료 기준 10개(ideation:489-498) → AC-01~AC-10(`docs/SOT.md:141-152`) 의미 보존. P05 완료 증거(`docs/phases/P05_polish_and_release.md:24`)에서 전체 점검.
- 위험 7개(ideation:475-481): 자유 수정 → R-08·DB-02, 진행 방법 → `P04:28`(R-07 관찰), 더미 코드 → `P04:17`, 분기 관리 → `docs/SOT.md:133`·`P04:18`, 파일 상태 충돌 → `docs/architecture/00_overview.md:79-92`, 새로고침 → `P03:24,30-31`, 콘텐츠 시간 → `docs/SOT.md:110`. 누락 없음.
- 일정(ideation:402-467) → `docs/phases/00_index.md:16-21`, 첫 프로토타입(ideation:508-516) → `docs/phases/P02_core_loop_prototype.md:16-21` 전부 대응.
- GameState(ideation:331-339)의 7개 항목은 `docs/architecture/01_data_contracts.md:88-96`에 파생/정본/UI 상태로 분류되어 이유와 함께 기록. `description` 제거도 이유가 있음(`01_data_contracts.md:67`). 그러나 `initialCode`→`template`, `unlockCondition`→`unlock`, Scene의 `effects`→`Transition.effects` 이동(ideation:318, :320, :329 ↔ `01_data_contracts.md:40,42,61`)은 이유가 기록되지 않았다 → H5.
- 작업 가정(`Cmd+Enter`, 배포 호스트)은 `docs/SOT.md:166-169`에 가정으로 명시됨. 적절.

### 4.2 내부 일관성

- DB-01~04 B 반영: SoT §3.2~3.4·§5.2·§7(`docs/SOT.md:69-83,115,158`), 아키텍처(`00_overview.md:46,91-92,104,121`, `01_data_contracts.md:67-69,122-130`), 페이즈(`P02:12`, `P03:12-14`, `P04:12`, 각 "해결됨")에 반영됨. SoT §8(`docs/SOT.md:164`)과 HANDOFF(`HANDOFF.md:7`) 모두 "미결 Owner 결정 없음".
- 페이즈 상태: 인덱스(`docs/phases/00_index.md:8-12`)와 각 문서 헤더(`P01:3` In Progress, `P02:3`~`P05:3` Planned) 일치. 브리프 연결: 인덱스 P02→DB-02, P03→DB-01/03/04, P04→DB-01이 각 페이즈 문서의 "관련 결정 브리프"와 일치.
- **모순 1 (차단):** `docs/architecture/00_overview.md:55`는 실행 대상을 "커서가 속한/현재 활성 사건 ID"로 정한다. 반면 DB-03(B)를 반영한 `docs/SOT.md:77-78`은 "실행 대상은 항상 가장 마지막 함수", "해결한 함수는 다시 실행할 수 없다"고 한다. 커서 기준 선택은 해결된 함수의 재실행 경로를 열어 SoT와 충돌한다.
- **모순 2 (차단):** `docs/phases/P03_story_engine_and_save.md:31` 완료 기준은 새로고침 후 "같은 위치·같은 파일·같은 로그로 복원"을 요구한다. 그러나 열린 파일은 `WorkspaceView`로 "저장: 선택 (편의용)"(`docs/architecture/01_data_contracts.md:18`)이고, `SaveSnapshot`(`01_data_contracts.md:138-147`)에는 해당 필드가 없다. "같은 파일"이 열린 파일이라면 계약이 이를 지원하지 않고, 해금 파일 목록이라면 문구가 모호하다. 완료 기준이 계약으로 판정 불가.
- **모순 3 (차단):** `docs/phases/P02_core_loop_prototype.md:29` "잘못된 값 실행 후 Explorer·로그 외 상태가 변하지 않음"은 Explorer 변경을 예외로 허용하는 문장이다. 같은 문서 `P02:22`("상태 변화 없음"), `docs/SOT.md:54`, AC-07(`docs/SOT.md:149`)과 충돌한다. 잘못된 입력 시 Explorer는 바뀌면 안 된다(로그만 예외).
- 잔존 미결 문구: `docs/daily_logs/2026-10-22/work_log.md:56-59` 결과 열이 "Owner 결정 대기"로 남아 있다. `work_log.md:61`의 주석으로 상쇄되지만 표 자체는 갱신되지 않았다 → H2. `docs/architecture/01_data_contracts.md:132`의 "어느 쪽이든"은 결정 전 복수 대안을 전제한 잔존 문구다 → H1.

### 4.3 결정 브리프 형식

- 네 브리프 모두 상태 `Resolved`(`01:3`, `02:3`, `03:3`, `04:3`), 선택지 표 A/B/C 보존(`01:19-23`, `02:14-18`, `03:12-16`, `04:12-16`), 권장안은 표 아래, "결정" 절에 선택지·날짜(2026-10-22)·결정자·근거·상태 기록(`01:40`, `02:36`, `03:33`, `04:33`). 가이드(`docs/guides/phase-and-decision-briefs.md`의 "After a decision") 충족.
- "후속 고려 사항"에 선택되지 않은 대안 조건문이 남아 있고(`01:31-32` "A 선택 시", `02:27` "A/C 선택 시"), B에 딸린 후속 결정이 페이즈 범위로 옮겨지지 않았다: `02:26`(값 영역 시각 표시, P02) ↔ `P02:16-23` 없음, `03:24`(함수 추가 시 로그/커서, P03) ↔ `P03:18-25` 없음, `04:24`(함수·클로저 금지 검사, P03) ↔ `P03` 없음 → H3.

### 4.4 데이터 계약

- 소유권 표(`01_data_contracts.md:11-19`)는 개념별 정본 소유자·쓰기 권한·저장 여부를 명시. 진행 상태 정본을 `Progress.choices` 하나로 두고 나머지를 파생(`01:77`, `01:88-98`, `00_overview.md:73-75`)하여 쓰기 가능한 중복 상태는 없다. 기본값·허용값의 정본도 명시(`01:159-166`).
- 오류 종류: `00_overview.md:102`에 5종(누락·중복·리터럴 아님·타입 불일치·범위 밖)이 있으나 `01_data_contracts.md`에는 `ParseError`·`ChoiceInput`의 형태가 없다(`01:14`는 이름만, `00_overview.md:56`은 `ParseError[]` 참조) → H4.
- `PlayerEdits` 형태: `01:125`는 사건→필드→원문 리터럴. `00_overview.md:55-56`은 "현재 파일의 편집 내용"(전체 텍스트)을 `Engine.parse(scene, text)`에 넘긴다. DB-02(B)에서는 `render`로 만든 텍스트를 다시 파싱하는 왕복이 되며, 파서 입력이 무엇인지(리터럴 맵 vs 렌더된 텍스트) 두 문서가 다르게 읽힌다 → H15. (모순 1과 같은 줄이므로 함께 정리 권장.)
- 저장 규칙: `00_overview.md:57`("실패 시 저장 없음")과 `01:150`(편집 변경 시 디바운스 저장, 실행 실패 시 진행 상태 미저장)은 "진행 상태" 기준으로 읽으면 양립한다.
- 미정의 타입: `Condition`, `Effect`, `LogLine`, `Ending`, `StaticFile`, `SceneId`/`StageId`/`EndingId`(`01:28-64`). 초안 표기(`01:5`)와 P03 범위(`P03:18`)로 위임되어 있어 현재 차단 사유는 아님 → H4.
- 값 타입 합집합 `number | boolean | string`이 `01:82`, `01:107`에 수기 중복. DB-03 고정 표시는 `Progress.choices`의 타입 값에서 리터럴을 재생성해야 하는데(`01:130`) 원문 따옴표 형태 등은 보존되지 않는다 → H6.
- `scenarioVersion` 불일치 시 잘린 기록 이후 사건의 `PlayerEdits` 처리가 정해지지 않음(`01:153`) → H7.

### 4.5 링크·앵커

- 검사 대상 13개 문서의 상대 링크 63개 전부 존재, 앵커(`#7-디렉터리-구조-예정`, `#6-input-parser-규칙-mvp`, `#6-저장-계약`, `#54-mvp-스테이지-구성`, `#6-mvp-완료-기준-v01`, `#8-테스트-전략`, `#5-파일-내용의-3계층`, `#5-플레이어-편집-계약`) 전부 해석됨. 결과 `checked=63 bad=0`.

### 4.6 기록 규칙

- `HANDOFF.md`(22줄, `HANDOFF.md:3` 자가 검수 줄과 일치)에는 완료 서술·테스트 수·해시가 없다. 현재 상태·주의·다음 작업만 있음. `HANDOFF.md:17`의 `npm test` 실패 안내는 재현 결과와 일치.
- 작업 로그 필수 섹션(목표 `work_log.md:3`, 완료한 작업 `:7`, 발견한 문제 `:52`, 결정 `:63`, 다음 단계 `:73`) 존재. Owner 결정과 근거 기록(`:65-70`). 단 목표(`:5`)에 골격·결정 반영 작업이 없음 → H2.
- CHANGELOG 상단 표 + 작업 로그 링크(`CHANGELOG.md:5`), Owner 결정 요약(`CHANGELOG.md:12`) 포함.
- 언어: 대상 기록 문서 전부 한국어. 식별자·명령만 원문 유지. 규칙 준수.
- `work_log.md:44` 주장("`npm run build` 성공, `npm run lint` 종료 코드 0, `vitest run --passWithNoTests` 실행 확인")은 아래 4.7에서 재현됨.

### 4.7 코드 골격

| 명령 | 종료 코드 | 관찰 |
| --- | --- | --- |
| `npm run build` | 0 | `tsc -b` 통과, vite 8.3.5, 16 modules, `dist/assets/index-*.js 219.54 kB` |
| `npm run lint` | 0 | 출력 없음(진단 0건) |
| `npm test` | 1 | `No test files found, exiting with code 1` (include `src/**/*.test.ts`) |
| `npx vitest run --passWithNoTests` | 0 | `No test files found, exiting with code 0` |
| `npm ls --depth=0` | 0 | react/react-dom 19.3.1, typescript 6.0.3, vite 8.3.5, vitest 5.0.5, oxlint 1.89.0 — `package.json:13-26`와 lock 일치 |
| oxlint 탐지 확인 | 0 | 임시 파일의 `debugger`를 `warning eslint(no-debugger)`로 탐지하지만 종료 코드는 0 |

- 설정: `tsconfig.app.json:20` `strict: true`, `include: ["src"]`(`:26`). `tsconfig.node.json`에는 `strict`가 없다(`tsconfig.node.json:2-21`) → H9. `vite.config.ts:1`의 `/// <reference types="vitest/config" />`로 `test` 필드 타입 검사가 `tsc -b`를 통과함. `vite.config.ts:8` include가 `*.test.ts`만이라 `.test.tsx` 테스트는 조용히 제외된다 → H10. `package.json:9` `oxlint`는 경고에 실패하지 않는다 → H11.
- `npm test` 종료 코드 1: P01은 In Progress이고 P01 완료 기준(`P01:29`, `00_index.md:8`)이 "샘플 테스트 1개 통과"를 요구하므로 1단계 시점에서 허용 가능. `HANDOFF.md:17`에 알려진 상태로 명시되어 있다. `--passWithNoTests`로 숨기지 않은 선택은 적절하다. 단 P01 완료 전에 반드시 해소되어야 한다.
- 범위 정합: `src/app/App.tsx`, `src/main.tsx`는 `00_overview.md:110-119`의 `app/` 계획과 일치. 게임 UI 없음(R-01), 제목 `incident-workspace`(`index.html:6`). `engine/`, `scenario/`, `persistence/`, `ui/` 골격(`P01:16`)은 아직 없으며 `HANDOFF.md:21-22`의 2·3단계 계획에도 명시되지 않았다(빈 디렉터리는 git에 남지 않음) → H13.

## 5. 문제 / 위험

### 5.1 차단 (계약 의무)

1. **실행 대상 사건 규칙 모순** — `docs/architecture/00_overview.md:55`("커서가 속한/현재 활성 사건") vs `docs/SOT.md:77-78`(항상 마지막 함수, 해결된 함수 재실행 불가, DB-03 B). 아키텍처를 SoT에 맞춰 "현재 사건 = `derive`의 `currentSceneId`"로 고쳐야 한다.
2. **P03 복원 완료 기준과 저장 계약 불일치** — `docs/phases/P03_story_engine_and_save.md:31` "같은 파일" vs `docs/architecture/01_data_contracts.md:18`(WorkspaceView 저장 선택), `:138-147`(SaveSnapshot에 열린 파일 없음). 기준 문구를 해금 파일 목록으로 한정하거나, 계약에 열린 파일 저장을 추가해야 한다.
3. **P02 완료 기준이 잘못된 입력 시 Explorer 변경을 허용** — `docs/phases/P02_core_loop_prototype.md:29` vs `P02:22`, `docs/SOT.md:54`, `docs/SOT.md:149`(AC-07). "로그 외 상태(Explorer 포함)가 변하지 않음"으로 고쳐야 한다.

### 5.2 개선 권고 (비차단)

- H1. `docs/architecture/01_data_contracts.md:131-132` "어느 쪽이든" 잔존 문구 제거.
- H2. `docs/daily_logs/2026-10-22/work_log.md:56-59` 결과 열을 "DB-0x B로 해결"로 갱신, 목표(`:5`)에 P01 1단계·결정 반영 추가.
- H3. 브리프 후속 고려의 미선택 대안 조건문 정리(`01_mvp_dynamic_content_scope.md:31-32`, `02_editing_model.md:27`), B의 후속 결정을 페이즈 범위로 이관(`02_editing_model.md:26`→P02, `03_scene_reveal_in_file.md:24`·`04_scenario_data_format.md:24`→P03).
- H4. `ChoiceInput`·`ParseError`(오류 5종 열거)와 `Condition`/`Effect`/`LogLine`/`Ending`/`StaticFile`/ID 타입을 계약에 정의(`01_data_contracts.md:14,28-64`, `00_overview.md:56,102`). P03 착수 전 권장.
- H5. ideation 필드 개명·이동 이유 기록(`01_data_contracts.md:40,42,61` ↔ ideation:318,320,329).
- H6. 값 타입 합집합 단일화(`01_data_contracts.md:82,107`), 고정 표시 시 리터럴 재생성 규칙 명시(`:130`).
- H7. `scenarioVersion` 불일치 시 `PlayerEdits` 정리 규칙(`01_data_contracts.md:153`).
- H8. 히든 엔딩 P1 분류·"선택 이력 UI" 표현을 가정으로 표시(`docs/SOT.md:114`, `01_mvp_dynamic_content_scope.md:36`).
- H9. `tsconfig.node.json`에 `strict: true` 추가.
- H10. `vite.config.ts:8` include에 `src/**/*.test.tsx` 추가 여부 결정.
- H11. `package.json:9` lint 스크립트를 `oxlint --deny-warnings` 등으로 게이트화 여부 결정.
- H12. P01 완료 전 첫 테스트 추가로 `npm test` 종료 코드 0 확보(`package.json:10`, `HANDOFF.md:17`).
- H13. P01 디렉터리 골격(`P01:16`) 처리 방식을 2·3단계 계획(`HANDOFF.md:21-22`)에 명시.
- H14. `choices` 재생 설계의 Owner 검토 미완(`HANDOFF.md:16`, `work_log.md:70`)을 P03 선행 조건으로 추적.
- H15. 파서 입력을 `PlayerEdits` 리터럴로 할지 렌더 텍스트로 할지 명시(`00_overview.md:55-56` ↔ `01_data_contracts.md:125`).

## 6. 판정

**조건부 합격** — 차단 3건(아키텍처 §3 실행 대상 규칙의 SoT §3.3 불일치, P03:31 복원 기준과 저장 계약 불일치, P02:29 잘못된 입력 시 Explorer 변경 허용 문구)을 문서 수정으로 해소할 것.

근거:

- ideation의 원칙·P0/P1/P2·스테이지·완료 기준·위험 대응이 누락 없이 반영되었고, ideation은 수정되지 않았다.
- DB-01~04 B 해결이 SoT·아키텍처·페이즈·기록에 일관되게 반영되었고 브리프 형식이 가이드를 충족한다. 링크 63개 전부 유효.
- 골격은 빌드·lint 통과, `npm test` 실패는 1단계에서 알려진·기록된 상태로 허용 범위.
- 그러나 문서 사이에 세 건의 계약 모순이 있어 정책상 차단이다. 모두 코드 이전 단계의 문구 수정으로 닫을 수 있다.

## 7. 미결 운영 사항

- 이 검증 기록은 커밋되지 않았다(검증자는 커밋 금지). 커밋 여부는 Owner가 정한다.
- P01 2·3단계는 Owner 확인 후 진행 예정(`work_log.md:75-76`).
- 차단 3건 수정은 검증자가 하지 않았다. 수정 방향은 Owner/작업자가 정한다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git diff 55b5923..HEAD --stat -- docs/plan/ideation.md
sed -n 52,58p docs/architecture/00_overview.md; sed -n 74,78p docs/SOT.md
sed -n 18p docs/architecture/01_data_contracts.md; sed -n 138,147p docs/architecture/01_data_contracts.md; sed -n 31p docs/phases/P03_story_engine_and_save.md
sed -n 22p docs/phases/P02_core_loop_prototype.md; sed -n 29p docs/phases/P02_core_loop_prototype.md
npm run build; echo $?
npm run lint; echo $?
npm test; echo $?
npx vitest run --passWithNoTests; echo $?
```
