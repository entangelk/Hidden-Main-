# 작업 로그 — 2026-10-22

## 목표

- `docs/plan/ideation.md`(기획안 v0.1)를 바탕으로 초기 SoT, 페이즈, 아키텍처 문서를 만든다.

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

## 발견한 문제

| 문제 | 원인 | 처리 | 결과 |
| --- | --- | --- | --- |
| 기존 파일 변경·숨겨진 파일/함수가 MVP인지 P1인지 모순 | ideation §4.3·§4.4는 MVP 서술에 포함, §7.2는 P1로 분류 | 임의로 고르지 않고 DB-01로 분리 | Owner 결정 대기 |
| 지정 변수 외 텍스트 편집 허용 여부 미정 | ideation §2.4·§3.1·§6.1 서술이 서로 다른 방향을 암시 | DB-02로 분리 | Owner 결정 대기 |
| 파일 안 다음 사건 함수 노출 방식 미정 | ideation §2.3에 서술 없음 | DB-03로 분리 | Owner 결정 대기 |
| 시나리오 데이터 형식 미정 | ideation §5에 "JSON / TypeScript 객체" 병기 | DB-04로 분리 | Owner 결정 대기 |

(위 네 건은 같은 날 Owner가 모두 권장안 B로 결정 — 아래 "결정" 참고)

## 결정

- **Owner 결정: DB-01~04 모두 권장안 B 채택.** Owner가 "결정이 필요한 것들 모두 권장안으로 하자"고 지시.
  - DB-01 B: 새로 열리는 사건의 주석·로그만 이전 선택에 따라 변형. 기존 파일 소급 변경·숨겨진 파일/함수는 P1. 트레이드오프: ideation §4.4 연출은 v0.1에서 빠짐.
  - DB-02 B: 지정 변수 값만 편집, 나머지 읽기 전용. 트레이드오프: Monaco에 범위별 읽기 전용이 없어 직접 구현 필요.
  - DB-03 B: 사건 해결 시 다음 함수를 파일 아래에 추가. 해결된 함수 값은 고정.
  - DB-04 B: 시나리오는 TS 객체(순수 데이터). 외부 로딩(P1) 때 JSON 경로 추가 필요.
- 문서 구조와 우선순위 트리는 작업자 제안이며 Owner가 이의 없이 다음 단계를 진행시킴. 아키텍처 문서의 `choices` 재생 설계는 아직 명시적 검토 전.
- 작업 가정: 실행 단축키는 `Ctrl+Enter`와 macOS `Cmd+Enter`를 함께 지원 (SoT §8).

## 다음 단계

1. P01 2단계: IDE 레이아웃 (Owner 확인 후)
2. P01 3단계: Monaco 연결·단축키
