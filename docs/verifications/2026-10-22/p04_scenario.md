# 독립 검증 — P04 시나리오 *Incident 02:14*

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유 검증 요청) |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 작업을 작성하지 않음) |
| 대상 | 커밋 `2effc5e` — `src/scenario/incident-0214/*`(템플릿 7개 + `index.ts`), `src/scenario/validate.ts`(+test), `src/scenario/scenarioData.test.ts`, `src/app/App.tsx`, `src/ui/editor/CodeEditor.tsx`, `docs/scenario/incident-0214.md`, 아키텍처 §5·§6.2 변경, P04·인덱스, HANDOFF, 작업 로그 §24 |
| 정본 기준 | `docs/SOT.md` v0.5(§2 R-01~R-08, §3.1·§3.4, §5.4, §6 AC-01~AC-10), `docs/phases/P04_incident_0214_scenario.md`, DB-01(Resolved, B), `docs/architecture/00_overview.md` §5·§5.1·§6.1·§6.2, `docs/architecture/01_data_contracts.md` §3, `docs/plan/ideation.md` §4(이야기 의도 참고) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, 범위 `e285fb2..2effc5e`. 검증 시작 시 작업 트리 깨끗함(`git status --short` 출력 없음) |

## 2. 범위

1. 사양 적합성 — P04 범위·완료 기준, SoT §5.4, 사건 수, 엔딩, DB-01, 입력 유형, R-01·R-05·R-07·R-08, 이야기 일관성(단서·로그 대 플래그)
2. 시나리오 문서 대 `index.ts`·템플릿 일치
3. 검증기 `validate.ts` — P04 범위 목록 대비 검사 항목, 거짓 음성, 탐색 후보값, 성능, 뮤테이션 테스트
4. Editor 변경 — `revealRef` 공개 스크롤, 자동 짝 입력·제안 끄기
5. 실제 브라우저 — 두 엔딩 + 혼합 경로 완주, 따옴표 직접 입력, 새 함수 노출, 새로고침 복원, 비활성 탭 안내, 콘솔 오류, 외부 요청, 읽기 분량 추정
6. `npm run build` / `npm run lint` / `npm test`
7. 기록 — HANDOFF, 작업 로그 §24, P04 상태, 사람만 할 수 있는 완료 기준의 처리

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat e285fb2..2effc5e
git diff e285fb2..2effc5e -- docs HANDOFF.md src/app src/ui src/scenario/scenarioData.test.ts
cat -n src/scenario/incident-0214/index.ts src/scenario/incident-0214/*.py src/scenario/validate.ts src/scenario/validate.test.ts
cat -n src/ui/editor/CodeEditor.tsx src/engine/slots.ts
npm run build; npm run lint; echo $?; npx vitest run
npx vitest run src/scenario/validate.test.ts --reporter=verbose
```

- 상태 수·시간: 임시 테스트 파일(`src/scenario/zz_probe.test.ts`, 실행 직후 삭제)에서 `validateScenario(incident0214).exploration.states`와 경과 시간 측정.
- 뮤테이션: 작업 트리가 깨끗했지만 검증자는 커밋하지 않으므로 `git checkout`을 쓰지 않고 스크래치패드의 `mut.py`가 파일별로 `cp` 백업 → 문자열 치환(치환 대상이 정확히 1회 나오는지 assert) → `npx vitest run src/scenario/validate.test.ts` → 백업 복사로 원복 → `filecmp.cmp(shallow=False)` 바이트 비교. 모든 원복 결과 `True`, 마지막에 `git status --short` 출력 없음.
- 브라우저: `npm run build` 후 `npx vite preview --port 4174 --strictPort`(백그라운드), Playwright(`/opt/node22/lib/node_modules/playwright/index.mjs`, 설치된 Chromium) 스크립트를 저장소 밖 스크래치패드에서 실행. StrictMode 확인을 위해 `npx vite --port 4175`에서도 같은 경로 1회. 끝난 뒤 내가 띄운 서버 PID만 종료.
- 읽기 분량: 각 사건 함수의 주석 줄에서 `#`를 뺀 글자 수를 `@if`/`@else` 가지별 최소~최대로 합산(Python 스크립트).

## 4. 발견 사항

### 4.1 사양 적합성

| 항목 | 확인 | 결과 |
| --- | --- | --- |
| 스테이지 파일 5개 | `index.ts:29-33` 경로 `incidents/event_001.py` … `incidents/case_report.py` | SoT §5.4 표와 일치 |
| 초기 파일 | `index.ts:24-27` `main.py`, `config/settings.py` + 첫 스테이지 | SoT §5.4 "main.py, 설정 파일 1개, event_001.py" 일치. 새 게임 탭은 `App.tsx:18`에서 `main.py`·`event_001.py`, 활성 `main.py`(브라우저에서 확인) |
| 사건 함수 10~15개 | 3+3+2+3+1 = 12 | 충족 |
| **각 파일에 사건 함수 2~3개** (SoT §5.4) | `case_report.py:6`에 `draft_report` 하나뿐, `index.ts:33` `sceneIds: ['report']` | **불일치 — 차단 B1** |
| 일반 엔딩 2개 | `index.ts:173-182` resolved/sealed, 탐색에서 둘 다 도달 | 충족 |
| 입력 유형 4종 (SoT §3.1) | int(`action`), bool(`notify_security`·`keep_logs`), number(`hour` `index.ts:52`, `limit` `index.ts:115`), string(`target` `index.ts:73`, `room` `index.ts:136`) | 충족 |
| DB-01 | 지시문은 모두 사건 함수 안(`event_001.py:26,40` 등), 초기 파일에는 없음. 평가 시점은 P03 엔진 규칙(사건이 현재가 될 때 플래그) | 충족 |
| 공통 합류 상태 머신 | 모든 사건이 다음 사건 하나로 이어지고 마지막만 엔딩 분기 | 충족 |
| R-01 / R-05 | 게임 전용 UI 없음. 해금은 Explorer 파일 추가 + Terminal `[workspace] … 생성됨`. 공개 스크롤은 애니메이션·커서 이동 없음 | 충족 |
| R-08 | 시나리오는 순수 데이터(`scenarioData.test.ts`에 `incident0214` 추가), 파서 변경 없음 | 충족 |

이야기 일관성(단서·로그 대 플래그):

- 맞는 단서: 출발지 `10.0.2.14`(`index.ts:43`, `index.ts:75`, `security_audit.py:26`)는 `settings.py:10` 등록 대역(`10.0.1.0/24`, `10.0.3.0/24`) 밖 — 일관. `sync_b2`·02:14·3년 전 폐기·B2 동쪽 끝·B2-07 급증이 로그와 주석에서 서로 맞는다(`index.ts:54,106,117`, `sublevel_access.py:8,25,28`).
- **`handle_device`는 장치를 못 찾은 경우에도 장치를 전제로 한 선택지와 로그를 보인다.** `device_found`가 거짓이면 주석은 "방에는 먼지 쌓인 상자뿐이다"(`sublevel_access.py:45`)이고 앞 로그도 "입장. 조용하다."(`index.ts:139`)인데, 선택지는 `@end` 밖이라 항상 "1. 사진과 기록을 남기고 그대로 둔다 / 2. 전원을 뽑는다"(`sublevel_access.py:48-51`)이고, 2를 고르면 "전원을 뽑았다. 팬이 멈췄다."(`index.ts:149`), 1이면 "사진 12장, 일련번호 기록"(`index.ts:148`)이 나온다. 상태와 모순되는 로그이므로 **차단 B2**.
- `inspect_power` 주석 "B2는 도면상 창고와 폐기 장비 보관실뿐이다"(`power_control.py:12`)와 `enter_room` 선택지 `"B2-11" - 공조기계실`(`sublevel_access.py:34`)이 어긋난다(하드닝 H5).
- 장치 전원을 뽑고(`unplugged`) 사실과 다르게 보고하면 sealed 엔딩 "같은 경보가 다시 올라왔다"(`index.ts:180`)가 나온다. 차단기가 저절로 다시 올라간 연출(`index.ts:108`)과 이어지는 의도일 수 있어 결함으로 보지 않고 이야기 의견으로 H6에 둔다.
- `locked`(`index.ts:85`), `badge`(`index.ts:128`), `documented`(`index.ts:148`), `unplugged`(`index.ts:149`)는 설정만 되고 어디에서도 읽히지 않는다. 그래서 `review_access`·`request_access`·`handle_device` 선택은 그 자리 로그 말고는 영향이 없다. 계약 위반은 아니다(H6). 탐색 상태 수만 늘린다(4.3).
- B2-07은 단서와 상관없이 선택지 설명 "동쪽 끝, 폐기 장비 보관실"(`sublevel_access.py:33`)로 늘 짐작할 수 있다. 시나리오 문서도 "단서 없이 맞힐 수도 있다"고 적었으므로 모순은 아니다(이야기 의견, H6).

R-07(주석만 보고 진행할 수 있는가, 문구 기준 판단 — 사람 관찰은 아님):

- 무엇을 바꾸는지 필드 이름까지 말하는 사건: `triage_alert`("action 값을 바꾼 뒤 Ctrl+Enter", `event_001.py:10`), `check_schedule`(`event_001.py:33`, "0~23 사이의 시(時)" — 숫자 필드로 충분히 명확), `escalate`(`event_001.py:45`), `audit_logins`(`security_audit.py:13`), `preserve_logs`(`security_audit.py:43`), `set_limit`(`power_control.py:27`), `enter_room`(`sublevel_access.py:31`).
- 이름 없이 "…를 고른다" + 번호 목록만 있는 사건: `review_access`(`security_audit.py:32-34`), `inspect_power`(`power_control.py:14-17`), `request_access`(`sublevel_access.py:13-15`), `handle_device`(`sublevel_access.py:48-51`), `draft_report`(`case_report.py:18-20`). 첫 사건과 `main.py:8`의 예시(`action = 1`)로 유추는 가능하지만 명시는 아니다(H4).
- 문자열 값: 선택지는 따옴표를 붙여 보여주지만(`security_audit.py:14-16`, `sublevel_access.py:32-34`) "따옴표까지 그대로 쓴다"는 말은 없다. 따옴표 없이 입력하면 `SyntaxError: room 값에는 따옴표로 감싼 문자열 하나만 쓸 수 있습니다 (입력: B2-07)`가 나와 회복은 된다(브라우저 확인, H4).
- `hour`는 `number` 형이라 `2.5`도 받는다(`index.ts:52`). 이야기상 문제는 작다(H4).

### 4.2 시나리오 문서 대 데이터

`docs/scenario/incident-0214.md`의 파일표·전이표·주석 변형표·엔딩표를 `index.ts`와 템플릿에 한 줄씩 대조했다.

- 전이표 12행: 입력(필드·범위·옵션), 플래그, 다음 사건이 `index.ts:37-171`과 모두 일치. `power`의 2번(UPS 로그, 플래그 없음)은 표에 없지만 효과가 없으니 누락이 아니다.
- 주석 변형표 9행: `check_schedule`←`analyzed`, `escalate`←`cron_found`, `audit_logins`←`notified`, `review_access`←`backup_suspect`, `inspect_power`←`isolated`, `request_access`←`traced_b2`, `enter_room`←`spike_seen`·`traced_b2`, `handle_device`←`device_found`, `draft_report`←`device_found`·`logs_kept` — 템플릿 지시문과 일치. 작업 로그의 "주석 9곳"도 맞다.
- 엔딩표: resolved 조건(`action == 1` 이고 `device_found == true`, `index.ts:161-167`)과 마지막 로그(`index.ts:176,180`) 일치.
- 문서의 파일표는 `case_report.py`에 사건 1개를 그대로 적었다. B1이 고쳐지면 같이 바꿔야 한다.

### 4.3 검증기 `validate.ts`

P04 범위 목록 대비:

| P04 범위 검사 | 구현 | 그 검사를 지키는 테스트(뮤테이션으로 확인) |
| --- | --- | --- |
| 전이 대상 존재 | `validate.ts:121-122` | 없음(V4 생존). 탐색에서 실제로 타는 전이라면 `derive` 예외가 2차 방어(V4+D1 조합에서 `render failed` 로 실패) |
| 모든 사건 도달 | `validate.ts:153` | 없음(V11 생존) |
| 각 엔딩 도달 | `validate.ts:154` | `validate.test.ts:20` |
| 주석 선택지 번호 = 허용값 | `validate.ts:110-113` | `validate.test.ts:20` |
| 마지막 전이 빈 조건 | `validate.ts:118-119` | `validate.test.ts:20` |
| 필드 줄 정확히 하나 | `validate.ts:100-103` | `validate.test.ts:20` |
| `>=`/`<=`는 숫자에만 | `validate.ts:124` | 없음(V5 생존) |
| 탭 없음 | `validate.ts:83` | 없음(V1 생존) |
| 삼중 따옴표 없음 | `validate.ts:84` | 없음(V2 생존) |
| 중첩 `def` 없음 | `validate.ts:99` | `validate.test.ts:39` |
| 기본값 문자열에 `#`·`\` 없음 | `LITERAL`(`slots.ts:7`)이 제외 → `validate.ts:105` "no literal slot" + `validate.ts:107` | 없음(V12 생존, `:105` 단독 뮤테이션은 미실시) |
| 함수 순서 = `sceneIds` | `validate.ts:85-88` | 없음(V3 생존). **2차 방어도 없음**: V3를 지운 채 `event_001.py`의 함수 순서를 바꾸면 테스트 4개 모두 통과 |
| 모든 경로 렌더 오류 없음 | `validate.ts:50-55` | 단위 테스트 없음(본 시나리오 통과 테스트만) |
| 화면에 지시문 줄 없음 | `validate.ts:57` | `validate.test.ts:39` |
| 되돌아가는 루프 없음 | `validate.ts:133-145` | `validate.test.ts:20` |

본 시나리오 데이터를 깨뜨리면 `validate.test.ts:13`이 잡는다(D1~D5, D10~D12). 하지만 위 표의 "없음" 행은 **검사 코드를 지워도 아무 테스트도 실패하지 않는다**. P04 범위가 요구한 검사 중 탭, 삼중 따옴표, 함수 순서, 전이 대상 존재, `>=`/`<=` 숫자 제한, 사건 도달, 기본값 유효가 "검사가 실제로 무는지"를 고정한 테스트 없이 남아 있다 → **차단 B3**. 작업 로그 §24의 "검사가 실제로 잡는지 깨뜨린 시나리오로 테스트"는 일부 검사에만 해당한다.

거짓 음성(검사가 놓치는 경우, 모두 실제 뮤테이션으로 재현):

- 문자열 옵션 설명 검사(`validate.ts:115`)는 따옴표 붙은 옵션이 주석 **어디에든** 있으면 통과한다. `enter_room`의 선택지 줄 `"B2-07" - 동쪽 끝…`(`sublevel_access.py:33`)을 지워도 `@if traced_b2` 가지 안의 `"B2-07"`(`sublevel_access.py:28`) 때문에 통과(D6). 단서를 못 얻은 플레이어는 선택지 목록에서 B2-07을 볼 수 없게 된다.
- 정수 선택지 검사(`validate.ts:111`)는 렌더 결과가 아니라 템플릿 원문을 본다. `review_access`의 번호 목록을 `@if backup_suspect` 가지 안으로 옮기면 그 가지를 못 탄 플레이어는 선택지를 못 보는데도 통과(D8). P04 문구("템플릿 주석의 선택지 번호")를 문자 그대로는 만족하므로 하드닝(H1).
- 정수 검사 정규식 `^ *#\s+(\d+)\.\s`는 사건 함수 주석 안의 번호 붙은 이야기 줄도 선택지로 센다(거짓 양성 방향). 한 사건에 int 필드가 둘이면 같은 목록과 비교한다. 현재 데이터에는 해당 없음.
- 지시문의 플래그 이름 오타(`# @if analysed == True`, D7)와 절대 맞지 않는 전이 조건(`when('target', 'Backup')`, D9)은 잡지 못한다. 변형 주석·플래그가 조용히 죽는다. P04 범위 밖 검사이므로 하드닝(H2).
- 숫자 필드 후보값(`validate.ts:19-24`)은 `min`·`max`와 조건 경계값이다. 포함 비교(`==`,`>=`,`<=`)의 AND 조합이면 구간 끝점이 후보에 들어가므로 빠지는 가지가 없다. 빠지는 경우는 `!=`만으로 만든 가지(예: `limit != 0`·`!= 30`·`!= 100` 동시)뿐이다 — 인위적인 경우라 하드닝(H3). 후보를 `min`·`max`만으로 줄여도(V13) 테스트가 통과한다. `hour == 2` 가지(`cron_found`)를 아무도 타지 않게 되어도 엔딩·사건 도달에는 영향이 없기 때문이다(H2와 같은 공백).
- 숫자 필드의 범위가 주석에 적혀 있는지(`0~23`, `0~100`)는 검사하지 않는다(H1, 범위 밖).

성능: 상태 7,678개, `validateScenario(incident0214)` 약 5.4초(측정). 그래프가 앞으로만 가고 플래그 수가 유한하므로 유계다. 상한은 대략 Σ(사건별 2^(그 앞에서 설정될 수 있는 플래그 수))이고, 상태마다 `derive`가 처음부터 재생하므로(`validate.ts:51`) 경로 길이만큼 곱해진다. `queue.shift()`(`validate.ts:48`)는 O(n)이지만 이 규모에서는 무시할 만하다. 읽히지 않는 플래그 4개(`locked`·`badge`·`documented`·`unplugged`)도 상태 키(`validate.ts:63`)에 들어가 상태를 불필요하게 늘린다. 이후 플래그를 하나 더할 때마다 대략 배가 되므로 60초 제한(`validate.test.ts:18`)이 금방 빠듯해질 수 있다(H3).

### 4.4 Editor 변경

- 자동 짝 입력·제안 끄기: `CodeEditor.tsx:43-51`. Monaco 0.57 타입에 맞고(`tsc -b` 통과) 브라우저에서 따옴표를 직접 쳐도 짝 따옴표가 생기지 않는다. 지연 0·10·30ms로 `"abc-07"`을 입력하면 슬롯이 정확히 `"abc-07"`, `'admin'`(작은따옴표)도 정상. 정수 슬롯에 `B2-07`을 넣으면 그대로 들어가고 실행 시 타입 오류가 나며, 지운 뒤 다시 입력할 수 있다. 끈 옵션 때문에 깨진 편집은 찾지 못했다.
- 공개 스크롤 `revealRef`(`CodeEditor.tsx:25-27, 88-91, 141, 154-156`):
  - 엔진이 활성 파일을 다시 쓴 경우: 루프에서 표시(`:90`) → 같은 렌더에서 공개(`:154`). 브라우저에서 `escalate` 추가 후 `lines-content` top이 `-353px`로 이동, 값 슬롯이 편집기 영역 안.
  - 처음 연 파일: 모델 생성 시 표시(`:141`).
  - 배경 파일이 다시 쓰인 뒤 전환: 루프가 표시하고, 전환 시 `restoreViewState`(`:148`) 다음에 공개(`:154`)하므로 공개가 이긴다. 정상 플레이에서는 실행이 활성 파일에서만 되므로 배경 파일이 다시 쓰일 일이 사실상 없다(코드 읽기로만 확인).
  - 플레이어 자신의 수락된 편집: 모델 텍스트가 뷰와 같아 다시 쓰지 않으므로 표시되지 않는다. 세 경로 36회 편집 동안 스크롤 위치 변화 없음(측정).
  - 슬롯 없는 파일(지난 스테이지, `main.py`): 표시만 지우고 스크롤하지 않는다.
  - StrictMode: 개발 서버(`main.tsx`의 `StrictMode`)에서 resolved 경로를 완주했고 모든 사건에서 슬롯이 보였다. 정리 함수(`:64`)가 `reveal.clear()`를 하고 모델을 다시 만들 때 다시 표시하므로 일관.
  - 1280×720(편집기 높이 483px)과 1440×900에서 12개 사건 모두 실행 후 새 함수의 `def` 줄까지 보였다(기본값 경로).

### 4.5 실제 브라우저

| 경로 | 입력(12회) | 결과 |
| --- | --- | --- |
| resolved | 1, 2, True, `"backup"`, 1, True, 1, 20, 1, `"B2-07"`, 1, 1 | "사건 INC-0214 종결 (원인 규명)" |
| sealed | 3, 5, False, `"guest"`, 2, False, 3, 80, 2, `"B2-11"`, 3, 2 | "사건 INC-0214 종결 (원인 미상)" |
| 혼합 | 2, 2, False, `'admin'`, 1, True, 2, 30, 1, `"B2-07"`, 2, 2 | sealed (B2-07에서 장치를 찾았지만 거짓 보고) |

- 문자열은 따옴표까지 키보드로 직접 입력(`keyboard.type`, 지연 30ms). 각 사건의 로그가 전이표와 일치.
- 시작 시 탭 `main.py`·`event_001.py`, 활성 `main.py`. `main.py`에서 `Ctrl+Enter` → `실행할 파일: incidents/event_001.py (현재 탭: main.py)`.
- 새로고침: resolved 경로 `review_access` 직전과 혼합 경로 `enter_room`에서 `"B2-07"`을 입력한 채(실행 전) 새로고침 → 탭 목록·활성 탭·편집 값·Terminal 로그 복원.
- 엔딩 후 실행 → `처리할 사건이 없습니다.`
- 콘솔 error/warning 0건, `pageerror` 0건, `localhost:4174`(개발 서버 확인 때는 4175) 밖으로 나간 요청 0건.
- 읽기 분량(추정, AC-10 대용): `main.py` 211자 + `settings.py` 39자 + 사건 주석 12개 합 1,177~1,436자(사건당 68~160자) = 1,427~1,686자. Terminal 로그는 실행당 1~4줄. 사람의 플레이 시간은 이 방법으로 잴 수 없다. 분량만 보면 첫 플레이가 10분에 못 미칠 가능성이 있어 Owner 측정이 중요하다.

### 4.6 빌드·린트·테스트

- `npm run build`: 성공(`tsc -b && vite build`, 4.87s). 기존과 같은 500kB 청크 경고만.
- `npm run lint`: 출력 없음, 종료 코드 0.
- `npx vitest run`: 테스트 파일 12개, 테스트 97개 모두 통과. `validate.test.ts:13`(본 시나리오 전체 탐색)이 5,374ms로 가장 오래 걸린다.

### 4.7 기록

- HANDOFF: 34줄(머리 표기와 일치), 현재 상태와 다음 작업만 있고 완료 서술 없음. P04 "진행 중 — 독립 검증 대기". AC-10·R-07은 "사람이 해야 하므로 Owner 몫"으로 남김(`HANDOFF.md:33`) — 달성으로 주장하지 않음.
- P04 문서·인덱스: In Progress. 일치.
- 작업 로그 §24: 숫자(테스트 97개, 사건 12개, 주석 9곳)는 재현됨. "검사가 실제로 잡는지 깨뜨린 시나리오로 테스트"는 일부 검사에만 해당(B3). 자동 브라우저 완주 서술은 재현됨.
- 아키텍처 §5의 스크롤 규칙 변경은 이유와 함께 기록됐다. 하지만 `docs/phases/P03_story_engine_and_save.md:25`는 여전히 "커서·스크롤 이동 없음"을 결정으로 적고 있고, 바뀌었다는 표시가 없다(H7).

## 5. 문제 / 위험

### 차단 (계약 의무)

- **B1 — SoT §5.4 "각 파일에 사건 함수 2~3개" 위반.** `case_report.py:6`에 `draft_report` 하나뿐(`index.ts:33`). 사건을 하나 더하거나(총 13개, 10~15 범위 안), 이 예외를 Owner와 합의해 SoT/P04에 적어야 한다. 시나리오 문서 파일표도 함께 맞출 것.
- **B2 — 장치를 못 찾은 상태와 모순되는 선택지·로그.** `device_found`가 거짓일 때 `handle_device`의 선택지(`sublevel_access.py:48-51`)와 로그 "전원을 뽑았다. 팬이 멈췄다."(`index.ts:149`)·"사진 12장, 일련번호 기록"(`index.ts:148`)이 그대로 나온다. 주석 "먼지 쌓인 상자뿐이다"(`sublevel_access.py:45`)와 앞 로그 "조용하다"(`index.ts:139`)와 모순된다. P04 목표인 일관된 시나리오에 대한 내용 결함이다. 선택지 목록을 `@if` 가지별로 나누고, 전이에 `device_found` 조건을 둔 로그를 추가하면 된다.
- **B3 — P04 범위가 요구한 검증기 검사 7종을 지키는 테스트가 없다.** 탭(`validate.ts:83`), 삼중 따옴표(`:84`), 함수 순서(`:88`), 전이 대상 존재(`:121`), `>=`/`<=` 숫자 제한(`:124`), 사건 도달(`:153`), 기본값 유효(`:107`) — 각 줄을 지워도 `npm test`가 통과한다(V1~V5, V11, V12). 함수 순서는 2차 방어도 없어서 V3 상태에서 템플릿 순서를 바꾸면 그대로 통과한다. `validate.test.ts`에 검사별 "깨뜨린 시나리오 → 해당 문구" 단언을 추가해야 한다.

### 하드닝 권고 (비차단)

- **H1** 주석 선택지 검사를 렌더 결과 기준으로: 각 상태에서 현재 사건의 화면 주석에 int 번호·따옴표 붙은 문자열 옵션이 모두 나오는지 확인하면 D6·D8을 잡는다(`validate.ts:108-117`). 숫자 필드의 `min~max` 표기, 불리언 필드의 `True` 언급도 같은 방식으로 볼 수 있다.
- **H2** 죽은 콘텐츠 검출: 한 번도 맞지 않는 전이, 설정은 되지만 읽히지 않는 플래그, 어떤 경로에서도 설정되지 않는 플래그를 참조하는 지시문(D7·D9·V13).
- **H3** 탐색: 상태 키에서 이후에 읽히지 않는 플래그를 빼면 상태 수가 줄어든다(`validate.ts:63`). 숫자 후보에 경계값 ±1 또는 구간 중간값을 더하면 `!=`만으로 된 가지도 탐색된다(`validate.ts:20-23`).
- **H4** (이야기·문구 의견) R-07 문구: `action`을 이름으로 말하지 않는 5개 사건(`security_audit.py:32`, `power_control.py:14`, `sublevel_access.py:13`, `sublevel_access.py:48`, `case_report.py:18`)에 "action 값을 바꾼다"를 넣고, 문자열 사건(`security_audit.py:13`, `sublevel_access.py:31`)에 "따옴표까지 그대로 쓴다"를 넣으면 비개발자에게 더 분명하다. `hour`를 `int` 0~23 옵션으로 둘지 검토(`index.ts:52`).
- **H5** (이야기) `power_control.py:12` "B2는 창고와 폐기 장비 보관실뿐"과 `sublevel_access.py:34` "공조기계실"이 어긋난다.
- **H6** (이야기 의견) 읽히지 않는 플래그 4개 때문에 `review_access`·`request_access`·`handle_device` 선택에 뒤 영향이 없다. 전원을 뽑은 뒤 sealed 엔딩에서 "같은 경보가 다시"가 나오는 것이 의도인지 확인. B2-07은 선택지 설명만으로도 짐작된다(`sublevel_access.py:33`).
- **H7** (기록) `docs/phases/P03_story_engine_and_save.md:25`의 "커서·스크롤 이동 없음"에 P04에서 바뀌었다는 표시(아키텍처 §5 링크)를 붙일 것.

## 6. 뮤테이션 요약

| ID | 변경 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| V1 | 탭 검사 삭제 | `validate.ts:83` | 없음 (생존) |
| V2 | 삼중 따옴표 검사 삭제 | `validate.ts:84` | 없음 (생존) |
| V3 | 함수 순서 검사 삭제 | `validate.ts:88` | 없음 (생존). V3 + 템플릿 순서 교환도 생존 |
| V4 | 전이 대상 검사 삭제 | `validate.ts:121` | 없음 (생존). V4 + D1이면 `validate.test.ts:13` 실패(`derive` 예외로 2차 방어) |
| V5 | `>=`/`<=` 비숫자 검사 삭제 | `validate.ts:124` | 없음 (생존) |
| V6 | 문자열 옵션 검사 삭제 | `validate.ts:115` | 없음 (생존) |
| V7 | int 선택지 검사 무력화 | `validate.ts:112` | `validate.test.ts:20` |
| V8 | 마지막 전이 검사 무력화 | `validate.ts:119` | `validate.test.ts:20` |
| V9 | 루프 검사 삭제 | `validate.ts:145` | `validate.test.ts:20` |
| V10 | 화면 지시문 검사 무력화 | `validate.ts:57` | `validate.test.ts:39` |
| V11 | 사건 도달 검사 삭제 | `validate.ts:153` | 없음 (생존) |
| V12 | 기본값 유효 검사 무력화 | `validate.ts:107` | 없음 (생존) |
| V13 | 숫자 후보를 `min`·`max`만으로 | `validate.ts:23` | 없음 (생존) |
| V14 | 함수 누락 검사 무력화 | `validate.ts:87` | 없음 (생존) |
| V15 | 필드 줄 개수 검사 무력화 | `validate.ts:102` | `validate.test.ts:20` |
| D1 | `schedule` 전이 대상 오타 `escalat` | `index.ts:54` | `validate.test.ts:13` |
| D2 | `s1.sceneIds` 순서 교환 | `index.ts:29` | `validate.test.ts:13` |
| D3 | 주석에 탭 | `power_control.py:12` | `validate.test.ts:13` |
| D4 | `review_access` 주석에 `3.` 추가 | `security_audit.py:34` | `validate.test.ts:13` |
| D5 | `escalate` 기본 전이 삭제 | `index.ts:65` | `validate.test.ts:13` |
| D6 | `"B2-07"` 선택지 줄 삭제 | `sublevel_access.py:33` | 없음 (생존 — 거짓 음성) |
| D7 | 지시문 플래그 오타 `analysed` | `event_001.py:26` | 없음 (생존 — H2) |
| D8 | 선택지 목록을 `@if` 가지 안으로 이동 | `security_audit.py:28-34` | 없음 (생존 — H1) |
| D9 | 죽은 전이 `'Backup'` | `index.ts:75` | 없음 (생존 — H2) |
| D10 | 템플릿 함수 순서 교환 | `event_001.py:25-49` | `validate.test.ts:13` |
| D11 | 없는 엔딩 `seald` | `index.ts:169` | `validate.test.ts:13` |
| D12 | `<=`에 문자열 값 | `index.ts:117` | `validate.test.ts:13` |

D8의 첫 시도는 치환 문자열 실수로 `@else`가 두 번 들어가 렌더 오류로 실패했다. 고친 뒤 다시 돌려 생존을 확인했다. 모든 원복은 `filecmp` 바이트 비교 `True`, 최종 `git status --short` 출력 없음.

## 7. 판정

**조건부 합격** — B1(SoT §5.4 `case_report.py` 사건 함수 2~3개), B2(`handle_device` 상태 모순 로그·선택지), B3(P04 범위 검증기 검사 7종의 무는 테스트) 해소 필요

- 데이터 대 문서는 정확히 일치하고, 두 엔딩과 혼합 경로를 실제 브라우저에서 따옴표 직접 입력으로 완주했다. 콘솔 오류와 외부 요청은 없고, 새로고침 복원과 공개 스크롤도 정상이다.
- 본 시나리오 데이터의 실수는 `validate.test.ts:13`이 넓게 잡지만, 검증기 검사 자체는 절반 가까이가 고정되지 않았다(B3).
- 사람만 할 수 있는 완료 기준(AC-10 플레이 시간, R-07 비개발자 관찰)은 기록에서 미완으로 남겨 두었다. 이 검증으로 대신할 수 없다.

## 8. 남은 일 (결함 아님)

- 위 B1~B3 반영 후 재검증.
- Owner 플레이 테스트: AC-10(첫 플레이 10~20분, 주석 분량 추정으로는 10분 미만 가능성), R-07(비개발자 관찰).
- 검증자는 커밋하지 않았다. 이 기록 파일만 새로 생겼다.

## 9. 재현

```bash
cd /home/user/Hidden-Main-
npm run build && npm run lint && npx vitest run
npx vitest run src/scenario/validate.test.ts --reporter=verbose
# 뮤테이션: 대상 줄을 지우거나 바꾼 뒤 위 명령, cp 백업으로 원복 후 cmp
npx vite preview --port 4174 --strictPort &   # 끝나면 이 PID만 종료
# Playwright 스크립트(저장소 밖): localStorage 초기화 → event_001.py 탭 → 값 슬롯 클릭·End·Backspace·직접 입력 → Ctrl+Enter
# 12회 반복, 새 스테이지 파일은 Explorer 클릭으로 열기, 각 단계 값 슬롯이 편집기 영역 안인지와 Terminal 로그 확인
```
