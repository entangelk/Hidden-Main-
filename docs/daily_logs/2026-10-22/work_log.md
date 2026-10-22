# 작업 로그 — 2026-10-22

## 목표

- `docs/plan/ideation.md`(기획안 v0.1)를 바탕으로 초기 SoT, 페이즈, 아키텍처 문서를 만든다.
- Owner 결정(DB-01~04)을 문서에 반영한다.
- P01 1단계(프로젝트 골격)를 만든다.
- 독립 검증을 받고 지적 사항을 반영한다.

## 완료한 작업

### 1. 작업 지침 문서 도입

- 파일: `CLAUDE.md`, `AGENTS.md`, `docs/guides/*` (외부 템플릿 저장소 `entangelk/memo_and_skills`의 `skills/basic`에서 복사)
- 효과: 기록·페이즈·데이터 계약 작성 규칙의 기준이 생김.

### 2. 초기 SoT 작성

- 파일: `docs/SOT.md`
- 주요 내용: 문서 우선순위 트리(Owner 결정 > SoT > 아키텍처 > 페이즈 > ideation), 설계 원칙 R-01~08, 핵심 루프, 화면 구성, MVP 범위(P0/P1/P2), 완료 기준 AC-01~10, 미결 사항, 버전 로그.
- 이유: CLAUDE.md §1이 우선순위 트리 부재 시 정의를 권고. ideation 내부 모순을 SoT에서 조용히 해소하지 않고 결정 브리프로 분리.

### 3. 아키텍처 문서 작성

- 파일: `docs/architecture/00_overview.md`, `docs/architecture/01_data_contracts.md`
- 주요 내용:
  - Engine(순수 TS) ← Scenario data, UI·Persistence는 바깥 어댑터라는 의존 방향
  - ideation §6.1의 6개 모듈 배치, `Ctrl+Enter` 실행 흐름, parser 규칙
  - 진행 상태 정본을 `Progress.choices`(적용된 선택 기록) 하나로 두고 현재 사건·플래그·해금 파일·엔딩·로그를 재생으로 파생
  - 파일 내용 3계층(템플릿 / 스토리 오버레이 / 플레이어 편집), 저장 스냅샷과 버전 처리
- 이유: ideation §6.2 GameState는 같은 사실(진행 기록 vs 플래그 vs 해금 목록)을 여러 필드에 쓰게 되어 있어, data-contracts 가이드의 중복 소유 규칙에 따라 정본을 하나로 줄임. 새로고침 복원(AC-08)과 P1 되돌리기가 같은 메커니즘으로 해결됨.

### 4. 페이즈 및 결정 브리프 작성

- 파일: `docs/phases/00_index.md`, `P01`~`P05`, `docs/decision_briefs/01`~`04`
- 페이즈 순서: P01 IDE 셸 → P02 핵심 루프 프로토타입(ideation §11) → P03 데이터 기반 엔진 + 저장 → P04 시나리오 → P05 완성도·배포
- 결정 브리프 DB-01~04 작성 (아래 "발견한 문제" 참고)

### 5. 기록 문서 생성

- 파일: `HANDOFF.md`, `CHANGELOG.md`, 이 작업 로그

### 6. P01 1단계 — 프로젝트 골격

- 파일: `package.json`, `package-lock.json`, `index.html`, `tsconfig*.json`, `vite.config.ts`, `.gitignore`, `.oxlintrc.json`, `src/main.tsx`, `src/index.css`, `src/app/App.tsx`
- 주요 내용: `npm create vite` react-ts 템플릿 설정을 기준으로 데모 자산은 빼고 구성. Vitest 추가(`src/**/*.test.ts`), `tsconfig.app.json`에 `strict` 추가, 진입 컴포넌트를 아키텍처 디렉터리 구조에 맞춰 `src/app/`에 둠. 페이지 제목은 게임처럼 보이지 않도록 `incident-workspace`(R-01).
- 검증: `npm run build` 성공, `npm run lint` 종료 코드 0, `vitest run --passWithNoTests` 실행 확인(테스트 파일 없음).
- P01을 3단계(골격 → IDE 레이아웃 → Monaco·단축키)로 나눠 진행. Owner 선호에 따라 단계마다 다음 진행 여부를 확인받음.

### 7. 결정 브리프 DB-01~04 해결 반영

- 파일: `docs/decision_briefs/01`~`04`, `docs/SOT.md`(v0.2), `docs/architecture/*`, `docs/phases/*`
- 주요 내용: SoT §3.2(값만 편집), §3.3(사건 함수 순차 추가), §3.4(선택 영향 범위), §7(TS 객체 시나리오) 확정. 데이터 계약 `PlayerEdits`를 사건→필드→원문 리터럴로 확정. P02·P03 상태를 Planned로 변경.

### 8. 독립 검증과 보강

- 검증 기록: `docs/verifications/2026-10-22/initial_docs_and_p01_scaffold.md` (판정: 조건부 합격, 차단 3건·개선 권고 15건). Owner 지시로 서브에이전트가 검증.
- 차단 3건 해소 (아래 "발견한 문제" 표).
- 개선 권고 반영:
  - 데이터 계약 v0.2(`docs/architecture/01_data_contracts.md`): 미정의 타입(`Condition`, `Effect`, `LogLine`, `Ending`, `StaticFile`, ID 타입, `ParseError`) 정의(H4). parser 출력과 진행 기록의 타입을 `Choice` 하나로 통합(이전에는 `ChoiceInput`·`AppliedChoice`로 같은 모양이 두 번). 값 타입을 `Value` 한 곳에 정의(H6). 해결된 함수 값의 리터럴 재생성 규칙(H6). `scenarioVersion` 불일치 시 편집 값 폐기(H7). ideation 필드 개명·이동 이유 표(H5) — 이 과정에서 `Stage.unlock`은 전이 그래프에서 파생되므로 삭제.
  - parser 입력을 렌더된 텍스트가 아닌 현재 사건의 필드별 원문 리터럴로 확정(H15). 함수 범위 탐색과 누락·중복 오류는 DB-02(B)에서 불가능하므로 제거.
  - 문구 정리: 데이터 계약 잔존 문구(H1), 이 로그의 결과 열·목표(H2), 브리프 후속 고려의 미선택 대안 조건문 정리와 B의 후속 결정을 P02·P03 범위로 이관(H3).
  - SoT v0.3: P1 목록을 ideation 표현으로 되돌리고 히든 엔딩 P1 분류를 가정으로 표시(H8).
  - 설정: `tsconfig.node.json`에 `strict`(H9), Vitest include에 `.test.tsx`(H10), `npm run lint`를 `oxlint --deny-warnings`로(H11).
  - P01 폴더는 첫 파일이 생길 때 만든다고 페이즈 문서에 명시(H13). `choices` 재생 설계 Owner 검토를 P03 선행 조건으로 추가(H14).
  - H12(`npm test` 종료 코드 0)는 P01 2단계 첫 테스트로 해소 예정, P01 완료 기준에 명시.
- 재검증을 같은 방식(서브에이전트)으로 요청.

### 9. 재검증과 2차 보강

- 재검증 기록: `docs/verifications/2026-10-22/initial_docs_and_p01_scaffold_reverify.md` (판정: 조건부 합격). B1~B3 해소 확인, 새 차단 N1과 개선 권고 7건.
- N1: 8번에서 넣은 "활성 탭과 무관하게 현재 사건 실행" 가정이 SoT §3·AC-05("파일을 열면 다음 스테이지 시작")와 충돌. Owner에게 A(현재 사건 파일이 활성 탭일 때만 실행)/B(SoT·AC-05 문구 변경)를 물었고 A로 합의 → SoT v0.4 §3.5, 아키텍처 실행 흐름 0단계 추가, P02 범위 반영.
- 개선 권고 반영: HANDOFF의 SoT 버전(R1). 값 슬롯 계약 신설 — 값 영역 위치와 기본값을 Engine `render`가 정적 템플릿에서 계산해 `FileView.valueSlots`로 내보내고, App이 편집 값과 기본값을 합쳐 parser에 넘김(H-N2). `WorkspaceView` 저장 근거를 AC-08 인용 대신 SoT §8 가정으로 수정(H-N3). `>=`/`<=`는 숫자에만(H-N4). P04 시나리오 검증 항목에 빈 조건 기본 전이·필드 줄 유일성·비교 연산자 규칙 추가(H-N5). 이 로그의 결정 절에 새 가정 기록(H-N6). 데이터 계약 대응 표에 `scenes`→`sceneIds`, `functionName` 추가, P03 제외 목록 표현 정리(H5·H-N7).
- 2차 재검증을 서브에이전트로 요청.

### 10. 2차 재검증과 3차 보강

- 2차 재검증 기록: `docs/verifications/2026-10-22/initial_docs_and_p01_scaffold_reverify2.md` (판정: 합격, 비차단 H3-1~H3-8).
- H3-7(SoT §8 작업 가정과 §1 합의 규칙의 관계)을 Owner에게 물음 → Owner: "위임한 것조차 합의한 것". SoT v0.5로 §1에 명시하고 §8 작업 가정을 확정 규칙으로 옮김(단축키 §3.5, 저장·복원 §3.6 신설, 히든 엔딩 P1 §5.2). `choices` 재생 설계도 같은 근거로 합의된 것으로 보고 P03 선행 조건·HANDOFF의 "검토 전" 표시 제거.
- 비차단 항목 보강:
  - H3-1: P02·P03 완료 기준에 "다른 탭·엔딩 이후 실행 시 안내만, 상태 불변" 확인 추가. P02의 `main.py` 고정 표현을 "현재 사건 파일"로.
  - H3-2: 아키텍처 실행 흐름에서 엔딩·활성 탭 확인을 `currentSceneId` 계산 뒤(1단계)로 옮김.
  - H3-3: 오프셋 단위(UTF-16 코드 단위), Engine `applyEdits`(슬롯 치환 + 오프셋 이동), Editor의 변경 수락 규칙 명시(아키텍처 §6.2).
  - H3-4: 값 슬롯 줄 패턴 정의, 주석 줄 제외, docstring 금지(아키텍처 §6.1).
  - H3-5: `defaultLiteral`을 "템플릿의 투영"으로 표현 수정, parser 입력 주석 갱신.
  - H3-6: 아키텍처 문서 버전 표기(v0.3, 데이터 계약 v0.4), 테스트 전략에 P04 검증 항목 전체 반영.
  - H3-8: 아래 결정 절의 출처 표기 수정.
- 3차 재검증을 서브에이전트로 요청.

## 발견한 문제

| 문제 | 원인 | 처리 | 결과 |
| --- | --- | --- | --- |
| 기존 파일 변경·숨겨진 파일/함수가 MVP인지 P1인지 모순 | ideation §4.3·§4.4는 MVP 서술에 포함, §7.2는 P1로 분류 | 임의로 고르지 않고 DB-01로 분리 | DB-01 B로 해결 |
| 지정 변수 외 텍스트 편집 허용 여부 미정 | ideation §2.4·§3.1·§6.1 서술이 서로 다른 방향을 암시 | DB-02로 분리 | DB-02 B로 해결 |
| 파일 안 다음 사건 함수 노출 방식 미정 | ideation §2.3에 서술 없음 | DB-03로 분리 | DB-03 B로 해결 |
| 시나리오 데이터 형식 미정 | ideation §5에 "JSON / TypeScript 객체" 병기 | DB-04로 분리 | DB-04 B로 해결 |
| 아키텍처 실행 흐름이 "커서가 속한 사건"을 실행 — SoT §3.3(항상 마지막 함수)과 모순 | DB-03 반영 시 실행 흐름 문구를 갱신하지 않음 | 실행 대상을 `currentSceneId`로 고정, 활성 탭과 무관하게 실행(작업 가정) | 독립 검증 차단 1 해소 |
| P03 완료 기준 "같은 파일 복원"을 저장 계약이 지원하지 않음 | 열린 탭을 "선택적 저장"으로만 적어 둠 | `SaveSnapshot.workspace` 추가, 복원 시 미해금 경로 제거 | 독립 검증 차단 2 해소 |
| P02 완료 기준이 잘못된 입력 후 Explorer 변경을 허용하는 것처럼 읽힘 | 문구 오류 | "Terminal 오류 출력 외 변화 없음"으로 수정 | 독립 검증 차단 3 해소 |
| "활성 탭 무관 실행" 가정이 AC-05와 충돌 (재검증 N1) | B1 수정 때 AC-05 영향을 확인하지 않음 | Owner 합의로 "현재 사건 파일이 활성 탭일 때만 실행" (SoT v0.4 §3.5) | N1 해소 |

(DB-01~04는 같은 날 Owner가 모두 권장안 B로 결정 — 아래 "결정" 참고)

## 결정

- **Owner 결정: DB-01~04 모두 권장안 B 채택.** Owner가 "결정이 필요한 것들 모두 권장안으로 하자"고 지시.
  - DB-01 B: 새로 열리는 사건의 주석·로그만 이전 선택에 따라 변형. 기존 파일 소급 변경·숨겨진 파일/함수는 P1. 트레이드오프: ideation §4.4 연출은 v0.1에서 빠짐.
  - DB-02 B: 지정 변수 값만 편집, 나머지 읽기 전용. 트레이드오프: Monaco에 범위별 읽기 전용이 없어 직접 구현 필요.
  - DB-03 B: 사건 해결 시 다음 함수를 파일 아래에 추가. 해결된 함수 값은 고정.
  - DB-04 B: 시나리오는 TS 객체(순수 데이터). 외부 로딩(P1) 때 JSON 경로 추가 필요.
- 문서 구조, 우선순위 트리, 아키텍처의 `choices` 재생 설계는 작업자가 위임받아 만든 것으로, Owner 확인(아래)에 따라 합의된 것으로 본다.
- 실행 단축키는 `Ctrl+Enter`와 macOS `Cmd+Enter`를 함께 지원 (처음엔 작업 가정, v0.5에서 SoT §3.5로 확정).
- 새로고침 후 열린 탭·활성 파일도 복원(처음엔 SoT §8 작업 가정, v0.5에서 SoT §3.6으로 확정). `scenarioVersion` 불일치 시 편집 값 폐기(데이터 계약 §9에서 정했고, v0.5에서 SoT §3.6에 반영).
- **Owner 합의 (재검증 N1): A 채택.** `Ctrl/Cmd+Enter`는 현재 사건 파일이 활성 탭일 때만 실행, 아니면 Terminal 안내만. 이유: ideation·AC-05의 "파일을 열어야 다음 스테이지 진행"을 지키기 위함. 8번에서 넣었던 "활성 탭 무관 실행" 가정은 폐기.
- **Owner 지시: SoT는 작업자와 Owner의 논의·합의 하에서만 버전을 올릴 수 있는 문서다.** SoT §1 규칙으로 추가.
- **Owner 확인: "위임한 것조차 합의한 것".** 작업자가 위임받아 내린 판단(문서 구조, 검증 지적 보강 방식, 권장안 채택 등)은 합의된 것으로 본다. SoT §1에 명시(v0.5). 작업자가 위임된 결과를 다시 확인받는 질문으로 진행을 멈추지 않는다.

## 다음 단계

1. 3차 재검증 결과 반영
2. P01 2단계: IDE 레이아웃 (Owner 확인 후)
3. P01 3단계: Monaco 연결·단축키
