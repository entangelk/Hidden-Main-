# P05 배포 준비 독립 검증

## 1. 대상 정보

- 날짜: 2026-10-22
- 요청자: Owner(작업 위임 에이전트 경유)
- 검증자: Claude(독립 검증 서브에이전트, 이 작업을 만들지 않음)
- 대상: 커밋 `a2d91d0` (`git diff ca34e8b..a2d91d0`), 브랜치 `claude/compassionate-ramanujan-qoaiw1`
  - `vite.config.ts`, `index.html`, `.github/workflows/deploy.yml`, `docs/SOT.md`(v0.6), `docs/phases/P05_polish_and_release.md`, `docs/phases/00_index.md`, `HANDOFF.md`, `docs/daily_logs/2026-10-22/work_log.md` §28
- 정본 기준: `docs/SOT.md` v0.6 §3.5·§3.6(AC-05·AC-08의 세부 규칙), §6(AC-01~AC-10), §7, §8, §9 v0.6 행; `docs/phases/P05_polish_and_release.md` 범위·완료 기준

## 2. 범위

1. 배포 워크플로 정합성(`deploy.yml`)과 깨끗한 복사본에서 `npm ci`
2. 하위 경로(`/Hidden-Main-/`) 빌드 구동: 요청 상태, 콘솔, 외부 요청, Monaco 워커, codicon 글꼴, 두 엔딩, localStorage 저장·새로고침 복원
3. 작업 로그 §28 완료 기준 점검표의 근거(AC-04~AC-08 직접 재현)
4. 번들 결정(한 청크 + 경고 기준 상향)과 회귀(소스맵·개발 코드)
5. 기록(SoT v0.6, HANDOFF, P05·인덱스 상태)
6. `npm run lint`, `npm test`, `npm run build` 정확한 결과

## 3. 방법

`<S>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad`

- `npm ci`: 저장소 밖 복사본에서 실행 — `git archive a2d91d0 | tar -x -C <S>/ci`, 그 안에서 `npm ci && npm run lint && npm test && npm run build` (Node v22.22.0, npm 10.9.4). `npx oxlint --deny-warnings; echo $?`로 종료 코드 확인. `npm audit`.
- 저장소 안 `npm run build` 결과 `dist`와 복사본 `dist`를 `diff -rq`로 비교(동일).
- 액션 버전: `git ls-remote --tags https://github.com/actions/<name>`로 주 버전 태그 존재·최신 확인, `git clone --depth 1 --branch <tag>`로 각 고정 버전의 `action.yml` `runs.using` 확인, `configure-pages@v5`의 `src/api-client.js`·`action.yml`에서 Pages 미설정 시 동작 확인. GitHub에는 아무것도 푸시·실행하지 않았다(`gh api`는 세션 권한 없음으로 거부됨, 쓰기 시도 없음).
- 하위 경로 구동: `dist`를 `<S>/p05/site/Hidden-Main-/`에 복사, `<S>/p05/site`에서 `python3 -m http.server 4190 --bind 127.0.0.1`. Playwright(`/opt/node22/lib/node_modules/playwright/index.mjs`, 설치된 Chromium, 1280×2400, `playwright install` 안 함). 스크립트 `<S>/p05/play.mjs`(두 경로 자동 플레이 + AC-04~08 확인), `<S>/p05/probe.mjs`(워커 강제 생성, AC-06 화면). 각 경로는 새 브라우저 컨텍스트. 수집: `console` error/warning, `pageerror`, 모든 `response` 상태, `requestfailed`, 비 127.0.0.1 요청, `worker` 이벤트. 끝난 뒤 내가 띄운 python 서버(PID 1705)만 종료.
- 변이 테스트: 해당 없음. 이번 변경은 빌드 설정·워크플로·문서이고, 이를 지키는 회귀 테스트 계약이 없다. 대신 실제 빌드·하위 경로 구동으로 확인했다.
- 저장소 상태: 검증 전후 `git status --short` 비어 있음, HEAD `a2d91d0` 그대로. 새 파일은 이 기록 하나(`dist/`는 gitignore).

## 4. 결과

### 4.1 워크플로 (`.github/workflows/deploy.yml`)

- 트리거: `.github/workflows/deploy.yml:6-8` `push: branches: [main]` + `workflow_dispatch`. 목적에 맞음.
- 권한: `.github/workflows/deploy.yml:10-13` `contents: read`, `pages: write`, `id-token: write` — `deploy-pages`가 요구하는 최소 조합과 같음.
- 동시성: `.github/workflows/deploy.yml:15-17` `group: pages`, `cancel-in-progress: false` — GitHub 공식 Pages 시작 워크플로와 같은 설정(진행 중 배포를 끊지 않음).
- 잡 연결: `deploy`가 `needs: build`(`:38`), `environment: github-pages`, `url: ${{ steps.deployment.outputs.page_url }}`(`:40-42`)가 `id: deployment`(`:44`)와 맞음. 아티팩트 경로 `dist`(`:35`)는 Vite 기본 `outDir`과 같음(`vite.config.ts`에 `outDir` 재정의 없음).
- 단계: `npm ci`·`npm run lint`·`npm test`·`npm run build`(`:28-31`)가 `package.json` scripts(`lint`=`oxlint --deny-warnings`, `test`=`vitest run`, `build`=`tsc -b && vite build`)와 일치. `cache: npm`(`:27`)은 추적 중인 `package-lock.json`(git ls-files로 확인)을 씀. `node-version: 22`(`:26`)는 Vite의 `engines.node` `^20.19.0 || >=22.12.0`를 만족(현재 22.x 최신).
- 액션 버전: 고정한 주 버전 태그는 모두 존재. 짝도 맞음 — `upload-pages-artifact@v3`는 내부에서 `actions/upload-artifact@v4`를 쓰고(`action.yml:77`), 이는 `deploy-pages@v4`가 받는 아티팩트 형식이다. 다만 모두 최신보다 1~3 주 버전 뒤이고, 런타임이 `node20`이다: `checkout@v4`(node20, 최신 v7=node24), `setup-node@v4`(node20, 최신 v7), `configure-pages@v5`(node20, 최신 v6), `upload-pages-artifact@v3`(composite, 최신 v5), `deploy-pages@v4`(node20, 최신 v5=node24). → 하드닝 H1.
- 첫 실행 실패 조건: Pages Source가 "GitHub Actions"로 설정되지 않으면 `configure-pages@v5`(`:32`)가 `enablement` 기본값 `false`(그 `action.yml:18-20`)라 사이트를 만들지 않고 `Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions, or consider exploring the \`enablement\` parameter for this action. Error: Not Found`로 **build 잡에서** 실패한다(lint·test·build는 이미 통과한 뒤). `HANDOFF.md:33`이 "Pages 설정 → 병합" 순서로 적어 이를 피한다. 정확함.
- 환경 보호 규칙: Source를 GitHub Actions로 바꾸면 `github-pages` 환경은 기본 브랜치만 배포 허용으로 만들어진다. 기본 브랜치는 `main`(`git ls-remote --symref origin HEAD` → `refs/heads/main`)이므로 `main` 푸시 경로는 통과. 다른 브랜치에서 `workflow_dispatch`하면 deploy 잡이 환경 규칙으로 거부된다 → 하드닝 H2.
- `npm ci`(깨끗한 복사본): `added 54 packages, and audited 55 packages in 5s`, 종료 0. `2 vulnerabilities (1 low, 1 critical)` — critical은 `monaco-editor >=0.57.0-rc.2`가 끌어오는 `dompurify <=3.4.16`. 이번 커밋에서 생긴 것이 아님(의존성 변경 없음) → 하드닝 H3.

### 4.2 하위 경로 구동 (`/Hidden-Main-/`)

- 빌드 결과 `dist/index.html`이 `./assets/index-80HJy1DE.js`, `./assets/index-DMqmZDha.css`를 상대 경로로 참조(`vite.config.ts:14` `base: './'`의 효과). CSS의 글꼴은 `url(./codicon-DF1abBS2.ttf)`, 워커는 `new URL("editor.worker-CRz__AKW.js", import.meta.url)` — 모두 하위 경로에서 해석된다.
- 실제 요청(두 경로 전체): `/Hidden-Main-/`, `/Hidden-Main-/assets/index-80HJy1DE.js`, `…/index-DMqmZDha.css`, `…/python-BYIRYFzY.js`, `…/codicon-DF1abBS2.ttf`. 2xx/3xx 아닌 응답 0, 실패 요청 0, 외부 요청 0, 콘솔 error/warning·pageerror 0. favicon 요청 없음(`index.html:7` `data:,`).
- codicon 글꼴: `codicon-DF1abBS2.ttf` 요청 200, `document.fonts`의 codicon FontFace `status = "loaded"`.
- Monaco 워커: 일반 플레이(값 입력·실행·탭 전환) 중에는 **생성되지 않는다**(`worker` 이벤트 0, 워커 요청 0) — 이 구성에서는 편집 워커를 쓰는 contrib가 없기 때문으로 보인다(`src/ui/editor/monaco.ts:1-13`). 하위 경로에서 로드 가능한지는 페이지에서 `self.MonacoEnvironment.getWorker()`를 직접 호출해 확인: `worker http://127.0.0.1:4190/Hidden-Main-/assets/editor.worker-CRz__AKW.js`, 응답 200, 1.5초 동안 오류 없음. 작업 로그는 워커 로드를 주장하지 않으므로 기록상 문제는 아님.
- 두 엔딩: P1(`1, 2, True, "backup", 1, True, 1, 20, 1, "B2-07", 1, 1, "security"`) → `사건 INC-0214 종결 (원인 규명)`; P2(`3, 5, False, "guest", 2, False, 3, 80, 2, "B2-11", 3, 2, 'archive'`) → `사건 INC-0214 종결 (원인 미상)`. 엔딩 뒤 새로고침해도 마지막 두 줄 동일.
- localStorage: 키 `incident-workspace:save:incident-0214`가 하위 경로 출처에 생성됨, 새로고침 복원 확인(4.3 AC-08).

### 4.3 완료 기준 점검표 (작업 로그 `docs/daily_logs/2026-10-22/work_log.md:299-310`)

직접 재현(하위 경로 빌드, 브라우저):

- AC-04(`work_log.md:304`): 시작 시 Explorer `config, config/settings.py, incidents, incidents/event_001.py, main.py` → event_001.py의 세 사건 해결 후 `incidents/security_audit.py` 추가, Terminal `[workspace] incidents/security_audit.py 생성됨`. **근거 사실.**
- AC-05(`work_log.md:305`): 해금 직후 `main.py` 탭에서 `Ctrl+Enter` → `실행할 파일: incidents/security_audit.py (현재 탭: main.py)` 한 줄, 저장된 `progress` 바이트 동일(SoT §3.5 `docs/SOT.md:88-89`). 새 파일을 열고 실행하면 진행(두 경로 완주로 확인). **근거 사실.**
- AC-06(`work_log.md:306`): event_001.py 탭을 닫은 뒤 Explorer에서 다시 열기 → `alert_id = 2048, severity = 0.73, action = 1, hour = 2, notify_security = True`가 보이고 값 슬롯 0개(해결한 값은 고정). **근거 사실.**
- AC-07(`work_log.md:307`): `action`에 `abc`/`99`/빈 값/`"1"`/`1 + 1` 입력 후 실행 → 각각 `SyntaxError`/`ValueError: … 1, 2, 3 중 하나여야`/`SyntaxError (입력: 없음)`/`TypeError`/`SyntaxError` 줄만 Terminal에 출력, Explorer 목록과 저장된 `progress` 불변. **근거 사실.**
- AC-08(`work_log.md:308`): power_control.py에서 `limit`에 `33` 입력 직후(디바운스 대기 없이) 새로고침 → `limit = 33`, Explorer·탭 목록 동일, 진행 로그 26줄 모두 복원. 사라진 17줄은 모두 일시 출력(Traceback·오류·"실행할 파일" 안내)으로, 저장하지 않는다는 설계(`HANDOFF.md:17`, SoT §3.6 `docs/SOT.md:94-95`의 저장 대상에 없음)와 맞음. **근거 사실.**

근거 확인(재현 대신):

- AC-01·AC-02(`work_log.md:301-302`): 위 두 경로 완주가 IDE 화면만으로, 정수·불리언·수치·문자열 편집으로 이뤄짐. 사실.
- AC-03(`work_log.md:303`): `# @if` 주석 변형은 시나리오 파일에 16곳(`grep -c`), "9곳+" 주장과 모순 없음. 경로별 로그 차이는 두 엔딩 터미널로 확인.
- AC-09(`work_log.md:309`): `src/scenario/validate.test.ts:14-17`이 모든 상태 탐색으로 엔딩 `['resolved', 'sealed']` 도달을 단언, 브라우저로도 둘 다 도달. 사실.
- AC-10(`work_log.md:310`)은 **사람 확인 필요**로 표시, R-07(`work_log.md:312`)도 Owner 플레이 테스트로 남김. `HANDOFF.md:35`, `work_log.md:351`도 동일. 어디에서도 통과를 주장하지 않음. P05 완료 기준(`P05_polish_and_release.md:24`)상 AC-10 미확인이므로 P05는 아직 완료가 아님 — 인덱스(`docs/phases/00_index.md:12`)·P05(`:3`) 모두 In Progress로 일치.

### 4.4 번들 결정

- `vite.config.ts:16-20`에 이유를 적고 `chunkSizeWarningLimit: 3500`으로 올림. 실제 메인 청크 3,020.16 kB(gzip 790.89 kB) — 경고 없이 빌드, 여유 약 16%. 편집기가 첫 화면에 바로 필요해 분할해도 첫 표시가 빨라지지 않는다는 근거는 타당. `HANDOFF.md:26`, `work_log.md:295`에도 기록.
- 표현상 "One chunk"는 엄밀히는 메인 청크 하나 + 지연 로드 `python-*.js`(3.45 kB) + 워커 파일이다. 실질 의미(Monaco를 따로 나누지 않음)는 맞음.
- 회귀 없음: `dist`에 `.map` 파일 0, `sourceMappingURL` 0, 메인 번들에 `localhost`·`import.meta.hot`·`__vite` 0. `index.html`의 개발용 `/src/main.tsx` 참조는 빌드 결과에서 사라짐.

### 4.5 기록

- SoT v0.6: `docs/SOT.md:3`, `:172`(§7에 "정적 웹 호스팅(GitHub Pages)"), `:180`(§8 미룬 결정 없음), `:193`(버전 로그). Owner 발화 "그래 그렇게 해줘"(권장안 수락)는 `work_log.md:293`에 인용 기록. 검증자는 원 대화를 볼 수 없어 발화 자체는 기록에 의존한다. 내용(호스트=GitHub Pages)은 발화 범위를 넘지 않는다.
- 버전 로그 v0.6 행(`docs/SOT.md:193`)은 "(§8)"만 적었지만 본문 변경은 §7에도 있음 → 하드닝 H4.
- `HANDOFF.md:7`이 여전히 "`docs/SOT.md` v0.5"라고 적혀 있다. 이번 커밋이 SoT를 v0.6으로 올렸으므로 이 줄은 더는 사실이 아니다(`docs/guides/records-and-handoff.md:112-113` "delete what stopped being true"). → 차단 B1.
- HANDOFF 다음 작업(`HANDOFF.md:33-36`): Pages 설정 → `main` 병합 순서가 4.1의 실패 조건과 맞고, 병합·푸시는 Owner 몫으로 적혀 있음(작업자는 푸시하지 않음, `CLAUDE.md` §6). `origin/main`(`719031d`)은 `a2d91d0`의 조상이라 fast-forward 병합 가능(30커밋). 배포 URL `https://entangelk.github.io/Hidden-Main-/`은 원격 `entangelk/Hidden-Main-`과 일치. 실행 가능한 지시임.
- HANDOFF에 완료 서사·시각·PID·커밋 해시 없음. `HANDOFF.md:35`의 "나머지 AC-01~09는 통과(작업 로그 28번)"는 다음 작업 범위를 좁히는 현재 상태 정보로 허용 범위.

### 4.6 명령 결과

| 명령 | 결과 |
| --- | --- |
| `npm ci`(복사본) | `added 54 packages, and audited 55 packages`, 종료 0, `2 vulnerabilities (1 low, 1 critical)` |
| `npm run lint` | 출력 없음, 종료 0 |
| `npm test` | `Test Files 12 passed (12)`, `Tests 119 passed (119)` |
| `npm run build` | `✓ 764 modules transformed`, 메인 청크 `3,020.16 kB │ gzip: 790.89 kB`, 크기 경고 없음, `✓ built` |

## 5. 문제 / 위험

### 차단

- **B1** `HANDOFF.md:7` — SoT 버전이 `v0.5`로 남아 있음. 이번 커밋이 `docs/SOT.md:3`을 v0.6으로 올렸으므로 HANDOFF의 정본 기준 표시가 틀렸다. `v0.6`으로 고쳐야 함(한 단어 수정).

### 하드닝 (비차단)

- **H1** `.github/workflows/deploy.yml:23,24,32,33,45` — 액션이 최신보다 1~3 주 버전 뒤이고 node20 런타임. 지금 동작에는 문제가 없지만 러너의 Node 20 지원 종료에 따라 경고가 붙거나 이후 실패할 수 있다. `checkout@v7`·`setup-node@v7`·`configure-pages@v6`·`upload-pages-artifact@v5`·`deploy-pages@v5`로 올리는 것을 검토(올릴 때 서로 짝이 맞는지 다시 확인).
- **H2** `.github/workflows/deploy.yml:8,40-41` — `workflow_dispatch`는 기본 브랜치 외에서 실행하면 `github-pages` 환경 규칙으로 deploy 잡이 거부된다. 수동 실행은 `main`에서만 하라는 한 줄을 파일 머리 주석(`:1-2`)에 적어 두면 혼동이 줄어든다.
- **H3** `package.json:14` — `monaco-editor ^0.57.0`이 끌어오는 `dompurify <=3.4.16` critical 권고. 이번 커밋 이전부터 있던 것. 게임이 DOMPurify의 해당 모드를 쓰는지 확인하고, Monaco 패치 릴리스가 나오면 올릴 것.
- **H4** `docs/SOT.md:193` — v0.6 행이 "(§8)"만 가리킴. 본문 변경은 §7(`:172`)에도 있으므로 "(§7, §8)"이 정확.
- **H5** `vite.config.ts:17` — "One chunk"는 지연 로드 Python 문법 청크와 워커 파일을 빼고 말한 것. 오해 소지가 작지만 "Monaco를 따로 나누지 않음"으로 쓰면 정확.

## 6. 판정

**조건부 합격** — `HANDOFF.md:7`의 SoT 버전을 v0.6으로 고칠 것(B1).

- 배포 워크플로는 권한·잡 연결·아티팩트 경로·액션 짝이 맞고, 깨끗한 복사본에서 `npm ci`→lint→test→build가 통과한다.
- `/Hidden-Main-/` 하위 경로에서 비정상 응답·콘솔 오류·외부 요청 0, codicon 글꼴 로드, 워커 로드 가능, 두 엔딩 도달, 저장·새로고침 복원 확인.
- AC-04~AC-08 직접 재현으로 점검표 근거가 사실이고, AC-10·R-07은 사람 확인 필요로 정직하게 남아 있다.
- B1은 배포 동작과 무관한 기록 오류이므로, 배포를 위한 `main` 병합 자체를 막지는 않는다. 다만 병합 전에 고치는 것이 가장 싸다.

## 7. 남은 일 (결함 아님)

- Owner: 저장소 Settings → Pages → Source "GitHub Actions" 설정 후 브랜치를 `main`에 병합(푸시는 Owner만).
- 배포 URL에서 처음부터 엔딩까지 확인 — 이 검증은 로컬 하위 경로로 대신했을 뿐 실제 Pages 배포는 확인하지 못했다.
- AC-10·R-07 Owner 플레이 테스트, CHANGELOG v0.1, P05 Complete.
- 검증자는 커밋하지 않았다. 새로 생긴 파일은 이 기록 하나.

## 8. 재현

```bash
S=/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad
cd /home/user/Hidden-Main-
git archive a2d91d0 | (mkdir -p $S/ci && tar -x -C $S/ci)
(cd $S/ci && npm ci && npx oxlint --deny-warnings; echo $?; npm test && npm run build && npm audit)
npm run build && diff -rq dist $S/ci/dist
mkdir -p $S/p05/site/Hidden-Main- && cp -r dist/. $S/p05/site/Hidden-Main-/
(cd $S/p05/site && python3 -m http.server 4190 --bind 127.0.0.1 &)   # 끝나면 이 python PID만 종료
node $S/p05/play.mjs    # 두 엔딩 + AC-04~08 + 요청·콘솔·외부 요청 집계
node $S/p05/probe.mjs   # MonacoEnvironment.getWorker() 강제 호출, AC-06 재열람 화면
for a in checkout setup-node configure-pages upload-pages-artifact deploy-pages; do git ls-remote --tags https://github.com/actions/$a | grep -oE 'refs/tags/v[0-9]+$' | sort -V | tail -3; done
git status --short   # 이 기록 파일만
```
