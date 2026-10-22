# P03 — 데이터 기반 스토리 엔진 + 저장

**상태:** Planned · [인덱스](00_index.md)

## 목표

P02의 하드코딩 루프를 시나리오 데이터로 구동되는 엔진으로 바꾸고, 자동 저장·복원을 붙인다 (ideation Week 2 후반).

## 선행 조건

- P02 산출물: 검증된 편집→실행→해금 루프와 parser
- [DB-01](../decision_briefs/01_mvp_dynamic_content_scope.md) 해결됨: 새로 추가되는 사건의 주석만 플래그에 따라 변형
- [DB-03](../decision_briefs/03_scene_reveal_in_file.md) 해결됨: 사건 해결 시 다음 함수를 파일 아래쪽에 추가
- [DB-04](../decision_briefs/04_scenario_data_format.md) 해결됨: TypeScript 객체

## 범위

- [데이터 계약](../architecture/01_data_contracts.md)의 `Scenario`/`Stage`/`Scene`/`Progress`/`DerivedState` 타입을 `engine/types.ts`에 정본으로 작성
- `apply(scenario, progress, choice)`, `derive(scenario, progress)` 순수 함수
- 전이 조건 평가, 플래그 효과, 스테이지 해금, 엔딩 판정
- 파일 표시 내용 `render` (템플릿 사건 블록 순차 추가 + 새 블록의 플래그별 주석 선택 + 플레이어 편집 값)
- 함수 단위 진행: 한 파일 안 여러 사건 순차 진행, 해결된 함수의 값 고정 표시
- 템플릿 안 사건 블록·주석 변형 블록의 표식 문법 결정
- Persistence 어댑터: `SaveSnapshot` 저장·복원, 버전 불일치·손상·localStorage 불가 처리 ([데이터 계약 §6](../architecture/01_data_contracts.md#6-저장-계약))
- 2스테이지·엔딩 2개짜리 테스트용 미니 시나리오 (P04 본 시나리오와 별개, 테스트 fixture)

## 완료 기준

- 엔진 단위 테스트: 전이 선택, 플래그 누적, 해금 조건, 엔딩 도달, 잘못된 입력 시 `Progress` 불변, 재생 결정성(같은 `choices` → 같은 결과)
- 저장 테스트: 정상 복원, 손상 JSON, `schemaVersion` 불일치, `scenarioVersion` 불일치 시 유효 구간까지 복원
- 수동: 미니 시나리오 진행 중 새로고침 → 같은 위치·같은 파일·같은 로그로 복원 (AC-08)

## 병행 가능 작업 / 제외

- 병행 가능: P04 시나리오 텍스트 집필
- 제외: 본 시나리오 내용, 되돌리기 UI·선택 이력 UI(P1), 기존 파일 소급 변경·숨겨진 파일/함수(P1, DB-01)

## 관련 결정 브리프

- [DB-01](../decision_briefs/01_mvp_dynamic_content_scope.md), [DB-03](../decision_briefs/03_scene_reveal_in_file.md), [DB-04](../decision_briefs/04_scenario_data_format.md) (모두 해결됨)
