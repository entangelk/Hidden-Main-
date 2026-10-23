# 독립 2차 재검증 — 초기 문서 + P01 1단계 골격 (N1 Owner 결정·2차 보강 반영분)

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner ("2차 재검증" 요청, 상위 에이전트 경유) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 수정을 작성하지 않음) |
| 대상 | 커밋 `fa2f83a` "Apply owner decision on run target (SoT v0.4) and re-verification hardening" (`git diff 7e48d2d..fa2f83a`, 9개 파일. `4c45e06..fa2f83a`에는 재검증 기록 커밋 `7e48d2d`도 포함) 및 그 결과 상태의 문서 전체 |
| 정본 기준 | `docs/SOT.md` v0.4, `docs/architecture/00_overview.md`(헤더 v0.2), `docs/architecture/01_data_contracts.md` v0.3, 해결된 브리프 DB-01~04, 작업 로그 "결정"의 Owner 합의(N1 A안, SoT 갱신 규칙), 이전 기록 `initial_docs_and_p01_scaffold.md`·`initial_docs_and_p01_scaffold_reverify.md`(조건부 합격, 차단 N1, 권고 R1·H-N2~H-N7, H5·H8 부분 해소), `docs/guides/verification.md`, `docs/guides/data-contracts.md`, `docs/guides/phase-and-decision-briefs.md` |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `fa2f83a`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. N1 해소 여부: SoT §3.5, 아키텍처 §3 실행 흐름, P02, AC-05의 일관성. "활성 탭과 무관" 문구가 역사 기록(버전 로그·작업 로그) 밖에 남았는지
2. R1, H-N2~H-N7, H5, H8 상태
3. 새 값 슬롯 계약(`FileView`, `ValueSlot`): 소유권, 기본값 리터럴의 중복 출처, "템플릿 텍스트가 기본값 정본"·DB-02/DB-03과의 모순, 오프셋 의미의 명세 수준
4. Owner 결정 기록: SoT §1 새 규칙, 버전 로그 v0.4, 작업 로그 "결정" — Owner 발언과 우선순위 트리에 충실한지
5. 회귀: 새 모순, 잔존 용어, 깨진 링크·앵커
6. `npm run build` / `npm run lint` / `npm test` / `npx vitest run --passWithNoTests` 재실행
7. `docs/plan/ideation.md` 미수정

뮤테이션 테스트: **해당 없음.** 이번 커밋은 문서만 바꿨고(`src/`·설정 변경 없음), 저장소에 테스트 파일이 없어 물어야 할 가드가 없다. Owner 결정의 타당성은 검증 대상이 아니며, 기록·적용의 충실성만 본다.

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short                                    # 출력 없음
git log --oneline | head -8
git diff --stat 4c45e06..fa2f83a
git diff 7e48d2d..fa2f83a                             # 대상 커밋 diff 정독
git diff 55b5923..fa2f83a --stat -- docs/plan/ideation.md   # 출력 없음 = 미수정
cat -n docs/SOT.md docs/architecture/00_overview.md docs/architecture/01_data_contracts.md \
       docs/phases/00_index.md docs/phases/P02_core_loop_prototype.md docs/phases/P03_story_engine_and_save.md HANDOFF.md
cat -n docs/daily_logs/2026-10-22/work_log.md | sed -n 60,110p
grep -rnE '무관|regardless|활성 탭|active tab' --include=*.md . | grep -v node_modules | grep -v docs/verifications/
grep -rnE 'PlayerEdits 항목|템플릿 기본값|defaultLiteral|valueSlots|ValueSlot|FileView|값 슬롯' --include=*.md . \
  | grep -v node_modules | grep -v docs/verifications/
# 링크·앵커: 저장소 밖 스크래치 스크립트(상대 경로 존재 + GitHub 방식 헤딩 슬러그 대조)
python3 -I <scratch>/links.py /home/user/Hidden-Main- docs/SOT.md docs/architecture/00_overview.md \
  docs/architecture/01_data_contracts.md docs/phases/*.md docs/decision_briefs/*.md HANDOFF.md CHANGELOG.md \
  docs/daily_logs/2026-10-22/work_log.md
wc -l HANDOFF.md
npm run build; echo $?
npm run lint; echo $?
npm test; echo $?
npx vitest run --passWithNoTests; echo $?
git diff --stat 4c45e06..fa2f83a -- src package.json  # 출력 없음 = 코드·설정 변경 없음
git status --short                                    # 마지막에도 이 기록 파일 외 변화 없음
```

## 4. 결과

### 4.1 N1 — 실행 대상과 활성 탭

- SoT `docs/SOT.md:86-90` §3.5: 현재 사건 파일이 활성 탭일 때만 실행, 아니면 Terminal 한 줄 안내·상태 불변, 엔딩 후 안내만. Owner 결정(A안) 문구와 일치.
- 아키텍처 `docs/architecture/00_overview.md:55`(0단계 게이트), `:67`(설명), `:68`(엔딩 후). SoT §3.5와 일치.
- AC-05(`docs/SOT.md:155`) "생성된 파일을 열면 다음 스테이지가 진행된다", §3(`docs/SOT.md:56`) "그 파일을 열면 다음 스테이지가 시작된다", ideation §2.3과 이제 충돌하지 않는다. 열지 않은 파일의 사건은 게이트에서 막힌다.
- P02 `docs/phases/P02_core_loop_prototype.md:20`이 게이트를 범위에 넣었다.
- 옛 가정 `docs/SOT.md` §8의 "활성 탭과 무관" 줄은 삭제되었다(diff). "무관" 문구는 역사 기록에만 남는다: `docs/SOT.md:189`(v0.4 로그, "폐기"), `docs/daily_logs/2026-10-22/work_log.md:72,84,87,101`. 그 외 잔존 없음(grep).
- **판정: 해소.** 남은 공백은 4.5의 H3-1·H3-2(비차단).

### 4.2 이전 권고 상태

| ID | 상태 | 근거 |
| --- | --- | --- |
| N1 | **해소** | 4.1 |
| R1 HANDOFF SoT 버전 | 해소 | `HANDOFF.md:7` "v0.4" = `docs/SOT.md:3` |
| H-N2 기본값 공급자·값 영역 위치 소유자 | 해소 (잔여 권고 H3-3~H3-5) | `01_data_contracts.md:173-187`, `00_overview.md:57,102,107`, `P03_story_engine_and_save.md:24` |
| H-N3 AC-08 "같은 화면" 인용 | 해소 | `01_data_contracts.md:19` "SoT §8 작업 가정" |
| H-N4 `>=`/`<=` 비수치 처리 | 해소 | `01_data_contracts.md:85`, 검증 항목 `P04_incident_0214_scenario.md:20` |
| H-N5 빈 조건 기본 전이 검증 | 해소 | `P04_incident_0214_scenario.md:20` |
| H-N6 작업 로그 "결정"에 새 가정 | 해소 (경미 H3-8) | `work_log.md:99-102` |
| H-N7 P03 제외 표현·대응 표 | 해소 | `P03_story_engine_and_save.md:39` ↔ `docs/SOT.md:121`; `01_data_contracts.md:102,105` |
| H5 ideation 개명 이유 | 해소 | `01_data_contracts.md:102`(`scenes`→`sceneIds`), `:105`(`functionName`) |
| H8 되돌리기·선택 이력 표현 | 해소 | `P03_story_engine_and_save.md:39` "스토리 되돌리기·사용자 선택 이력(P1)" = `docs/SOT.md:121` |
| H12 `npm test` 종료 코드 0 | 이연 — 추적 유지 | `HANDOFF.md:17`, `docs/phases/00_index.md:8`. 4.6에서 종료 코드 1 재현 |

### 4.3 값 슬롯 계약

- **소유권: 명확.** 위치·기본값은 Engine 소유, UI 읽기 전용(`01_data_contracts.md:187`, `00_overview.md:107`). 편집은 Editor → `PlayerEdits`(`01_data_contracts.md:18`, `00_overview.md:46,107`). 병합은 App(`00_overview.md:57,102`). `FileView`는 `DerivedState`의 일부라 §1 소유 표의 `DerivedState` 행(`01_data_contracts.md:17`, 저장 안 함)에 포함된다.
- **기본값 중복 출처: 없음(실질).** `defaultLiteral`은 저장되지 않는 파생값이고 템플릿에서 계산된다(`:187`). 템플릿 정본 원칙(`:95`), §10 표(`:253`)와 실질적으로 충돌하지 않는다. 다만 `:183`의 "기본값의 유일한 출처"는 `:95`·`:253`의 "템플릿 텍스트가 정본, 복사본 없음"과 다르게 읽힐 수 있다 → H3-5.
- **DB-02/DB-03 정합: 모순 없음.** 슬롯은 현재 사건에만 생긴다(`:175`). 해결된 사건 값은 `Choice`에서 고정 표시된다(`:191`, `:205`). DB-02(B) 값만 편집과 DB-03(B) 재실행 불가에 맞는다.
- **오프셋 의미: 현재 사건 한정으로는 대체로 충분하나 좌표계가 덜 정해졌다.** `start/end`는 "`text` 안 문자 오프셋"(`:181-182`)이고, `text`는 "플레이어 편집 적용 전"(`:170`)이다. 그런데 계산 근거는 "정적 템플릿"(`:187`, `00_overview.md:107`)이고, `render`는 플레이어 편집 값까지 포함한다(`00_overview.md:93`, `P03_story_engine_and_save.md:22`). 다음이 정해지지 않았다.
  - 화면 텍스트에 편집 값을 넣는 주체(Engine `render`인지 Editor인지).
  - 한 사건에 필드가 둘 이상일 때, 앞 필드 리터럴의 길이가 바뀐 뒤 뒤 필드 슬롯의 오프셋을 다시 맞추는 방법.
  - 오프셋 단위(JS 문자열 인덱스 = UTF-16 코드 단위인지).

  P02는 하드코딩·단일 필드(`P02:16,24`)라 영향이 없다. P03 표식 문법 결정(`P03:24`)에서 닫으면 된다 → H3-3.
- **표식 정의:** "`필드명 = 리터럴` 줄"(`00_overview.md:107`)은 주석 줄(`# action = 2 …`)이나 주석 변형 블록 안 텍스트와 구분하는 패턴이 없다. P04 유일성 테스트(`P04:20`)의 판정이 이 정의에 달려 있다 → H3-4.

### 4.4 Owner 결정 기록

- Owner 발언 "SoT는 작업자와 Owner의 논의와 합의 하에 버전 업데이트가 가능한 문서"는 `docs/SOT.md:22`에 "작업자와 Owner의 논의와 합의를 거쳐서만"으로 실렸다. 의미를 보존했다. 덧붙인 "작업자가 단독으로 요구사항을 바꾸지 않는다"와 기록 위치 지정은 발언의 직접 귀결이며, 범위를 넓히지 않았다. 작업 로그 `work_log.md:102`에 "Owner 지시"로 기록되었다.
- N1 A안: `work_log.md:101`에 "Owner 합의"와 이유를 기록했다. SoT 우선순위 1위 "작업 로그에 기록된 Owner 결정"(`docs/SOT.md:12`)에 해당하므로, 브리프 없이 대화로 결정한 것도 트리상 유효하다. 가이드상 브리프는 차단 결정에만 요구된다(`phase-and-decision-briefs.md:63`). 버전 로그 `docs/SOT.md:189`는 근거로 재검증 기록과 작업 로그를 링크한다.
- 이번 커밋의 SoT 변경은 §1 규칙, §3.5, §8 옛 가정 삭제, 버전 표기뿐이다(diff). 모두 Owner 합의 범위 안이며 작업자 단독 변경은 없다.
- 관찰: §8 "작업 가정 (Owner 확인 전)"(`docs/SOT.md:174`)은 새 규칙(`:22`)과 긴장 관계에 있다. 앞으로 작업자가 §8에 가정을 추가·수정하는 것이 "내용 변경"인지 규칙상 불분명하다 → H3-7.

### 4.5 회귀

- 링크·앵커: 상대 링크 71개 전부 해석된다. 새 앵커 `01_data_contracts.md#6-파생-계약-저장-안-함`(`00_overview.md:107`, `P03:24`)도 포함한다. `checked=71 bad=0`.
- `HANDOFF.md`는 25줄(`wc -l`)이고 헤더 `:3`과 일치한다. `CHANGELOG.md:15` 항목과 SoT 버전 로그 `:189`가 추가되었다. 기록 언어는 모두 한국어다.
- 새 모순(같은 층위 충돌)은 찾지 못했다. 경미한 잔존·누락:
  - `01_data_contracts.md:115` 주석은 여전히 "입력: 현재 사건의 PlayerEdits 항목"이다. App 병합 맵(`00_overview.md:57,102`)으로 갱신되지 않았다. `:132`와 합치면 모순은 아니다 → H3-5.
  - `00_overview.md:3`은 이번 커밋에서 §3·§6 내용이 바뀌었는데도 "v0.2 초안"이다. `00_overview.md:131` 시나리오 검증 목록에는 `P04:20`의 새 불변식이 반영되지 않았다 → H3-6.
  - `00_overview.md:55`의 0단계가 1단계에서 정하는 `currentSceneId`를 먼저 참조한다. 엔딩(`currentSceneId = null`) 분기는 `:68` 주석에만 있다 → H3-2.
  - `work_log.md:100`은 `scenarioVersion` 편집 값 폐기를 "SoT §8" 괄호 안에 묶었다. 그러나 이 규칙은 `01_data_contracts.md:241`에만 있다 → H3-8.
- `docs/plan/ideation.md` 미수정(diff 출력 없음). 이번 커밋은 `src/`·`package.json`을 바꾸지 않았다.

### 4.6 코드 골격

| 명령 | 종료 코드 | 관찰 |
| --- | --- | --- |
| `npm run build` | 0 | `tsc -b && vite build` 통과, `dist/assets/index-D5mItg0y.js 219.54 kB`(이전과 같은 해시) |
| `npm run lint` | 0 | `oxlint --deny-warnings`, 진단 출력 없음 |
| `npm test` | 1 | `No test files found, exiting with code 1`, include `src/**/*.test.{ts,tsx}` — H12 이연 상태와 일치 |
| `npx vitest run --passWithNoTests` | 0 | 같은 include, 테스트 없음 |

## 5. 문제 / 위험

### 5.1 차단 (계약 의무)

없음. 이전 차단 N1은 Owner 결정(A안)으로 해소되었고, SoT·아키텍처·P02·AC-05 사이에 같은 층위 모순이 남지 않았다.

### 5.2 개선 권고 (비차단)

- **H3-1 (P02 착수 전 권장).** SoT §3.5의 "다른 탭이면 안내만, 상태 불변" 분기(`docs/SOT.md:89`)가 어느 완료 기준에도 없다(`P02_core_loop_prototype.md:26-30`, `P03_story_engine_and_save.md:32`). 이 분기는 "발동하지 않아야 하는" 경우다. 구현 단계의 검증에서는 계약이 요구하는 회귀 테스트가 되므로, 미리 완료 기준에 넣어 두기를 권한다. 또 `P02:20`은 "`main.py`가 활성 탭이 아니면"으로 고정했다. `main.py` 사건을 해결한 뒤에는 SoT 규칙과 어긋나게 읽히므로 "현재 사건 파일이 활성 탭이 아니면"으로 쓰는 것이 정확하다.
- **H3-2.** `00_overview.md:55-56`: 순서를 "엔딩이면 안내 → `currentSceneId` 계산 → 활성 탭 게이트"로 정리하고, 엔딩 분기를 흐름 안에 넣을 것.
- **H3-3 (P03 표식 결정 때).** 값 슬롯 좌표계를 정할 것(`01_data_contracts.md:170,181-182,187`, `00_overview.md:93`, `P03:22`):
  - 편집 값을 화면 텍스트에 넣는 주체
  - 한 사건에 필드가 여럿일 때 편집 뒤 오프셋을 다시 맞추는 방법(Monaco 데코레이션 추적 등)
  - 오프셋 단위(UTF-16 코드 단위)
- **H3-4.** "`필드명 = 리터럴` 줄" 표식 패턴을 정할 것(주석 줄 제외, 들여쓰기·공백 규칙). 위치: `00_overview.md:107`, `P04:20`의 유일성 테스트 근거.
- **H3-5.** 문구 정리:
  - `01_data_contracts.md:183` "기본값의 유일한 출처" → "템플릿에서 파생된 기본값 원문(런타임 접근 경로)". §10 표(`:253`)에 파생 투영으로 `ValueSlot.defaultLiteral`(저장 안 함)을 추가.
  - `:115` 입력 주석을 App 병합 맵으로 갱신.
- **H3-6.** `00_overview.md:3` 버전 표기를 갱신하고, `:131` 시나리오 검증 목록을 `P04:20`과 맞출 것.
- **H3-7.** SoT §1 새 규칙(`docs/SOT.md:22`)이 §8 작업 가정(`:174`)의 추가·수정에도 적용되는지 Owner와 정할 것. 이는 문구 해석 문제이며 현재 모순은 아니다.
- **H3-8.** `work_log.md:100`의 괄호 "SoT §8"을 탭 복원에만 붙이고, `scenarioVersion` 규칙은 "데이터 계약 §9"로만 표시할 것.

## 6. 판정

**합격** — 차단 사항 없음.

근거:

- N1이 Owner 결정(A안) 그대로 반영되었다: SoT §3.5(`docs/SOT.md:86-90`), 아키텍처 실행 흐름 0단계(`00_overview.md:55,67`), P02 범위(`P02:20`). AC-05·§3과의 충돌이 사라졌다. "활성 탭 무관" 문구는 역사 기록에만 남는다.
- R1, H-N2~H-N7, H5, H8은 모두 해소되었다. H12는 이연 상태로 추적이 유지된다.
- 값 슬롯 계약은 소유권(Engine 위치·기본값 / Editor 편집 / App 병합)이 분명하다. 템플릿 정본 원칙, DB-02/DB-03과도 모순이 없다. 좌표계와 표식 패턴의 세부(H3-3·H3-4)는 P03 표식 결정 범위로 이미 걸려 있다(`P03:24`).
- Owner 결정 두 건이 발언 취지대로 SoT §1·§3.5, 버전 로그 v0.4, 작업 로그 "결정"에 기록되었다. 이번 커밋에 작업자 단독의 SoT 변경은 없다.
- 링크 71개가 모두 유효하다. 빌드·lint 통과, `npm test` 종료 코드 1은 기록된 이연 상태다. ideation은 미수정이다.

## 7. 미결 운영 사항

- 이 기록은 커밋되지 않았다(검증자는 커밋 금지). 커밋 여부는 Owner가 정한다.
- `HANDOFF.md:19` "2차 재검증 중"과 `work_log.md:106` "2차 재검증 결과 반영"은 이 기록 이후 갱신 대상이다.
- H14(`choices` 재생 설계 Owner 검토)는 여전히 P03 선행 조건이다(`P03:15`, `00_index.md:10`).
- H3-1은 P02, H3-3·H3-4는 P03 표식 결정 전에 다루면 된다. P01 2·3단계에는 영향이 없다.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
git diff 7e48d2d..fa2f83a --stat
git diff 55b5923..fa2f83a --stat -- docs/plan/ideation.md
sed -n 86,90p docs/SOT.md; sed -n 155p docs/SOT.md; sed -n 22p docs/SOT.md; sed -n 189p docs/SOT.md
sed -n 55,68p docs/architecture/00_overview.md; sed -n 107p docs/architecture/00_overview.md
sed -n 170,187p docs/architecture/01_data_contracts.md; sed -n 115p docs/architecture/01_data_contracts.md
sed -n 20p docs/phases/P02_core_loop_prototype.md; sed -n 99,102p docs/daily_logs/2026-10-22/work_log.md
grep -rnE '무관|활성 탭' --include=*.md . | grep -v node_modules | grep -v docs/verifications/
npm run build >/dev/null 2>&1; echo $?
npm run lint; echo $?
npm test; echo $?
npx vitest run --passWithNoTests; echo $?
```
