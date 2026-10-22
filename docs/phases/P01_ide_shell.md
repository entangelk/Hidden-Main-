# P01 — IDE 셸

**상태:** Planned · [인덱스](00_index.md)

## 목표

게임 로직 없이, 실제 코드 편집기처럼 보이고 동작하는 화면을 만든다 (ideation Week 1).

## 선행 조건

없음.

## 범위

- Vite + React + TypeScript 프로젝트 초기화, Vitest 설정
- [아키텍처 §7](../architecture/00_overview.md#7-디렉터리-구조-예정) 디렉터리 골격 (`engine/`, `scenario/`, `persistence/`, `ui/`, `app/`)
- Monaco Editor 연결: Python 문법 강조, 줄 번호, 함수 접기
- VS Code 계열 다크 테마
- Explorer: 하드코딩된 파일 목록(폴더 포함) 트리 표시, 클릭으로 열기
- 탭: 여러 파일 열기·전환·닫기, 수정 상태(●) 표시
- Terminal 패널: 텍스트 줄 추가 API만 (내용은 아직 없음)
- Status Bar: `Python`, `UTF-8`, 현재 파일명
- `Ctrl/Cmd+Enter` 단축키 바인딩 → Terminal에 고정 문구 출력 (연결 확인용)

## 완료 기준

- `npm run build` 성공
- 수동 확인: 파일 2개 이상 열기·편집·탭 전환·접기, 단축키로 Terminal 출력
- Vitest가 실행되고 샘플 테스트 1개 통과 (P02부터 실제 테스트가 붙을 자리 확보)

## 병행 가능 작업 / 제외

- 병행 가능: DB-02~04에 대한 Owner 결정
- 제외: 값 파싱, 게임 상태, 저장, 시나리오 내용, 게임 전용 UI 일체 (R-01)

## 관련 결정 브리프

없음. 단, DB-02 결과에 따라 P02에서 편집 제한 기능을 추가하므로 Monaco 래퍼는 `ui/editor/` 한 곳에 모아 둔다.
