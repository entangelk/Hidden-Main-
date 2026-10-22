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

## 발견한 문제

| 문제 | 원인 | 처리 | 결과 |
| --- | --- | --- | --- |
| 기존 파일 변경·숨겨진 파일/함수가 MVP인지 P1인지 모순 | ideation §4.3·§4.4는 MVP 서술에 포함, §7.2는 P1로 분류 | 임의로 고르지 않고 DB-01로 분리 | Owner 결정 대기 |
| 지정 변수 외 텍스트 편집 허용 여부 미정 | ideation §2.4·§3.1·§6.1 서술이 서로 다른 방향을 암시 | DB-02로 분리 | Owner 결정 대기 |
| 파일 안 다음 사건 함수 노출 방식 미정 | ideation §2.3에 서술 없음 | DB-03로 분리 | Owner 결정 대기 |
| 시나리오 데이터 형식 미정 | ideation §5에 "JSON / TypeScript 객체" 병기 | DB-04로 분리 | Owner 결정 대기 |

## 결정

- 별도 Owner 결정은 아직 없음. 문서 구조와 우선순위 트리는 작업자 제안이며, 아키텍처 문서는 "v0.1 초안"으로 표시함.
- 작업 가정: 실행 단축키는 `Ctrl+Enter`와 macOS `Cmd+Enter`를 함께 지원 (SoT §8).

## 다음 단계

1. Owner에게 DB-01~04 결정 요청
2. P01 착수 (결정과 무관하게 시작 가능)
