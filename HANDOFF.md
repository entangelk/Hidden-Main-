# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 30줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.5 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — P01~P03 완료, **다음은 P04 (시나리오 *Incident 02:14*)**
- 코드 구성:
  - `src/engine/`: 순수 로직 — `types.ts`(계약 정본), `parser.ts`(`parse`·`readLiteral`·`formatLiteral`·`valuesFit`), `slots.ts`(함수 블록·값 슬롯·`shiftSlots`·`applyEdits`), `condition.ts`(`holds`), `render.ts`(사건 함수 공개·주석 변형 `# @if`), `derive.ts`(`derive`·`apply`·`validPrefix` — `choices` 재생).
  - `src/scenario/mini/`: 2스테이지·엔딩 2개 소형 시나리오. 테스트와 앱이 함께 쓴다. P04에서 앱은 `incident-0214`로 바뀌고 mini는 테스트용으로 남는다.
  - `src/persistence/save.ts`: 저장 형식(`SaveSnapshot`), `restore`(손상·버전 불일치·저장소 차단 처리), 디바운스 저장기. 키 `incident-workspace:save:<시나리오 id>`.
  - `src/app/run.ts`: 실행 한 번의 순수 함수 `runScene` → 일시 출력 줄 + 새 진행. `src/app/App.tsx`: 진행·편집 값(둘 다 ref 동기 기록)·탭 상태 보관, 저장 연결(진행은 즉시, 편집·탭은 디바운스, `pagehide`는 ref의 최신 값으로 즉시).
  - Terminal = `derive` 로그(재생으로 복원) + 안내·오류 일시 출력(저장 안 함, 새로고침하면 사라짐).
- 명령: `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- `npm run lint`는 경고도 실패로 처리한다(`--deny-warnings`).
- Monaco는 `monaco-editor/editor/editor.api`와 필요한 기능만 골라 import한다(`src/ui/editor/monaco.ts`). 기능(찾기, 자동완성 등)이 더 필요하면 그 파일에 contrib import를 추가한다. codicon CSS는 패키지 exports로 닿지 않아 `vite.config.ts`의 alias(`monaco-codicon.css`)로 가져온다.
- `npm run build`가 메인 청크 500kB 초과 경고(약 3MB, gzip 약 780kB)를 낸다. 대부분 Monaco다. 실패는 아니며 P05에서 분할 여부를 본다.
- 같은 브라우저에서 게임을 여러 탭으로 열면 마지막 저장이 이긴다(알려진 한계, 데이터 계약 §9). 테스트할 때 탭 하나로.
- `.py` 템플릿은 LF(`.gitattributes`). 저장 형식이 깨져 있으면 복원이 안내 후 새 게임으로 시작한다(예외를 던지면 안 됨).
- SoT 내용 변경은 Owner 합의가 있어야 한다. Owner가 위임한 판단의 결과도 합의로 본다(SoT §1).

## 다음 작업

1. P04 시나리오 *Incident 02:14* ([`docs/phases/P04_incident_0214_scenario.md`](docs/phases/P04_incident_0214_scenario.md))
