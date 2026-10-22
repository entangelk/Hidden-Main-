# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 29줄

## 현재 상태

- 코드 없음. 문서만 있음.
- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.1 (우선순위 트리는 SoT §1)
- 아키텍처 초안: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — 다음 착수 대상은 **P01 (IDE 셸)**, 결정 없이 시작 가능

## 대기 중인 Owner 결정

| ID | 내용 | 막는 페이즈 | 권장 |
| --- | --- | --- | --- |
| [DB-01](docs/decision_briefs/01_mvp_dynamic_content_scope.md) | 기존 파일 변경·숨겨진 파일/함수 MVP 포함 범위 | P03, P04 | B |
| [DB-02](docs/decision_briefs/02_editing_model.md) | 편집 모델 (전체 자유 편집 vs 값만 편집) | P02 | B |
| [DB-03](docs/decision_briefs/03_scene_reveal_in_file.md) | 파일 안 다음 사건 함수 노출 방식 | P03 | B |
| [DB-04](docs/decision_briefs/04_scenario_data_format.md) | 시나리오 데이터 형식 | P03 | B |

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- 아키텍처의 "진행 상태 = `choices` 기록만 저장, 나머지는 재생으로 파생" 설계는 초안이며 Owner 검토 전이다.

## 다음 작업

1. DB-01~04 Owner 결정 받기
2. P01 착수: Vite + React + TS + Monaco + Vitest 초기화
