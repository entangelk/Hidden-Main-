# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 28줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.5 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — P01 완료, **P02 (핵심 루프 프로토타입) 진행 중 — 독립 검증 대기**
- 코드 구성:
  - `src/engine/`: 순수 로직 — `types.ts`(계약 일부), `parser.ts`(리터럴 해석·검증·`formatLiteral`), `slots.ts`(`functionBlock`·`findValueSlots`·`applyEdits`).
  - `src/app/prototype.ts` + `prototype/*.py`: P02용 하드코딩 시나리오(사건 2개, 분기 없음). P03에서 시나리오 데이터·엔진 `apply`/`derive`로 교체.
  - `src/app/App.tsx`: 진행(`choices`)·편집 값(`PlayerEdits`, ref 동기 기록)·탭 상태를 들고 실행 흐름(아키텍처 §3)을 수행. Terminal 줄은 이벤트마다 추가만 하는 상태(P03에서 재생 기반으로 바뀜).
  - `src/ui/editor/CodeEditor.tsx`: 엔진 `FileView`를 표시, `acceptChange`로 값 슬롯 밖 편집을 실행 취소로 되돌림, 엔진 쪽 텍스트가 바뀌면 모델을 다시 씀.
  - 저장 없음(P03).
- 명령: `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- `npm run lint`는 경고도 실패로 처리한다(`--deny-warnings`).
- Monaco는 `monaco-editor/editor/editor.api`와 필요한 기능만 골라 import한다(`src/ui/editor/monaco.ts`). 기능(찾기, 자동완성 등)이 더 필요하면 그 파일에 contrib import를 추가한다. codicon CSS는 패키지 exports로 닿지 않아 `vite.config.ts`의 alias(`monaco-codicon.css`)로 가져온다.
- `npm run build`가 메인 청크 500kB 초과 경고(약 3MB, gzip 약 780kB)를 낸다. 대부분 Monaco다. 실패는 아니며 P05에서 분할 여부를 본다.
- SoT 내용 변경은 Owner 합의가 있어야 한다. Owner가 위임한 판단의 결과도 합의로 본다(SoT §1).

## 다음 작업

1. P02 핵심 루프 프로토타입 ([`docs/phases/P02_core_loop_prototype.md`](docs/phases/P02_core_loop_prototype.md))
