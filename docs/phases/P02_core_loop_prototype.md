# P02 — 핵심 루프 프로토타입

**상태:** Planned · [인덱스](00_index.md)

## 목표

ideation §11의 "첫 번째 프로토타입"을 만든다. **코드 편집 → 실행 → 파일 생성** 연결이 성립하는지 검증하는 것이 유일한 목적이다.

## 선행 조건

- P01 산출물: Explorer·Editor·탭·Terminal이 동작하는 IDE 셸
- [DB-02](../decision_briefs/02_editing_model.md) 해결됨: 지정 값만 편집 (B)

## 범위

- `main.py` 하나로 시작, 함수 하나에 선택지 3개(주석) + `action = 1`
- Input Parser 1차 구현 ([아키텍처 §6](../architecture/00_overview.md#6-input-parser-규칙-mvp)): 함수 범위 탐색, 정수 리터럴, 허용값 검증, 오류 메시지
- Editor 편집 제한: `action` 값 영역 밖 입력 차단 (DB-02)
- `Ctrl/Cmd+Enter` → parser → 선택값별 Terminal 로그
- 유효한 선택 시 Explorer에 `event_002.py` 추가 (팝업·전환 없음, R-05)
- `event_002.py` 클릭 시 다음 사건 표시
- 잘못된 값 입력 시 Terminal 오류, 상태 변화 없음 (AC-07 초기 확인)
- 데이터는 하드코딩 허용. 단, parser는 `engine/`에 순수 함수로 두어 P03에서 그대로 쓴다.

## 완료 기준

- 시연: `action` 값 수정 → 실행 → 로그 → 새 파일 생성 → 열기
- parser 단위 테스트: 유효 값 3종 통과, 범위 밖·리터럴 아님·타입 불일치 각 오류 반환 — 과소/과잉 엄격 양방향
- 잘못된 값 실행 후 Explorer·로그 외 상태가 변하지 않음을 확인

## 병행 가능 작업 / 제외

- 병행 가능: P04 시나리오 초안 집필(텍스트만)
- 제외: 데이터 기반 시나리오 구조, 저장, 다중 스테이지, 엔딩

## 관련 결정 브리프

- [DB-02 — 편집 모델](../decision_briefs/02_editing_model.md) (해결됨)
