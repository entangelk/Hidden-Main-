# HANDOFF

> 마지막 자가 검수: 2026-10-22 · 24줄

## 현재 상태

- 제품 기준: [`docs/SOT.md`](docs/SOT.md) v0.2 (우선순위 트리는 SoT §1). 미결 Owner 결정 없음.
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 페이즈: [`docs/phases/00_index.md`](docs/phases/00_index.md) — **P01 (IDE 셸) 진행 중**
- 코드: Vite + React + TS 골격만 있음. `src/main.tsx` → `src/app/App.tsx`(빈 화면). 테스트 파일 없음.
- 명령: `npm run dev` / `npm run build` / `npm run lint` / `npm test`

## 주의 사항

- `docs/plan/ideation.md`는 원천 기획으로 수정하지 않는다. SoT와 충돌하면 SoT가 우선이다.
- 아키텍처의 "진행 상태 = `choices` 기록만 저장, 나머지는 재생으로 파생" 설계는 Owner 검토 전이다. P03 선행 조건으로 걸어 둠.
- `npm test`는 테스트 파일이 없으면 실패한다(Vitest 기본 동작). P01 2단계에서 첫 테스트가 생기며, 통과가 P01 완료 조건이다.
- `npm run lint`는 경고도 실패로 처리한다(`--deny-warnings`).
- 독립 검증 기록: `docs/verifications/2026-10-22/` — 재검증 중.

## 다음 작업

1. P01 2단계: IDE 레이아웃 — `src/ui/`에 Explorer(경로 목록 → 트리 변환 + 테스트), 탭, Terminal, Status Bar
2. P01 3단계: `src/ui/editor/`에 Monaco 연결(로컬 번들, CDN 미사용), 다크 테마, `Ctrl/Cmd+Enter` → Terminal 출력
