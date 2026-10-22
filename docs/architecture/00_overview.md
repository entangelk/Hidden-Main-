# 아키텍처 개요

> 상태: **v0.2 초안** · 2026-10-22 · 상위 기준: [`../SOT.md`](../SOT.md)
> 이 문서는 SoT의 요구사항을 어떤 구조로 구현할지 정한다. SoT와 충돌하면 SoT가 우선한다.
> Owner 결정(DB-01~04, 모두 B)을 반영한 부분은 해당 브리프 ID로 표시한다.

---

## 1. 전체 구조

브라우저 단일 앱이다. 서버, DB, Python 런타임이 없다.

```text
┌──────────────────────────── UI (React) ─────────────────────────────┐
│  Explorer   Tabs   EditorPane(Monaco)   Terminal   StatusBar        │
└──────▲───────────────────────▲─────────────────────────▲────────────┘
       │ 선택자(selectors)      │ 실행 요청(Run)            │ 로그
┌──────┴───────────────────────┴─────────────────────────┴────────────┐
│ App wiring: 상태 보관, 이벤트 연결, 자동 저장 트리거                    │
└──────▲──────────────────▲───────────────────────▲───────────────────┘
       │                  │                       │
┌──────┴──────┐  ┌────────┴────────┐   ┌──────────┴──────────┐
│ Engine      │  │ Scenario data   │   │ Persistence adapter │
│ (순수 TS)    │◀─│ (Engine 타입 사용) │   │ (localStorage)      │
└─────────────┘  └─────────────────┘   └─────────────────────┘
```

### 1.1 의존 방향

- **Engine**은 React, Monaco, localStorage를 import하지 않는 순수 TypeScript다. 입력(시나리오 + 플레이어 선택)에서 출력(상태, 로그, 파일 내용)을 결정적으로 계산한다.
- **Scenario data**는 Engine의 타입에만 의존한다. 엔진 코드를 바꾸지 않고 시나리오를 교체할 수 있어야 한다(ideation §6.2).
- **UI / Persistence**는 바깥 어댑터다. Engine 쪽으로만 의존한다.
- Monaco 전용 처리(읽기 전용 범위, 단축키, 데코레이션)는 `ui/editor/` 안에만 둔다.

---

## 2. 모듈 책임

ideation §6.1의 6개 모듈을 위 경계에 배치한 결과다.

| 모듈 (ideation) | 위치 | 책임 | 하지 않는 것 |
| --- | --- | --- | --- |
| Story Engine | `engine/` | 선택 적용, 상태 전이, 스테이지 해금, 엔딩 판정, 로그 이벤트 생성 | 화면 렌더링, 저장 |
| Input Parser | `engine/` | 현재 사건의 편집 값(원문 리터럴) 해석, 타입·허용값 검증 | 파일 텍스트 탐색, 분기 결과 결정 |
| Workspace Manager | `engine/` (파일 목록·내용 계산) + `ui/` (열린 탭) | 해금 파일 목록과 각 파일의 표시 내용 계산 | 상태 소유 (상태에서 파생만 함) |
| Editor Controller | `ui/editor/` | Monaco 연결, `Ctrl/Cmd+Enter`, 지정 값 영역 외 편집 차단(DB-02), 값 영역의 텍스트를 `PlayerEdits`로 전달 | 값 해석 |
| Terminal Renderer | `ui/terminal/` | Engine이 만든 로그 이벤트를 텍스트로 표시 | 로그 내용 결정 |
| Save Manager | `persistence/` | 저장 스냅샷 직렬화·복원, 버전 검사 | 게임 규칙 |

---

## 3. 실행 흐름 (`Ctrl+Enter`)

```text
1. App: 실행 대상 = derive 결과의 currentSceneId (해당 스테이지 파일의 마지막 함수)
2. Engine.parse(scene, playerEdits[scene.id]) → 성공: Choice / 실패: ParseError[]
3. 실패 시: Terminal에 오류 출력, Progress·Explorer·파일 내용 변경 없음 (AC-07)
4. Engine.apply(scenario, progress, choice) → 새 Progress
5. Engine.derive(scenario, 새 Progress)     → 해금 파일, 파일 내용, 로그, 엔딩
6. UI 갱신 (Explorer에 새 파일, Terminal 로그)
7. Persistence.save(SaveSnapshot)
```

- 3단계의 "상태 변경 없음"이 AC-07의 핵심 보증이다. 파싱·검증이 끝나기 전에는 어떤 상태도 쓰지 않는다. 바뀌는 것은 Terminal 오류 출력뿐이다.
- 실행 대상은 커서 위치나 활성 탭과 무관하게 항상 현재 사건 하나다(SoT §3.3). 해결된 함수는 다시 실행할 수 없다. Terminal의 실행 줄(예: `$ python incidents/security_audit.py`)이 대상 파일을 알려준다. 활성 탭과 무관하게 실행한다는 점은 작업 가정이다(SoT §8).
- 엔딩 도달 후(`currentSceneId = null`) 실행하면 Terminal에 한 줄 안내만 하고 상태는 바뀌지 않는다.
- 플레이어 코드는 어떤 경로로도 실행·`eval`되지 않는다 (R-08).

---

## 4. 상태 모델 요약

자세한 소유권과 필드 계보는 [`01_data_contracts.md`](01_data_contracts.md).

- **원본(정본)은 최소로:** 저장되는 게임 진행 상태는 "어떤 사건에서 어떤 값을 골랐는가"의 순서 기록(`choices`)뿐이다.
- **나머지는 파생:** 현재 사건, 플래그, 해금 파일, 엔딩, Terminal 로그, 파일 표시 내용은 시나리오 + `choices`를 처음부터 재생(reduce)해 계산한다.
- 이렇게 하면 같은 사실을 두 곳에 쓰는 일이 없고, 새로고침 복원(AC-08)과 P1 되돌리기가 같은 메커니즘으로 해결된다.

---

## 5. 파일 내용의 3계층

ideation §4.4와 §9("기본 코드, 사용자 수정, 스토리 변경 분리")를 구조로 옮긴 것이다.

| 계층 | 소유자 | 저장 여부 |
| --- | --- | --- |
| 기본 템플릿 | 시나리오 데이터 | 저장 안 함 (번들에 포함) |
| 스토리 오버레이 (주석 변형, 사건 함수 노출, 기존 파일 변경) | Engine (Progress에서 파생) | 저장 안 함 |
| 플레이어 편집 | 플레이어 (EditorPane 경유) | 저장함 |

화면에 보이는 텍스트 = `render(템플릿, 오버레이, 플레이어 편집)`.

- 오버레이 범위(MVP): 진행에 따라 사건 함수를 파일 아래쪽에 추가(DB-03), 새로 추가되는 함수의 주석을 플래그에 따라 선택(DB-01). 이미 보인 텍스트는 바뀌지 않는다.
- 플레이어 편집은 지정 변수의 값 리터럴만이다(DB-02). 화면 텍스트는 매번 `render`로 재구성하므로 계층 사이 충돌이 구조적으로 없다.

---

## 6. Input Parser 규칙 (MVP)

- 입력: 현재 사건의 `PlayerEdits` 항목(필드명 → 원문 리터럴). 편집하지 않은 필드는 템플릿 기본값의 원문. 렌더된 파일 텍스트를 다시 파싱하지 않는다(DB-02(B)로 편집이 값 영역에 한정되므로 불필요).
- 리터럴 문법: 정수, 실수, `True`/`False`, 큰따옴표·작은따옴표 문자열(앞뒤 공백 허용). 그 외(식, 함수 호출, 변수 참조, 빈 값)는 오류.
- 검증: 시나리오의 `EditableField` 정의(타입, 허용값 목록 또는 범위)와 대조.
- 오류 종류: 리터럴 아님(`not_literal`), 타입 불일치(`type_mismatch`), 허용 범위 밖(`out_of_range`). 각 오류는 Terminal에 Python 스타일 메시지로 출력한다. 타입 정의는 [데이터 계약 §4](01_data_contracts.md#4-입력-계약-parser).
- 필드 누락·중복은 구조상 발생하지 않으므로 다루지 않는다.
- 값 영역의 위치 추적(어느 텍스트 구간이 어떤 필드인지)은 Editor Controller의 책임이다. Parser는 텍스트 위치를 모른다.

---

## 7. 디렉터리 구조 (예정)

```text
src/
  engine/          # 순수 TS: types, parser, reducer(apply), derive(selectors)
  scenario/
    incident-0214/ # 첫 시나리오 데이터 + .py 템플릿
  persistence/     # localStorage 어댑터, 저장 스키마 버전
  ui/
    explorer/  editor/  tabs/  terminal/  statusbar/
  app/             # 조립, 상태 보관, 자동 저장 트리거
```

- 시나리오 구조는 TypeScript 객체로 작성한다(DB-04). `.py` 템플릿은 TypeScript 문자열에 넣지 않고 별도 파일로 두어 Vite `?raw` import로 읽는다(들여쓰기 보존, 편집 편의).

---

## 8. 테스트 전략

- Engine(parser, apply, derive)은 순수 함수이므로 단위 테스트의 주 대상이다. 도구는 Vite와 같이 쓰기 쉬운 Vitest를 P01에서 설정한다.
- 시나리오 검증 테스트: 모든 전이 대상이 존재하는지, 모든 사건이 도달 가능한지, 두 엔딩에 각각 도달하는 선택 경로가 있는지 자동 검사한다 (P04).
- UI는 MVP에서 수동 플레이 테스트 + 필요 시 Playwright 스모크 1~2개로 제한한다.

---

## 9. 범위 밖

- Python 실행 또는 일반 Python 구문 분석 (SoT §2, R-08)
- 백엔드, 계정, 클라우드 저장
- VS Code 기능 전체 복제 (검색, 확장, Git 패널 등)
