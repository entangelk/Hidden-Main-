# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 29줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.5 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — P01·P02 완료, **다음은 P03 (데이터 기반 스토리 엔진 + 저장)**
- 코드 구성:
  - `src/engine/`: 순수 로직 — `types.ts`(계약 일부), `parser.ts`(`parse`·`readLiteral`·`formatLiteral`), `slots.ts`(`functionBlock`·`findValueSlots`·`shiftSlots`·`applyEdits`).
  - `src/app/prototype.ts` + `prototype/*.py`: P02용 하드코딩 시나리오(사건 2개, 분기 없음). P03에서 시나리오 데이터·엔진 `apply`/`derive`로 교체.
  - `src/app/runPrototype.ts`: 실행 한 번의 순수 함수(아키텍처 §3 흐름) — 출력 줄과, 검증 통과 시 추가할 `Choice`를 돌려줌.
  - `src/app/App.tsx`: 진행(`choices`)·편집 값(`PlayerEdits`) — 둘 다 ref에도 동기 기록 — 와 탭 상태를 들고 `runPrototype` 결과를 반영. Terminal 줄은 이벤트마다 추가만 하는 상태(P03에서 재생 기반으로 바뀜).
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

1. P03 데이터 기반 스토리 엔진 + 저장 ([`docs/phases/P03_story_engine_and_save.md`](docs/phases/P03_story_engine_and_save.md))
