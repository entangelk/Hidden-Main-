# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 21줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.5 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — **P01 (IDE 셸) 진행 중**
- 코드: IDE 레이아웃까지 있음. `src/app/App.tsx`가 탭·활성 파일 상태를 들고 `src/ui/`의 Explorer·Tabs·Terminal·StatusBar를 조립. 편집기 자리는 아직 읽기 전용 `<pre>`(3단계에서 Monaco로 교체). 파일 목록은 임시 `src/app/sampleFiles.ts`(P02에서 시나리오 데이터로 교체).
- 명령: `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- `npm run lint`는 경고도 실패로 처리한다(`--deny-warnings`).
- SoT 내용 변경은 Owner 합의가 있어야 한다. Owner가 위임한 판단의 결과도 합의로 본다(SoT §1).

## 다음 작업

1. P01 3단계: `src/ui/editor/`에 Monaco 연결(로컬 번들, CDN 미사용), 다크 테마, `Ctrl/Cmd+Enter` → Terminal 출력
