# P01 — IDE 셸

**상태:** Complete (검증: `docs/verifications/2026-10-22/p01_ide_shell*.md`) · [인덱스](00_index.md)

## 목표

게임 로직 없이, 실제 코드 편집기처럼 보이고 동작하는 화면을 만든다 (ideation Week 1).

## 선행 조건

없음.

## 범위

- Vite + React + TypeScript 프로젝트 초기화, Vitest 설정
- [아키텍처 §7](../architecture/00_overview.md#7-디렉터리-구조) 디렉터리 구조를 따른다. git은 빈 폴더를 기록하지 않으므로 폴더는 첫 파일이 생길 때 만든다: P01에서 `app/`, `ui/`(2단계), `ui/editor/`(3단계); `engine/`·`scenario/`·`persistence/`는 P02·P03에서
- Monaco Editor 연결: Python 문법 강조, 줄 번호, 함수 접기
- VS Code 계열 다크 테마
- Explorer: 하드코딩된 파일 목록(폴더 포함) 트리 표시, 클릭으로 열기
- 탭: 여러 파일 열기·전환·닫기, 수정 상태(●) 표시
- Terminal 패널: 텍스트 줄 추가 API만 (내용은 아직 없음)
- Status Bar: `Python`, `UTF-8`, 현재 파일명
- `Ctrl/Cmd+Enter` 단축키 바인딩 → Terminal에 실행 줄 출력(`$ python <활성 파일>`, 열린 탭이 없으면 `$ python`). 연결 확인용이며 P02에서 엔진 실행으로 바뀐다

## 완료 기준

- `npm run build` 성공
- 수동 확인: 파일 2개 이상 열기·편집·탭 전환·접기, 단축키로 Terminal 출력
- `npm test` 종료 코드 0: 2단계의 Explorer 트리 변환 함수 테스트가 첫 테스트

## 병행 가능 작업 / 제외

- 제외: 값 파싱, 게임 상태, 저장, 시나리오 내용, 게임 전용 UI 일체 (R-01)

## 관련 결정 브리프

없음. P02에서 [DB-02](../decision_briefs/02_editing_model.md)(값만 편집) 제한을 붙이므로 Monaco 래퍼는 `ui/editor/` 한 곳에 모아 둔다.
