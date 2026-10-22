# 페이즈 인덱스

> 최종 갱신: 2026-10-22 · 상위 기준: [`../SOT.md`](../SOT.md)
> 순서 근거: ideation §11 — 스토리보다 **코드 편집 → 실행 → 파일 생성** 연결을 먼저 검증한다.

| ID | 페이즈 | 상태 | 선행 조건 (필요한 산출물) | 완료 증거 | 결정 브리프 |
| --- | --- | --- | --- | --- | --- |
| [P01](P01_ide_shell.md) | IDE 셸 | Complete | — | 빌드 성공 + IDE 화면에서 파일 열기·편집·탭 전환 수동 확인 + `npm test` 통과 | — |
| [P02](P02_core_loop_prototype.md) | 핵심 루프 프로토타입 | In Progress | P01: 동작하는 Explorer·Editor·Terminal | `main.py` 값 수정 → `Ctrl+Enter` → 로그 → `event_002.py` 생성 → 열기 시연, parser 단위 테스트 통과 | [DB-02](../decision_briefs/02_editing_model.md) |
| [P03](P03_story_engine_and_save.md) | 데이터 기반 스토리 엔진 + 저장 | Planned | P02: 검증된 편집→실행→해금 루프 | 엔진 단위 테스트(전이·해금·엔딩·잘못된 입력) 통과, 새로고침 복원 확인 | [DB-01](../decision_briefs/01_mvp_dynamic_content_scope.md), [DB-03](../decision_briefs/03_scene_reveal_in_file.md), [DB-04](../decision_briefs/04_scenario_data_format.md) |
| [P04](P04_incident_0214_scenario.md) | 시나리오 *Incident 02:14* | Planned | P03: 시나리오 계약과 엔진 | 시나리오 검증 테스트 통과, 두 엔딩 수동 완주, 플레이 시간 10~20분 | [DB-01](../decision_briefs/01_mvp_dynamic_content_scope.md) |
| [P05](P05_polish_and_release.md) | 완성도 개선 + 배포 | Planned | P04: 완주 가능한 시나리오 | AC-01~10 점검표 전부 통과, 배포 URL에서 플레이 확인 | — |

## 일정 대응 (ideation §8)

| ideation | 페이즈 |
| --- | --- |
| Week 1 — IDE 인터페이스 | P01 |
| Week 2 — 게임 엔진 | P02 → P03 |
| Week 3 — 첫 스토리 | P04 |
| Week 4 — 완성도·배포 | P05 |
