# 독립 재검증 — 초기 문서 + P01 1단계 골격 (지적 사항 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner ("수정 후 재검증" 요청, 상위 에이전트 경유) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 수정을 작성하지 않음) |
| 대상 | 커밋 `4c45e06` "Address independent verification findings on docs and scaffold" (`git diff 0380271..4c45e06`, 17개 파일) 및 그 결과 상태의 문서 전체·설정 |
| 정본 기준 | `docs/SOT.md` v0.3, `docs/architecture/00_overview.md` v0.2, `docs/architecture/01_data_contracts.md` v0.2, 해결된 브리프 DB-01~04, 원천 `docs/plan/ideation.md` v0.1, 이전 기록 `docs/verifications/2026-10-22/initial_docs_and_p01_scaffold.md`(조건부 합격, 차단 B1~B3, 권고 H1~H15), `docs/guides/verification.md`, `docs/guides/data-contracts.md`, `docs/guides/phase-and-decision-briefs.md`, `docs/guides/records-and-handoff.md` |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `4c45e06c884c601f3cffa89133c3eefd0e9a0833`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. 이전 기록의 B1~B3, H1~H15 각각의 해소 여부 (H12는 P01 2단계로 이연 — 완료 조건으로 추적되는지)
2. 수정이 새로 만든 회귀: 문서 간 모순, 제거된 개념(`ChoiceInput`, `AppliedChoice`, `Stage.unlock`, 함수 범위 텍스트 탐색, 누락·중복 오류, "같은 파일" 복원)의 잔존 참조, 번호가 바뀐 데이터 계약 절의 링크·앵커
3. 수정에 포함된 새 설계 선택의 SoT·ideation 정합성, 결정/가정 표시, 데이터 계약 가이드(중복 소유·파생 가능 저장 필드 금지) 준수
4. `npm run build` / `npm run lint`(`--deny-warnings`) / `npm test` / `npx vitest run --passWithNoTests` 재실행, lint 경고 실패 동작 확인
5. 결정 브리프: 선택지 표 보존, 후속 고려에서 미선택 대안 조건문 제거, 이관된 후속 결정의 페이즈 범위 존재
6. `docs/plan/ideation.md` 미수정

뮤테이션 테스트: **해당 없음.** 대상에 동작 코드(`src/app/App.tsx`는 빈 화면)와 테스트 파일이 없어 되살릴 결함이나 물어야 할 가드가 없다.

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short                                   # 출력 없음
git log --oneline -5
git diff --stat 0380271..4c45e06
git diff 0380271..4c45e06                            # 전체 diff 정독
git diff 55b5923..4c45e06 --stat -- docs/plan/ideation.md   # 출력 없음 = 미수정
cat -n docs/SOT.md docs/architecture/00_overview.md docs/architecture/01_data_contracts.md \
       docs/phases/P0{1,2,3}_*.md docs/phases/00_index.md docs/decision_briefs/*.md \
       HANDOFF.md docs/daily_logs/2026-10-22/work_log.md
sed -n 88,104p docs/plan/ideation.md; sed -n 308,356p docs/plan/ideation.md   # §2.3, §6.2, §6.3 대조
# 잔존 참조 탐색
grep -rnE 'ChoiceInput|AppliedChoice|Stage\.unlock|unlock:|함수 범위|함수 본문|누락|중복 정의|같은 파일|편의용|parse\(scene, text\)|커서가 속한|v0\.2|data_contracts\.md#|00_overview\.md#|선택 이력|되돌리기|히든' \
  --include=*.md . | grep -v node_modules | grep -v docs/verifications/ | grep -v docs/plan/
grep -rnE '데이터 계약 §|아키텍처 §|SoT §[0-9]' --include=*.md docs HANDOFF.md
# 브리프 구조
for f in docs/decision_briefs/*.md; do grep -nE '^\| [ABC] \||^\*\*상태|^## |선택 시' $f; done
# 링크·앵커 (저장소 밖 스크래치 스크립트: 상대 경로 존재 + GitHub 방식 헤딩 슬러그 대조)
python3 -I <scratch>/links.py /home/user/Hidden-Main- docs/SOT.md docs/architecture/00_overview.md \
  docs/architecture/01_data_contracts.md docs/phases/*.md docs/decision_briefs/*.md HANDOFF.md CHANGELOG.md \
  docs/daily_logs/2026-10-22/work_log.md
# 골격
npm run build >/dev/null 2>&1; echo $?
npm run lint; echo $?
npm test; echo $?
npx vitest run --passWithNoTests; echo $?
# lint 게이트 확인: 저장소 밖 스크래치 파일에 `debugger`
npx oxlint --deny-warnings <scratch>/probe/probe.ts; echo $?
npx oxlint <scratch>/probe/probe.ts; echo $?
grep -n strict tsconfig.node.json; grep -n include vite.config.ts; grep -n '"lint"' package.json
wc -l HANDOFF.md
git status --short                                   # 마지막에도 이 기록 파일 외 변화 없음
```

## 4. 결과

### 4.1 이전 차단·권고 항목 상태

| ID | 상태 | 근거 |
| --- | --- | --- |
| B1 실행 대상 규칙 | **해소** (단, 새 모순 N1 발생 — 4.2) | `docs/architecture/00_overview.md:55`가 실행 대상을 `derive`의 `currentSceneId`로 고정, `:65` 해결된 함수 재실행 불가 명시. `docs/SOT.md:77-78`과 일치 |
| B2 P03 복원 기준 ↔ 저장 계약 | **해소** | `docs/architecture/01_data_contracts.md:19`(`WorkspaceView` 저장 "함"), `:196-202`(타입·정리 규칙), `:215`(`SaveSnapshot.workspace`), `docs/phases/P03_story_engine_and_save.md:34`("같은 열린 탭과 활성 파일") — 판정 가능한 문구가 됨. `docs/SOT.md:172`에 작업 가정으로 표시 |
| B3 P02 잘못된 입력 시 Explorer | **해소** | `docs/phases/P02_core_loop_prototype.md:29` "Terminal 오류 출력 외에는 Explorer·파일 내용·진행 상태 모두 변하지 않음", `00_overview.md:57,64`와 일치 |
| H1 "어느 쪽이든" 잔존 | 해소 | `01_data_contracts.md:189` |
| H2 작업 로그 결과 열·목표 | 해소 | `docs/daily_logs/2026-10-22/work_log.md:5-8`, `:73-76` |
| H3 브리프 후속 정리·이관 | 해소 | `01_mvp_dynamic_content_scope.md:31-32`, `02_editing_model.md:26-27`, `03_scene_reveal_in_file.md:24`, `04_scenario_data_format.md:24`; 이관처 `P02_core_loop_prototype.md:18`, `P03_story_engine_and_save.md:24-26` |
| H4 미정의 타입 | 해소 | `01_data_contracts.md:27-33`, `:52`, `:82-91`, `:114-127` |
| H5 ideation 필드 개명 이유 | 대부분 해소 | `01_data_contracts.md:98-106`. `scenes`→`sceneIds` 개명, `functionName` 의미 변경(ideation:325 "코드상 함수 이름" ↔ `:64` "블록을 찾는 키")은 표에 없음(경미) |
| H6 값 타입 단일화·리터럴 재생성 | 해소 | `01_data_contracts.md:31`(정의), `:86,89,120,164`(참조), `:174`(재생성 규칙). 수기 합집합 잔존 없음(grep) |
| H7 `scenarioVersion` 불일치 시 편집 값 | 해소 | `01_data_contracts.md:224` |
| H8 히든 엔딩·선택 이력 표현 | 해소 | `docs/SOT.md:114-115`. 참고: DB-01(우선순위 1위)은 이미 `01_mvp_dynamic_content_scope.md:36`에서 히든 엔딩을 P1로 둔다 — "작업 가정" 표시는 중복이지만 무해. `P03_story_engine_and_save.md:39`의 "되돌리기 UI·선택 이력 UI"는 옛 표현(경미) |
| H9 `tsconfig.node.json` strict | 해소 | `tsconfig.node.json:17` |
| H10 `.test.tsx` 포함 | 해소 | `vite.config.ts:8` |
| H11 lint 게이트 | 해소 | `package.json:9`. 프로브: `--deny-warnings` 종료 코드 1, 플래그 없이 0 (4.5) |
| H12 `npm test` 종료 코드 0 | **이연 — 추적됨** | `P01_ide_shell.md:29`(완료 기준), `docs/phases/00_index.md:8`(완료 증거 "`npm test` 통과"), `HANDOFF.md:17`. 현재 종료 코드 1 재현 |
| H13 디렉터리 골격 | 해소 | `P01_ide_shell.md:16`, `HANDOFF.md:23-24` |
| H14 `choices` 재생 설계 Owner 검토 | 해소 | `P03_story_engine_and_save.md:15`, `00_index.md:10` 선행 조건, `HANDOFF.md:16` |
| H15 parser 입력 | 해소 (단, 새 공백 N2 — 4.3) | `00_overview.md:56,100,105`, `01_data_contracts.md:113,130` |

### 4.2 회귀 탐색

- 잔존 참조: `ChoiceInput`·`AppliedChoice`는 작업 로그의 변경 설명(`work_log.md:60`)에만 남음. `Stage.unlock`은 대응 표(`01_data_contracts.md:103`)와 로그에만 있음. 함수 범위 탐색·`parse(scene, text)`·"커서가 속한"·"편의용" 잔존 없음. "누락·중복"은 "다루지 않는다"는 문맥(`00_overview.md:104`, `01_data_contracts.md:130`, `02_editing_model.md:27`)과 선택지 표 A(`02_editing_model.md:16`, 보존 대상)에만 있음. 적절.
- 링크·앵커: 상대 링크 67개 전부 존재, 앵커(`#4-입력-계약-parser`, `#7-플레이어-편집-계약`, `#9-저장-계약`, `#4-상태-모델-요약` 등) 전부 해석 — `checked=67 bad=0`. 본문 속 "데이터 계약 §N" 표기도 새 번호(§4, §7, §9)와 일치.
- **N1 (새 모순, 차단):** 이번 수정으로 추가된 `docs/SOT.md:171`("`Ctrl/Cmd+Enter`는 커서 위치·활성 탭과 무관하게 현재 사건을 실행")과 `00_overview.md:65`는, 같은 SoT의 `docs/SOT.md:55`("플레이어가 그 파일을 열면 다음 스테이지가 시작된다"), AC-05(`docs/SOT.md:148`), ideation §2.3 4단계(`docs/plan/ideation.md:98`)와 충돌한다. 새 파일이 해금된 직후 플레이어가 그 파일을 열지 않고 `main.py`나 이전 파일 탭에서 `Ctrl+Enter`를 누르면, 아직 열지도·읽지도 않은 다음 스테이지의 첫 사건이 템플릿 기본값(`01_data_contracts.md:130`)으로 실행되어 진행된다. 계약에는 "파일을 연 적 있음"이 어떤 상태로도 표현되지 않으므로(`WorkspaceView`는 UI 상태, `01_data_contracts.md:152`) "열면 시작"을 판정할 수단도 없다. SoT 같은 층위 안의 충돌이며 SoT §1 규칙(`docs/SOT.md:21`)상 Owner에게 물어야 한다. 가정 표시(§8)는 되어 있으나 §3·AC-05와의 충돌은 언급되지 않았다.
- `HANDOFF.md:7`이 여전히 "SoT v0.2"라고 적는다(SoT는 `docs/SOT.md:3` v0.3). 이번 커밋이 HANDOFF를 고쳤지만 이 줄은 갱신하지 않았다 → R1.
- 그 외 SoT ↔ 아키텍처 ↔ 페이즈 사이 새 모순은 찾지 못했다. 해금 파생 규칙(`01_data_contracts.md:103,150`)은 `docs/SOT.md:55`의 "완료 조건 만족 시 다음 파일 추가"와 `DerivedState.unlockedFiles`(`:165`)와 양립한다.

### 4.3 새 설계 선택 점검

| 선택 | SoT·ideation 정합 | 표시 | 데이터 계약 가이드 |
| --- | --- | --- | --- |
| `Stage.unlock` 삭제(전이 그래프에서 파생) | 정합. 조건부 파일은 DB-01로 P1(`docs/SOT.md:83`) | 데이터 계약 대응 표(`01_data_contracts.md:103`)와 작업 로그(`work_log.md:60`)에 이유 기록. ideation 필드 삭제이나 아키텍처 층위 설계라 Owner 결정 불요로 판단 | 같은 사실의 이중 기록 제거 — 가이드에 부합 |
| parser 입력 = 필드별 원문 리터럴 | DB-02(B)와 정합 | 아키텍처 결정으로 기록(`00_overview.md:100`) | 렌더 텍스트 왕복 제거. 단 **N2**: 편집하지 않은 필드의 "템플릿 기본값 원문"(`00_overview.md:100`, `01_data_contracts.md:130`)을 누가 템플릿에서 꺼내 parser에 넘기는지 정해지지 않았다. 호출 형태 `Engine.parse(scene, playerEdits[scene.id])`(`00_overview.md:56`)에는 템플릿이 없고 `Scene`에도 기본값이 없으며(`01_data_contracts.md:95`), "Parser는 텍스트 위치를 모른다"(`00_overview.md:105`). 같은 위치 정보가 `render`(플레이어 편집·고정 값 삽입, `00_overview.md:91`, `01_data_contracts.md:174`)에도 필요하지만 P03 표식 문법 결정(`P03_story_engine_and_save.md:24`)은 사건 블록·주석 변형 블록만 언급한다 → H-N2 |
| 활성 탭과 무관한 실행 | **N1과 충돌** (4.2) | 작업 가정 표시(`docs/SOT.md:171`, `00_overview.md:65`) — 적절하나 충돌 미언급 | — |
| `SaveSnapshot.workspace` | AC-08 "진행 상태 유지"(`docs/SOT.md:151`)보다 넓은 요구. 작업 가정으로 표시(`docs/SOT.md:172`) | 적절. 단 `01_data_contracts.md:19`가 AC-08을 "같은 화면"으로 인용하나 AC-08 원문에 그 말은 없다 → H-N3 | 파생 불가 UI 상태라 저장해도 중복 아님. 복원 시 정리 규칙 있음(`:202`) |
| `scenarioVersion` 불일치 시 `playerEdits` 폐기 | 정합. AC-07·AC-08을 해치지 않음(편집은 미실행 입력, `:189`) | 계약 규칙으로 기록(`:224`) | 해당 없음 |
| `Choice` 단일 타입(parser 출력 = 진행 기록) | 정합 | `01_data_contracts.md:14,142` | 중복 타입 제거 — 부합 |

추가 관찰(경미):

- `Clause.op`의 `>=`/`<=`가 `Value`의 불리언·문자열에 대해 의미가 정해져 있지 않다(`01_data_contracts.md:85-86`).
- `Scene.transitions`의 "마지막은 빈 조건이어야 함"(`01_data_contracts.md:66`)은 새 시나리오 불변식이지만 P04 시나리오 검증 테스트 목록(`docs/phases/P04_incident_0214_scenario.md:20`)에 없다.
- 작업 로그 "결정" 절(`work_log.md:84-91`)에는 새 작업 가정(활성 탭 무관 실행, 탭 복원)이 없고 `:91`은 단축키 가정만 적는다. "발견한 문제" 표(`:77`)에는 있음.

### 4.4 결정 브리프

- 네 브리프 모두 `Resolved`, 선택지 표 A/B/C 보존(`01:21-23`, `02:16-18`, `03:14-16`, `04:14-16`). 이번 diff는 표 행을 바꾸지 않았다(`git diff 0380271..4c45e06 -- docs/decision_briefs`에 `|` 행 변경 없음).
- 후속 고려에서 "A 선택 시", "B 선택 시", "A/C 선택 시" 조건문 제거 확인(grep `선택 시` 0건). `01:32`의 괄호 문장은 A를 언급하지만 조건문이 아니라 "필요 없음 + P1에서 재검토" 서술이라 허용.
- 이관 확인: DB-02 값 영역 시각 표시 → `P02:18`; DB-03 함수 추가 알림 → `P03:25`; DB-04 순수 데이터 확인 → `P03:26`; DB-01 조건 블록 문법 → `P03:24`(기존). 모두 존재.

### 4.5 코드 골격

| 명령 | 종료 코드 | 관찰 |
| --- | --- | --- |
| `npm run build` | 0 | `tsc -b`(node 설정에 `strict` 추가 후) 통과, 16 modules, `dist/assets/index-D5mItg0y.js 219.54 kB`. `dist/`는 `.gitignore` 대상 |
| `npm run lint` | 0 | `oxlint --deny-warnings`, 진단 0건 |
| `npm test` | 1 | `No test files found, exiting with code 1`, include `src/**/*.test.{ts,tsx}` — H12 이연 상태와 일치 |
| `npx vitest run --passWithNoTests` | 0 | 같은 include, 테스트 없음 |
| `npx oxlint --deny-warnings <scratch>/probe.ts` | 1 | `warning eslint(no-debugger)` 탐지 후 실패 — 게이트 동작 확인 |
| `npx oxlint <scratch>/probe.ts` | 0 | 플래그 없으면 경고만 — 이전 동작 재현(대조군) |

프로브 파일은 저장소 밖 스크래치 디렉터리에만 만들었다. 검증 종료 시 `git status --short`에는 이 기록 파일만 나타난다.

### 4.6 기록 규칙

- `HANDOFF.md`는 24줄(`wc -l`), 헤더(`HANDOFF.md:3`)와 일치. 완료 서술·테스트 수·해시 없음. `:19` "재검증 중"은 현재 상태로서 적절하나 이 재검증 후 갱신 대상.
- `CHANGELOG.md:14` 항목과 SoT 버전 로그(`docs/SOT.md:182`) 추가 확인. 기록 언어 모두 한국어.
- `docs/plan/ideation.md` 미수정(diff 출력 없음).

## 5. 문제 / 위험

### 5.1 차단 (계약 의무)

1. **N1 — 활성 탭 무관 실행 가정이 SoT §3의 "파일을 열면 다음 스테이지 시작"과 충돌.** `docs/SOT.md:171`, `docs/architecture/00_overview.md:65` ↔ `docs/SOT.md:55`, `docs/SOT.md:148`(AC-05), `docs/plan/ideation.md:98`. 이번 수정(B1 해소 과정)에서 생긴 SoT 내부 모순이다. Owner가 정해야 한다. 예시 방향: (a) 실행은 활성 탭이 현재 사건의 파일일 때만, 아니면 Terminal 한 줄 안내 후 상태 불변; (b) 현행 가정 유지 + SoT §3·AC-05 문구를 "열지 않아도 진행 가능"으로 Owner가 바꿈. 어느 쪽이든 P02(단축키 → parser 연결) 착수 전에 닫아야 한다.

### 5.2 개선 권고 (비차단)

- R1. `HANDOFF.md:7` "SoT v0.2" → v0.3.
- H-N2. 편집하지 않은 필드의 기본값 원문 공급자와 값 영역 위치 정보의 소유자를 정할 것(`00_overview.md:56,100,105`, `01_data_contracts.md:95,130,174`). P03 표식 문법 결정(`P03_story_engine_and_save.md:24`)에 "지정 변수 값 영역" 표식을 포함하는 것이 가장 직접적. P02 parser 구현 전 권장.
- H-N3. `01_data_contracts.md:19`의 "AC-08 '같은 화면'" 인용을 "SoT §8 작업 가정(탭 복원)"으로 고칠 것 — AC-08(`docs/SOT.md:151`) 원문과 다름.
- H-N4. `Clause.op` `>=`/`<=`의 비수치 `Value` 처리 규칙(`01_data_contracts.md:85-86`) 명시 또는 수치 전용 제한.
- H-N5. "마지막 전이는 빈 조건" 불변식(`01_data_contracts.md:66`)을 P04 시나리오 검증 목록(`P04_incident_0214_scenario.md:20`)에 추가.
- H-N6. 작업 로그 "결정" 절(`work_log.md:91`)에 새 작업 가정 2건(활성 탭 무관 실행, 탭 복원)을 함께 기록.
- H-N7. 경미한 표현 정리: `P03_story_engine_and_save.md:39` "되돌리기 UI·선택 이력 UI" ↔ `docs/SOT.md:114`; H5 대응 표에 `scenes`→`sceneIds`, `functionName` 의미 변경 추가(`01_data_contracts.md:98-106`).

## 6. 판정

**조건부 합격** — 차단 1건(N1: `docs/SOT.md:171`·`00_overview.md:65`의 활성 탭 무관 실행 가정과 `docs/SOT.md:55`·AC-05의 "파일을 열면 다음 스테이지 시작" 충돌)을 Owner 결정으로 해소할 것.

근거:

- 이전 차단 B1~B3는 모두 문서 수정으로 해소되었고, H1~H11·H13~H15도 해소(H5는 경미한 누락)되었다. H12는 P01 완료 조건(`P01:29`, `00_index.md:8`, `HANDOFF.md:17`)으로 추적되며 조용히 빠지지 않았다.
- 데이터 계약 절 번호 변경 후 링크 67개 전부 유효, 제거된 개념의 잔존 참조 없음, 브리프 표 보존·조건문 정리·이관 모두 확인.
- 빌드·lint(경고 게이트 포함) 통과, `npm test` 종료 코드 1은 기록된 이연 상태.
- 그러나 B1을 닫으면서 추가한 실행 대상 가정이 SoT 내부에서 §3·AC-05와 충돌한다. 같은 층위 충돌은 SoT §1에 따라 Owner 결정 사항이므로 정책상 차단이다.

## 7. 미결 운영 사항

- 이 기록은 커밋되지 않았다(검증자는 커밋 금지). 커밋 여부는 Owner가 정한다.
- N1은 Owner 결정이 필요하다. 결정 시 작업 로그 "결정" 절과 SoT §3/§8·버전 로그 갱신 대상.
- `HANDOFF.md:19`의 "재검증 중"은 이 기록 이후 갱신 대상.
- P01 2·3단계는 Owner 확인 후 진행 예정(`work_log.md:94-97`). N1은 P01 3단계(단축키 → 고정 문구)에는 영향이 없고 P02부터 영향이 있다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git diff 0380271..4c45e06 --stat
git diff 55b5923..4c45e06 --stat -- docs/plan/ideation.md
sed -n 55p docs/SOT.md; sed -n 148p docs/SOT.md; sed -n 171,172p docs/SOT.md; sed -n 65p docs/architecture/00_overview.md; sed -n 98p docs/plan/ideation.md
sed -n 56p docs/architecture/00_overview.md; sed -n 100,105p docs/architecture/00_overview.md; sed -n 130p docs/architecture/01_data_contracts.md
sed -n 7p HANDOFF.md; sed -n 3p docs/SOT.md
npm run build >/dev/null 2>&1; echo $?
npm run lint; echo $?
npm test; echo $?
npx vitest run --passWithNoTests; echo $?
```
