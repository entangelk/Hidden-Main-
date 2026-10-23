# 독립 재검증 — P02 핵심 루프 프로토타입

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P02 재검증") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `464f2ac` "Address P02 verification: …". 범위 `git diff c2192cb..464f2ac` — `src/engine/{parser,slots}.ts`(+test), `src/ui/editor/{CodeEditor.tsx,acceptChange.test.ts}`, `src/app/{App.tsx,prototype.ts}`, 아키텍처 §6·§6.1·§6.2(v0.4), P02·P04 문서, HANDOFF, 작업 로그 §18~19·결정 |
| 정본 기준 | `docs/phases/P02_core_loop_prototype.md`(범위·완료 기준), `docs/architecture/00_overview.md` v0.4 §3·§6·§6.1·§6.2, `docs/architecture/01_data_contracts.md`, 이전 기록 `docs/verifications/2026-10-22/p02_core_loop.md`(조건부 합격, B1·B2, H1~H8) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `464f2ac`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. 이전 지적 B1·B2·H1~H8의 상태(파일:줄 근거, 생존 변이 재적용)
2. 변경으로 인한 회귀: `readLiteral` 이스케이프·앞자리 0, `formatLiteral` 왕복, `shiftSlots`·새 `applyEdits` 루프, 빈 슬롯 injected text, `run`의 ref 기반 재계산
3. 실제 브라우저(Playwright + Chromium): P02 데모·완료 기준 전체, 빈 슬롯, 같은 태스크 이중 실행
4. `npm run build` / `npm run lint` / `npm test`
5. 기록: 작업 로그 §18~19·결정, HANDOFF, 아키텍처 v0.4 문장과 코드 일치

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git diff c2192cb..464f2ac
set -o pipefail
npm run build   # 종료 0 (Monaco 500kB 청크 경고만, HANDOFF:23의 기존 사항)
npm run lint    # 종료 0
npm test        # Test Files 6 passed (6), Tests 47 passed (47)
# 엔진 탐침: engine 파일을 scratch로 복사(import 경로만 .ts), 같은 입력을 Python ast.literal_eval과 비교
node --experimental-strip-types <scratch>/eng/probe.ts
python3 -I -c "import ast; ..."
# 뮤테이션 16건: cp 백업 → 변형 → 해당 vitest 파일 → 백업 복사로 복원 → filecmp
python3 -I <scratch>/mutate.py
# 브라우저
npx vite preview --port 4174 --strictPort &   # npm 6764, sh 6777, vite 6778 — 끝난 뒤 이 셋만 PID로 kill
node <scratch>/pw/main.mjs         # 데모·완료 기준 전체(A~I, L, F)
node <scratch>/pw/empty_race.mjs   # 빈 슬롯 표시·입력·실행, 같은 태스크 이중 Ctrl+Enter(창/편집기), 실제 키 이중 입력
git status --short                 # 이 기록 파일 외 출력 없음
```

`<scratch>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/p02r`. Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs`(사전 설치 Chromium, `playwright install` 실행 안 함).

## 4. 결과

### 4.1 이전 지적 상태

| ID | 상태 | 근거 |
| --- | --- | --- |
| B1 주석 줄 제외 미고정 | **해소** | 템플릿에 `        # action = 3`·0열 주석 추가(`slots.test.ts:11-12`), 새 테스트 `slots.test.ts:63-67`. M16(`^ *`→`^.*`, `slots.ts:47`) 재적용 시 2개 실패(새 테스트 + "finds each field literal …") |
| B2 §6.2 오프셋 직접 계산 | **해소** | 이동 규칙은 `shiftSlots`(`slots.ts:57-61`) 하나, `applyEdits`(`slots.ts:75`)와 `CodeEditor.tsx:118`이 함께 사용. §6.2(`00_overview.md:124`) 문장이 이 구조와 일치 |
| H1 재렌더 전 이중 실행 | **해소(브라우저)** | `App.tsx:20,60-61,100-101`이 `choicesRef`로 상태를 재계산. 같은 태스크에서 keydown 2개(창·편집기 textarea 둘 다): 첫 실행만 해결, 둘째는 `실행할 파일: event_002.py (현재 탭: main.py)`, 18행 `action = 2` 유지. `event_002.py`에서 같은 시험 → 둘째는 `처리할 사건이 없습니다.` 단위 테스트는 없음(App 수준, H-N3) |
| H2 `=` 뒤 리터럴 탐색 | **해소** | `slots.test.ts:69-74`. M20 재적용 시 그 테스트 실패 |
| H3 단독 `\r` | **해소** | `acceptChange.test.ts:31`. M4 재적용 시 under-strict 테스트 실패 |
| H4 앞자리 0·이스케이프 | **해소(계약 명시)** | `parser.ts:84,102`, `00_overview.md:104`, 테스트 `parser.test.ts:68-77`. Python과 다른 점은 H-N2 |
| H5 0열 주석·중첩 def | **해소** | `slots.ts:23-24`, 테스트 `slots.test.ts:40-44`(0열 주석 규칙 제거 변이 시 8개 실패). 중첩 `def`는 `00_overview.md:118-119`·P04 시나리오 검증 항목으로 이관 |
| H6 계약 이름 | **해소** | `parse`(`parser.ts:131`), `editableFields`(`prototype.ts:177`). 남은 흔적: `parser.test.ts:7`의 `describe('parseChoice')`(H-N4) |
| H7 IME·빈 값 표시 | **해소** | 빈 값 → `after` injected text(`CodeEditor.tsx:140-145`). IME 실행 취소 단위는 수용으로 `00_overview.md:128`에 기록 |
| H8 기록 | **해소** | HANDOFF 다음 작업(`HANDOFF.md:28-29`)과 작업 로그 다음 단계 일치, 아키텍처 v0.4, §18에 §6.2 변경 언급, P02 결정 3건(`work_log.md:223`) |

### 4.2 회귀 검토

- `readLiteral`(`parser.ts:88-112`). 탐침 결과: `"\n"`→줄바꿈, `"a\qb"`→`a\qb`, `'\''`→`'`, `"a\"b"`→`a"b`, `"a\\"`→`a\`, `"\"`(끝 백슬래시)→`null`, `""`→빈 문자열, `01`·`-01`→`null`, `-0`→0. Python과 다른 입력: `00`·`000`(Python은 0), `1_0`(Python은 10), `"\r"`·`"\x41"`·`"\0"`(Python은 해석, 여기선 백슬래시 유지). 마지막 셋은 §6 "그 밖의 `\x`는 그대로"와 일치하고, `00`은 §6 문장 자체와는 일치하지만 "Python처럼" 표현이 부정확(H-N2). P02 필드는 int 하나라 `00`은 Python에선 `ValueError`, 여기선 `SyntaxError` 문구가 나오는 차이뿐.
- `formatLiteral`(`parser.ts:149-153`): 줄바꿈·탭·따옴표·백슬래시 값 모두 왕복. 다만 줄바꿈·탭 이스케이프를 지워도(R15·R16) 왕복 테스트(`parser.test.ts:89`)가 통과한다. 이스케이프 없이도 `readLiteral`이 원시 줄바꿈을 그대로 읽기 때문이다. 이스케이프가 빠지면 해결된 문자열 값이 파일에 줄바꿈으로 들어가 줄 구조를 깬다(H-N1). P02는 int 필드뿐이라 도달 불가.
- `shiftSlots`·`applyEdits`(`slots.ts:57-78`): `valueSlots.forEach`는 호출 시점의 원래 배열을 돌고, 본문의 `valueSlots[index]`는 재할당된 최신 배열을 읽는다. 길이가 같고 앞 편집의 이동이 반영된 위치를 읽으므로 올바르다. 탐침: 세 슬롯을 `1000`·빈 값·`"x"`로 동시에 편집 → 텍스트와 세 슬롯 구간이 정확. 단 `const slot = view.valueSlots[index]`(이동 전 위치)로 바꾼 변이 R9가 생존: 두 슬롯을 함께 편집하는 테스트가 없다(H-N1). 복잡도 O(슬롯²+슬롯×텍스트), 고정 규모.
- 빈 슬롯 injected text(`CodeEditor.tsx:140-145`): 브라우저에서 `.value-slot` 1개, 폭 8.4px, `underline dotted` 표시. 모델 텍스트는 `        action = `(뒤의 빈칸은 화면 전용)이고, End 후 입력·표시 클릭 후 입력·붙여넣기 모두 `action = 3`/`2`로 수락, 표시 왼쪽 공백 위치 입력은 거부. 실행 취소 연쇄도 정상. 오프셋·`acceptChange`에 영향 없음.
- `run`(`App.tsx:58-107`): `choices`·`state`·`edits`·`view`를 모두 ref 기반으로 계산. 렌더 클로저에서 읽는 것은 `activeFile`(`:67`)뿐인데, 탭 전환은 클릭·재렌더를 거치므로 실행과 같은 태스크에서 바뀌지 않는다. 렌더의 `views`·`state`를 읽는 곳 없음.

### 4.3 브라우저 동작

| 확인 | 관찰 |
| --- | --- |
| A 초기 | `.monaco-editor` 1개, Explorer `["main.py"]`, 슬롯 `1` |
| B 슬롯 밖 입력 | 1행 `x` 되돌려짐·커서 같음, 18행 1열 `abc` 되돌려짐 |
| C·D·E 경계·실행 취소 | 끝 `13`·시작 `913` 수락, 앞 공백 위치 거부·커서 복원, 실행 취소 1회 `13`, 2회 `1`, 다시 실행 2회 `913`, 10회 실행 취소 후 다른 줄 원본과 같음 |
| L | 전체 선택 삭제 무변화, 여러 줄 붙여넣기·슬롯 밖 붙여넣기 거부, Enter 거부(28줄 유지) |
| F 잘못된 값 9종 | 각각 `Traceback`·`line 18`·`ValueError`/`SyntaxError`/`TypeError` 한 줄, Explorer·18행 불변. 빈 값 → `SyntaxError: … (입력: 없음)`, 표시 1개 유지 |
| G 탭 없음·비현재 탭 | `실행할 파일: main.py` / `실행할 파일: event_002.py (현재 탭: main.py)` 한 줄, 상태 불변. 다시 열면 편집 값 유지 |
| H 유효 값 `2` | 결과 로그 + `[workspace] event_002.py 생성됨`, Explorer 추가, 활성 탭 `main.py` 유지, 18행 고정, 편집 거부 |
| I `event_002.py` | 열기, `3` → ValueError, `2` → 결과 로그, 이후 두 탭 모두 `처리할 사건이 없습니다.` |
| 빈 슬롯 | 위 4.2 참조. 빈 값 실행은 SyntaxError 출력만, Explorer 불변 |
| 이중 실행 | 같은 태스크 keydown 2개(창·textarea), 실제 키 동시 2회 모두 한 번만 해결 |
| 콘솔·외부 요청 | 모든 실행에서 오류·경고 0, 외부 요청 0, `.monaco-editor` 1개 |

문자열·이스케이프 값은 P02 필드가 int라 브라우저에서 다루지 않음(요청 범위대로 생략).

### 4.4 테스트와 뮤테이션

`npm test`: 6파일 47개 통과(이전 42개). 모든 변형 후 `filecmp` 바이트 동일, 마지막 `git status --short`는 이 기록 파일만.

| ID | 변형 | 위치 | 결과 |
| --- | --- | --- | --- |
| R1(=M16) | `^ *` → `^.*` | `slots.ts:47` | 2개 실패(`slots.test.ts:63` 포함) |
| R2(=M20) | 리터럴을 줄 처음부터 찾음 | `slots.ts:50` | 1개 실패(`slots.test.ts:69`) |
| R3(=M4) | `/[\r\n]/` → `/[\n]/` | `acceptChange.ts:11` | 1개 실패(under-strict) |
| R4 | 0열 주석이 블록을 끝냄 | `slots.ts:24` | 8개 실패(`slots.test.ts:40` 포함) |
| R5 | 빈 줄이 블록을 끝냄 | `slots.ts:24` | 8개 실패 |
| R6 | 편집 슬롯 `end` 고정 | `slots.ts:59` | 3개 실패(shiftSlots·applyEdits) |
| R7 | 뒤 슬롯 이동 부호 반대 | `slots.ts:59` | 3개 실패 |
| R8 | 앞 슬롯도 이동 | `slots.ts:59` | 1개 실패(shiftSlots) |
| R9 | `applyEdits`가 이동 전 슬롯 위치 사용 | `slots.ts:71` | **생존** (H-N1) |
| R10 | INT 앞자리 0 허용 | `parser.ts:84` | 1개 실패 |
| R11 | `\n` 해석 안 함 | `parser.ts:102` | 2개 실패 |
| R12 | `\t` 해석 안 함 | `parser.ts:102` | 2개 실패 |
| R13 | 모르는 이스케이프에서 백슬래시 버림 | `parser.ts:102` | 1개 실패 |
| R14 | 따옴표 이스케이프에서 백슬래시 유지 | `parser.ts:102` | 3개 실패 |
| R15 | `formatLiteral` 줄바꿈 이스케이프 삭제 | `parser.ts:152` | **생존** (H-N1) |
| R16 | `formatLiteral` 탭 이스케이프 삭제 | `parser.ts:152` | **생존** (H-N1) |

이전 생존 변이 M4·M16·M20과 0열 주석 규칙은 모두 이제 검출된다.

### 4.5 기록

- 작업 로그 §19(`work_log.md:178-191`): "변이 26건 중 22건 검출"은 이전 기록(생존 M4·M16·M20·M22)과 일치. 테스트 47개, B1~H8 처리 서술이 코드와 일치.
- §18 추가 문장(`work_log.md:175`, "문서 버전 표기는 19번에서 v0.4로")은 사실과 일치.
- 결정(`work_log.md:222`): Owner 말은 "지금처럼 작업해줘"뿐인데, 뒤의 절차("구현 → 커밋·푸시 → … 합격까지 반복, 확인 질문으로 멈추지 않음")가 Owner 지시 본문으로 적혀 있다. 바로 위 항목은 "작업자 해석"을 따로 구분했는데 여기서는 구분하지 않았다. 또 "푸시"는 `CLAUDE.md` §6("Never push")과 다르므로, Owner가 푸시를 명시했는지 아니면 해석인지 기록에서 드러나야 한다(H-N5).
- P02 결정 3건(`work_log.md:223`)은 P02 문서(`P02_core_loop_prototype.md:19,24`)·§6.2와 일치, "작업자 위임 범위"로 표시되어 과장 없음.
- HANDOFF(`HANDOFF.md:9`)는 "진행 중 — 독립 검증 대기", 완료 서술 없음. 코드 구성 설명(`:11-14`)이 현재 코드와 일치.
- 아키텍처 v0.4: §6(`:104`)·§6.1(`:112,118-119`)·§6.2(`:124,128-130`) 문장이 각각 `parser.ts:84,102`, `slots.ts:23-24`, `slots.ts:57-61`·`CodeEditor.tsx:118,140-145`·`App.tsx:60-61,100-101`과 일치. "재렌더 전에 두 번 실행돼도 같은 사건을 두 번 해결하지 않는다"는 브라우저로 확인.

## 5. 문제 / 위험

### Blocking (계약 의무)

없음. 이전 B1·B2는 위 4.1·4.4의 변이 재적용으로 해소를 확인했다.

### Hardening (비차단)

- **H-N1. 엔진 테스트 빈칸 두 개.** (a) `applyEdits`에 두 슬롯 이상을 함께 편집하는 테스트가 없어 이동 전 위치를 쓰는 변이(R9, `slots.ts:71`)가 생존. 현재 코드는 탐침으로 올바름을 확인했고 P02는 파일당 슬롯이 하나라 도달 불가지만, P03(DB-03, 한 파일에 해결된 함수 여럿)에서는 기본 경로가 되므로 P03 착수 시 `slots.test.ts`에 다중 편집 케이스를 넣을 것. (b) `formatLiteral` 줄바꿈·탭 이스케이프(`parser.ts:152`)가 왕복 테스트로는 고정되지 않음(R15·R16). `formatLiteral('a\nb')`가 줄바꿈 문자를 포함하지 않는다는 단언 추가.
- **H-N2.** `00_overview.md:104`의 "Python처럼 `0` 외에는 0으로 시작 불가"는 Python과 다름(Python은 `00`·`000`을 0으로 허용, `1_0`도 허용). 문장을 "Python과 달리 `00`도 거부" 식으로 고치거나 코드를 맞출 것. 이스케이프는 "그 밖의 `\x`는 그대로"로 명시되어 있어 계약과 코드는 일치하나, 작업 로그 §19 H4(`work_log.md:185`)의 "Python과 같게 … 모르는 이스케이프"는 `\r`·`\0`·`\x41`도 백슬래시를 유지한다는 점을 가린다.
- **H-N3.** H1 수정(`App.tsx:60-61,100-101`)은 브라우저로만 확인되고 자동 테스트가 없다. P03에서 실행 흐름을 엔진/리듀서로 옮길 때 "같은 진행 상태에서 두 번 실행 → 두 번째는 해결 안 됨" 단위 테스트로 고정할 것.
- **H-N4.** `parser.test.ts:7`의 `describe('parseChoice')`가 이름 변경 뒤에 남아 있음.
- **H-N5.** 작업 로그 결정(`work_log.md:222`): Owner 원문과 작업자 해석을 나누고, 푸시가 Owner 명시 지시인지 밝힐 것(`CLAUDE.md` §6과의 관계).

## 6. 판정

**합격** — 차단 지적 없음. B1·B2와 H1~H8이 모두 해소되었고, 남은 것은 P02 범위에서 도달 불가한 테스트 빈칸과 기록 문구다.

- 이전 생존 변이 M4·M16·M20과 0열 주석 규칙 제거가 이제 모두 테스트 실패로 이어진다.
- 같은 태스크 이중 실행 결함(H1)이 실제 브라우저에서 더는 재현되지 않는다.
- 데모와 완료 기준 전 항목, 빈 슬롯 표시·입력·실행이 실제 브라우저에서 정상이고 콘솔 오류·외부 요청이 없다.
- build·lint 종료 0, 테스트 47개 통과.

## 7. 남은 일

- 작업 트리: 이 기록 파일 외 변경 없음. 커밋하지 않음.
- P02를 Complete로 표시할 수 있다(P02 문서 상태, `00_index.md:9`, HANDOFF 갱신은 구현 작업자 몫).
- H-N1(a)·H-N3은 P03 착수 시 처리 권장.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
npm run build && npm run lint && npm test
python3 -I <scratch>/mutate.py                 # R1~R16, 각 변형 후 백업 복원·filecmp
npx vite preview --port 4174 --strictPort &    # 끝나면 PID로 종료
node <scratch>/pw/main.mjs; node <scratch>/pw/empty_race.mjs
git status --short
```
