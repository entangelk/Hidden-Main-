# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 24줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.5 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — **P01 (IDE 셸) 진행 중**
- 코드: IDE 레이아웃까지 있음. `src/app/App.tsx`가 탭·활성 파일 상태를 들고 `src/ui/`의 Explorer·Tabs·Terminal·StatusBar를 조립. 편집기는 `src/ui/editor/`의 Monaco(파일별 모델, 편집 내용은 메모리에만). `Ctrl/Cmd+Enter`는 P01 연결 확인용으로 `$ python <활성 파일>`(열린 탭이 없으면 `$ python`)만 출력(P02에서 엔진 실행으로 교체). Monaco 모델은 파일별로 처음 열 때 한 번 만들고, 원본 내용이 바뀌어도 따라가지 않는다 — P02에서 엔진이 파일 내용을 바꾸게 되면 이 부분을 손봐야 한다. 파일 목록은 임시 `src/app/sampleFiles.ts`(P02에서 시나리오 데이터로 교체).
- 명령: `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- `npm run lint`는 경고도 실패로 처리한다(`--deny-warnings`).
- Monaco는 `monaco-editor/editor/editor.api`와 필요한 기능만 골라 import한다(`src/ui/editor/monaco.ts`). 기능(찾기, 자동완성 등)이 더 필요하면 그 파일에 contrib import를 추가한다. codicon CSS는 패키지 exports로 닿지 않아 `vite.config.ts`의 alias(`monaco-codicon.css`)로 가져온다.
- `npm run build`가 메인 청크 500kB 초과 경고(약 3MB, gzip 약 780kB)를 낸다. 대부분 Monaco다. 실패는 아니며 P05에서 분할 여부를 본다.
- SoT 내용 변경은 Owner 합의가 있어야 한다. Owner가 위임한 판단의 결과도 합의로 본다(SoT §1).

## 다음 작업

1. P01 2차 재검증 → 통과하면 P01 Complete
2. P02 핵심 루프 프로토타입
