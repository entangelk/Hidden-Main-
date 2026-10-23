# 독립 검증 — P02 핵심 루프 프로토타입

## 1. 대상 정보

| 항목 | 값 |
| --- | --- |
| 날짜 | 2026-10-22 |
| 요청자 | Owner (상위 에이전트 경유, "P02 독립 검증") |
| 검증자 | Claude (독립 검증 서브에이전트, 대상 코드를 작성하지 않음) |
| 대상 | 커밋 `c2192cb` "P02: core loop prototype with parser, value slots, edit restriction and run flow". 범위 `git diff d22d3d1..c2192cb` — `src/engine/{types,parser,slots}.ts`(+test), `src/ui/editor/{acceptChange.ts,CodeEditor.tsx}`(+test), `src/app/{prototype.ts,terminalMessages.ts,App.tsx,App.css}`, `src/app/prototype/*.py`, 문서(아키텍처 §6.2, P02/P03/인덱스, HANDOFF, 작업 로그 §18) |
| 정본 기준 | `docs/phases/P02_core_loop_prototype.md`(범위·완료 기준), `docs/SOT.md` v0.5 §3·§3.2~3.5·AC-02/04/05/07·R-01/05/07/08, `docs/architecture/00_overview.md` v0.3 §1·§3·§6·§6.1·§6.2, `docs/architecture/01_data_contracts.md` v0.4 §2·§4·§6·§7·§10, `docs/decision_briefs/02_editing_model.md`(Resolved, B) |
| 작업 출처 | 브랜치 `claude/compassionate-ramanujan-qoaiw1`, HEAD `c2192cb`. 검증 시작 시 `git status --short` 출력 없음 |

## 2. 범위

1. 명세 적합성: P02 범위·완료 기준, 실행 흐름(§3), parser 규칙(§6), 슬롯 표식(§6.1), 편집 반영(§6.2), 데이터 계약, 의존 방향
2. 정확성 코드 리뷰: `readLiteral`, `check`, `functionBlock`, `findValueSlots`, `applyEdits`, `acceptChange`, `CodeEditor` 변경 처리, App `run`(오래된 클로저), dirty 계산, Terminal 문구
3. 실제 브라우저 동작(Playwright + Chromium)
4. 테스트: `npm test` 결과, 양방향성, 뮤테이션 26건
5. 기록: HANDOFF, 작업 로그 §18, P02 상태

## 3. 방법

```bash
cd /home/user/Hidden-Main-
git status --short; git log --oneline -5; git diff --stat d22d3d1..c2192cb
cat -n src/engine/*.ts src/ui/editor/acceptChange.ts src/ui/editor/CodeEditor.tsx src/app/*.ts src/app/App.tsx
set -o pipefail
npm run build   # 0 (500kB 청크 경고만, HANDOFF에 기록된 기존 사항)
npm run lint    # 0
npm test        # Test Files 6 passed (6), Tests 42 passed (42)
# 엔진 경계값 탐침: engine 파일을 scratch로 복사해 import 경로만 '.ts'로 바꾼 뒤
node --experimental-strip-types <scratch>/eng/probe.ts
# 브라우저
npx vite preview --port 4174 --strictPort &   # npm 1802, sh 1816, vite 1817 — 끝난 뒤 셋 다 PID로 kill
node <scratch>/pw/main.mjs     # 데모·완료 기준 전체 시나리오 (1400x1400 및 기본 1280x720 두 번)
node <scratch>/pw/dbg.mjs      # 전체 선택 삭제, 한 글자씩 입력, Enter/Tab
node <scratch>/pw/stress.mjs   # 빠른 입력 직후 실행 40회
node <scratch>/pw/race.mjs     # 입력 직후 실행, 같은 태스크 이중 실행, 편집기 밖 실행, IME
node <scratch>/pw/race2.mjs    # 메인 스레드 바쁜 동안 실제 키 이벤트 이중 Ctrl+Enter 5회
node <scratch>/pw/ime.mjs      # IME 조합 후 실행 취소
python3 <scratch>/mutate.py    # 뮤테이션 26건: cp 백업 → 변형 → vitest(해당 파일) → 백업 복사 복원 → filecmp
git status --short             # 기록 파일 외 출력 없음
```

`<scratch>` = `/tmp/claude-0/-home-user/3b0a597e-d47b-5e66-bbbb-85f3679368e9/scratchpad/p02`. Playwright는 `/opt/node22/lib/node_modules/playwright/index.mjs`(사전 설치 Chromium).

## 4. 결과

### 4.1 명세 적합성

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| `main.py` 하나로 시작, 함수 하나에 선택지 주석 3개 + `action = 1` | 충족 | `src/app/prototype/main.py:6-18`, 브라우저 초기 Explorer `["main.py"]` |
| parser는 `engine/` 순수 함수 | 충족 | `src/engine/parser.ts`는 `./types`만 import. `src/engine/` 전체에서 `ui/`·`app/` import 없음(grep) |
| 리터럴 문법(정수·실수·`True`/`False`·따옴표 문자열, 앞뒤 공백 허용, 그 외 오류) | 충족 | `parser.ts:5-31`. 탐침: `1 + 1`, `0x1`, `1e3`, `NaN`, `-`, `""` 밖 문자 → `null` |
| 오류 종류 3개 | 충족 | `types.ts:23`가 계약 §4와 글자 그대로 일치 |
| §3 실행 흐름: 검증 통과 전 상태 변경 없음, 조기 종료는 출력만 | 충족(단일 실행 기준) | `App.tsx:57-65`(안내 두 경로는 `print` 후 `return`), `:72-87`(실패는 `print` 후 `return`), 상태 변경은 `:95-100`뿐. 이중 실행은 H1 |
| §6.1 패턴 `^ *(필드명) *= *(리터럴) *(#.*)?$`, 슬롯 = 리터럴만 | 충족 | `slots.ts:7,43,46-47`. `escapeRe`로 필드명 이스케이프(탐침 `a.b`가 `axb`와 혼동되지 않음). 리터럴 안 `=`(`"a=b"`), 공백 없는 `action=1#c`, 줄 끝 공백 모두 리터럴만 슬롯 |
| §6.1 주석 줄·다른 함수·모듈 수준 제외 | 코드 충족, **주석 줄 제외는 테스트 미고정(B1)** | 다른 함수·모듈 수준은 M17이 검출. 주석 줄은 M16 생존 |
| §6.2 끝 위치 포함, 줄바꿈 거부, 여러 슬롯 거부 | 충족 | `acceptChange.ts:11-12`. 브라우저: 끝·시작 삽입 수락, 앞 공백 위치 거부, Enter·여러 줄 붙여넣기·`Shift+Home` 후 입력 거부 |
| §6.2 수락 시 모델 재작성 없음, 거부 시 그 변경만 실행 취소 | 충족 | `CodeEditor.tsx:71-74`(텍스트 같으면 그대로), `:104-114`. 브라우저 D·E(4.3) |
| §6.2 "Editor는 … 오프셋을 직접 계산하지 않는다" | **불일치(B2)** | `CodeEditor.tsx:115-119`가 수락한 변경마다 슬롯 오프셋을 직접 옮김 |
| §6.2 실행 시 ref 읽기 | 충족(편집 값만) | `App.tsx:19-25,66`. 다른 상태는 H1 |
| 시각 표시(점선 밑줄, R-01) | 충족 | `App.css:176-180`, `CodeEditor.tsx:134-143` |
| 다른 탭에서 실행 → 안내 한 줄, 상태 불변(SoT §3.5) | 충족 | `App.tsx:62-65`, 브라우저 G |
| 엔딩 후 실행 → 안내 한 줄 | 충족 | `App.tsx:58-61`, 브라우저 I |
| 유효 선택 → Explorer에 `event_002.py`, 팝업·전환 없음(R-05) | 충족 | 브라우저 H: 활성 탭은 `main.py` 그대로 |
| 닫은 탭 모델 유지 결정 | 충족 | `P02_core_loop_prototype.md:24` 결정, 브라우저 G: 닫았다 다시 열면 편집 값 유지 |
| 데이터 계약 | 대체로 일치 | `types.ts:4-45`의 `Value`·`EditableField`·`Choice`·`ParseError`·`ParseResult`·`PlayerEdits`·`ValueSlot`·`FileView` 모양이 계약 §2·§3·§4·§6·§7과 같음. 차이는 H6 |
| 의존 방향 | 충족 | `ui/editor/acceptChange.ts:1`, `CodeEditor.tsx:2`는 `engine/types`만. `engine/`은 외부 import 없음 |

### 4.2 정확성 리뷰

- `readLiteral`(`parser.ts:9-31`): 탐침 결과 `01` → 정수 1(Python 3에서는 `SyntaxError`), `"a\nb"` → `anb`(Python은 줄바꿈 문자). 둘 다 계약이 이스케이프 의미·앞자리 0을 정하지 않아 차단 사유 아님(H4). `-0` → 0, `\t2` → 2(공백 허용 범위), `"\"` → `null`, `"a" "b"` → `null` 정상.
- `check`(`parser.ts:33-47`): int는 float 거부(`2.0` → `type_mismatch`), number는 int·float 허용·양끝 포함, bool·string 정상. 400자리 숫자 → `out_of_range`로 안전.
- `functionBlock`(`slots.ts:10-28`): 빈 줄 통과, 마지막 함수가 EOF까지, CRLF 정상(`$`가 `\r` 앞에서 맞음, 슬롯 `[45,46)`), 정규식 `def f\(`라 `f2`와 혼동 없음. 중첩 `def`가 있으면 안쪽 `action = 9`를 먼저 잡음(탐침) — 템플릿 규칙(필드당 한 줄, P04 검증 테스트)이 막으므로 H5.
- `findValueSlots`(`slots.ts:31-50`): 필드명 접두어(`name` vs `name2`) 구분, 리터럴 아닌 기본값(`1 + 2`) 줄은 슬롯 없음. 필드를 못 찾으면 조용히 건너뜀(`:45`) → 실행 시 `''`로 `not_literal`, 줄 번호 `?`. 계약상 P04 검증 테스트 소관.
- `applyEdits`(`slots.ts:56-69`): 입력 슬롯이 `start` 순으로 정렬돼 있다고 가정. `findValueSlots`(`:49`)와 `prototype.ts:67`이 정렬해 넘김. 복잡도 O(슬롯 수 × 텍스트 길이), 고정 규모.
- `CodeEditor`(`CodeEditor.tsx:91-122`): 변경 2개 이상 이벤트(다중 커서)는 거부. 거부 실행 취소는 `queueMicrotask`라 다음 키 이벤트 전에 끝남(stress 40회 불일치 0). 사용자 실행 취소·다시 실행은 같은 처리기를 거치며, 거부된 변경이 다시 실행 스택에 남아도 다시 실행하면 또 거부되어 되돌아감(브라우저 E). 엔진 재작성(`:60-67`)은 `writingRef`로 처리기를 건너뜀.
- App `run`(`App.tsx:55-101`): 편집 값은 ref에서 읽지만 `state`·`choices`는 렌더 클로저 값(`:57,67,88-89,101`). 같은 태스크에서 두 번 실행되면 두 번째 실행이 이미 해결된 사건을 기본값으로 다시 실행한다(H1, 4.3 K1).
- dirty(`App.tsx:38-46`): 현재 사건 슬롯 값이 템플릿 기본값과 다를 때만. 해결 후 `main.py`는 슬롯이 없어 표시 없음(브라우저 H).
- Terminal 문구(`terminalMessages.ts:24-34`): 예 `ValueError: action 값은 1, 2, 3 중 하나여야 합니다 (입력: 4)`, `SyntaxError: action 값에는 정수 하나만 쓸 수 있습니다 (입력: 없음)`. 무엇을 넣어야 하는지가 한국어로 드러나 R-07에 맞음.

### 4.3 브라우저 동작

| 확인 | 관찰 |
| --- | --- |
| A 초기 | `.monaco-editor` 1개, Explorer `["main.py"]`, 슬롯 `1`, 18행 `        action = 1` |
| B 슬롯 밖 입력 | 1행 `x` 입력 → 되돌려짐, 커서 위치 같음. 18행 1열 `abc` → 되돌려짐, dirty 없음 |
| C 경계 | 끝 위치 `3` → `13`(수락), 시작 위치 `9` → `913`(수락), 리터럴 앞 공백 위치 `z` → 거부·커서 복원. dirty 표시 |
| D 거부 후 실행 취소 | 1회 → `13`(직전 수락 하나만), 2회 → `1` |
| E 다시 실행 | `Ctrl+Y` → `13`, `Ctrl+Shift+Z` → `913`, 그 이상 변화 없음. 실행 취소 10회 → `1`, 다른 줄 모두 원본 그대로 |
| L 전체 선택 후 Delete/Backspace | 문서 그대로 |
| L 붙여넣기 | `2\n3` → 거부, 1행에 `2` → 거부, 슬롯 선택 후 `2` → `action = 2` |
| L Enter·Tab | 슬롯 안 Enter → 줄 수 28 그대로. 슬롯 끝 Tab → 공백 2칸 삽입 수락(`1 + 1  `) — 슬롯 안 공백이라 규칙상 정상 |
| F 잘못된 값 `4`,`0`,`x`,`1 + 1`,`2.0`,`"2"`,`True`,빈 값,공백 | 각각 `$ python main.py` / `Traceback …` / `File "main.py", line 18, in triage_alert` / `ValueError`·`SyntaxError`·`TypeError` 한 줄. Explorer·18행 텍스트 불변, 새 파일 없음 |
| G 탭 없음에서 실행 | `실행할 파일: main.py` 한 줄, Explorer 불변. 다시 열면 편집 값 유지 |
| H 유효 값 `2` | `[02:14:07] 서버 격리 요청` / `[02:14:08] …` / `[workspace] event_002.py 생성됨`. Explorer `["event_002.py","main.py"]`, 활성 탭 `main.py` 유지, 18행 `action = 2`, 슬롯 0개, 그 줄 입력 거부 |
| G 비현재 탭 실행 | `실행할 파일: event_002.py (현재 탭: main.py)` 한 줄, Explorer 불변 |
| I `event_002.py` | 클릭 시 열림, 16행 슬롯 `1`. `3` → `ValueError … 1, 2 중 하나 …`, `2` → 결과 로그, 이후 실행 → `처리할 사건이 없습니다.`(두 탭 모두) |
| J 입력 직후 실행 | `3` 입력 직후 `Ctrl+Enter` → `경보 무시` 결과(입력 반영) |
| K3 편집기 밖 실행 | Terminal 클릭 후, Explorer 항목에서 각각 1회 실행. 편집기 안에서는 1회만(창 리스너 중복 없음) |
| K1 같은 태스크 이중 실행 | **결함 재현(H1)**: 창에 `Ctrl+Enter` keydown 2개를 한 태스크에서 보내면 `서버 격리 요청 … 생성됨` 다음에 `접근 기록 분석 시작 … 생성됨`이 또 출력되고, `main.py` 18행이 `action = 1`로 고정됨(첫 실행은 2) |
| K2·race2 실제 키 이중 입력 | CDP 실제 키 이벤트로는 5회 + 1회 모두 재현 안 됨(두 번째는 `실행할 파일: event_002.py` 안내) |
| M IME | 슬롯 밖 조합 → 거부. 슬롯 안 `가` → 수락. 이후 실행 취소가 1회째 무변화, 2회 `ㄱ`, 3회 원래 값(H7) |
| 콘솔·외부 요청 | 모든 실행에서 오류·경고 0, 외부 요청 0, `.monaco-editor` 1개 |

참고: 기본 뷰포트 첫 실행에서 한 번 `1 + 1` 입력이 `1 +`로 기록된 적이 있으나, 같은 시나리오 재실행 3회와 stress 40회에서 다시 나오지 않아 결함으로 올리지 않는다.

### 4.4 테스트와 뮤테이션

`npm test`: 6파일 42개 통과. parser·`acceptChange` 테스트는 과소/과잉 엄격 쌍으로 이름 붙어 있고 완료 기준의 각 오류 종류·끝 위치 포함·여러 슬롯·줄바꿈을 다룬다.

| ID | 변형 | 위치 | 실패한 테스트 |
| --- | --- | --- | --- |
| M1 | `change.end <= s.end` → `<` (끝 미포함) | `acceptChange.ts:12` | accepts … at its end (over-strict) |
| M2 | 줄바꿈 검사 삭제 | `acceptChange.ts:11` | rejects … line breaks (under-strict) |
| M3 | `start >= s.start` → `>` | `acceptChange.ts:12` | accepts … at its start |
| M4 | `/[\r\n]/` → `/[\n]/` | `acceptChange.ts:11` | **생존** (H3) |
| M5 | int가 float 허용 | `parser.ts:36` | rejects … wrong-type |
| M6 | int 허용값 검사 삭제 | `parser.ts:37` | rejects …, reports every failing field |
| M7 | number 범위 양끝 미포함 | `parser.ts:40` | checks number ranges inclusively |
| M8 | string 허용값 검사 삭제 | `parser.ts:45` | checks string options and bools |
| M9 | `trim` 삭제 | `parser.ts:10` | accepts every allowed option |
| M10 | 끝 백슬래시 검사 삭제 | `parser.ts:20` | reads quoted strings … |
| M11 | 이스케이프 안 된 따옴표 허용 | `parser.ts:23` | reads quoted strings … |
| M12 | FLOAT에 지수 허용 | `parser.ts:6` | reads numbers but not other words |
| M13 | 오류 1개면 성공 처리 | `parser.ts:64` | 3개 |
| M14 | 블록 끝 `<=` → `<` | `slots.ts:21` | functionBlock ends at … |
| M15 | 빈 줄에서 블록 종료 | `slots.ts:20` | 7개(slots·prototype) |
| M16 | 줄 앞 `^ *` → `^.*` (주석 줄·접두어 허용) | `slots.ts:43` | **생존** (B1) |
| M17 | 함수 블록 대신 전체 텍스트 검색 | `slots.ts:44` | 5개(다른 함수·모듈 수준 제외 포함) |
| M18 | `applyEdits` shift 부호 반대 | `slots.ts:65` | applyEdits 2개 |
| M19 | 편집 슬롯 `end` 갱신 안 함 | `slots.ts:66` | applyEdits 2개 |
| M20 | 리터럴 위치를 `=` 뒤가 아닌 줄 처음부터 찾음 | `slots.ts:46` | **생존** (H2) |
| M21 | 슬롯 정렬 삭제 | `slots.ts:49` | returns slots sorted … |
| M22 | 기본값 문자열에 `#` 허용 | `slots.ts:7` | 생존 — 계약상 P04 시나리오 검증 소관(§6.1 마지막 항목), 결함 아님 |
| M23 | 해결된 사건 슬롯도 편집 가능 | `prototype.ts:68` | 2개 |
| M24 | 미해금 사건도 도달 처리 | `prototype.ts:54` | starts with only main.py |
| M25 | 해결 값 고정 표시 안 함 | `prototype.ts:65` | after solving main.py … |
| M26 | `formatLiteral` 이스케이프 삭제 | `parser.ts:71` | writes Python literals … |

모든 변형 후 `filecmp`로 백업과 바이트 동일 확인. 마지막 `git status --short`는 이 기록 파일만.

M16 상세: `slots.test.ts`의 주석 줄 `        # 2. action = 2 isolates the host`는 뒤에 단어가 붙어 있어 `^.*action *= *(리터럴) *(#.*)?$`에도 맞지 않는다. 테스트 이름(`slots.test.ts:46` "not comments")이 주장하는 주석 제외를 실제로 고정하지 못한다.

### 4.5 기록

- P02 상태: `P02_core_loop_prototype.md:3`와 `00_index.md:9` 모두 In Progress — 일치.
- HANDOFF 현재 상태(`HANDOFF.md:9-15`)는 코드와 일치, 완료 서술 없음. 단 다음 작업(`HANDOFF.md:28`)이 "P02 핵심 루프 프로토타입"으로 남아 작업 로그 다음 단계(`work_log.md:209-210`, "P02 독립 검증 → …")와 다르다(H8).
- 작업 로그 §18(`work_log.md:164-175`): 테스트 수 42, 브라우저 관찰은 재현과 일치. 다만 이 커밋에서 바꾼 아키텍처 §6.2(`00_overview.md:125-127`, "개발 빌드에서 확인" 삭제와 두 항목 추가)가 파일 목록에 없고, 문서 버전(`00_overview.md:3` v0.3)도 그대로다. P02 결정(점선 밑줄, 모델 유지, 실행 취소가 키 입력 단위)이 "결정" 절(`work_log.md:192-205`)에 없다(H8).

## 5. 문제 / 위험

### Blocking (계약 의무)

- **B1. §6.1 주석 줄 제외가 테스트로 고정되지 않음.** `00_overview.md` §6.1 셋째 항목(들여쓴 주석의 `action = 2`는 슬롯이 아님)은 명시된 계약 분기인데, `slots.ts:43`의 `^ *`를 `^.*`로 바꿔도(M16) 42개 모두 통과. `slots.test.ts:10`의 주석은 뒤에 단어가 붙어 어느 쪽 정규식에도 맞지 않는다. 고칠 것: 슬롯 줄보다 앞에 `        # action = 2` 또는 `        # action = 2  # 설명` 같은 줄을 두고 슬롯이 실제 줄을 가리키는지 확인하는 테스트(접두어 필드 `xaction = 5`도 함께).
- **B2. §6.2 "Editor는 오프셋을 직접 계산하지 않는다"(`00_overview.md:122`)와 구현 불일치.** `CodeEditor.tsx:115-119`가 수락한 변경마다 슬롯 `start`/`end`를 직접 옮긴다(재렌더 전 다음 키 입력 판정에 필요). 같은 커밋이 §6.2에 ref 항목을 추가하면서 이 문장은 그대로 두었다. 코드를 `applyEdits`로 계산하도록 바꾸거나, 재렌더 전 임시 이동을 §6.2에 명시하고 버전·작업 로그에 남겨야 한다.

### Hardening (비차단)

- **H1. 재렌더 전 이중 실행.** `App.tsx:57,67,88-89`가 `state`·`choices`를 렌더 클로저에서 읽어, 같은 태스크에서 두 번 실행되면 해결된 사건을 기본값으로 다시 적용한다(K1 재현: 출력 두 번, 고정 값이 2→1). SoT §3.3 "해결한 함수는 다시 실행할 수 없다"에 어긋나지만 실제 키 입력으로는 재현되지 않았다. P03 reducer 도입 전에 `choices`도 ref로 읽거나 실행 대상 사건을 ref 기준으로 확인할 것.
- **H2.** `slots.ts:46`의 "`=` 뒤에서 찾기"를 고정하는 테스트 없음(M20). 필드명에 리터럴과 같은 문자가 있는 경우(`a1 = 1`, `x2 = 2`) 케이스 추가.
- **H3.** 단독 `\r` 삽입 거부 미고정(M4). `acceptChange.test.ts`에 `text: '\r'` 추가.
- **H4.** `readLiteral`이 `01`을 정수로, `"\n"`을 `n`으로 읽음(`parser.ts:5,21`). §6 리터럴 문법에 앞자리 0·이스케이프 의미를 명시하거나 Python과 맞출 것.
- **H5.** 중첩 함수가 있으면 안쪽 줄이 먼저 잡힘(`slots.ts:44`), 들여쓰기 0의 주석 줄이 블록을 끝냄(`slots.ts:21`). P04 시나리오 검증 테스트 항목으로 둘 것.
- **H6.** 계약 이름 차이: §3 2단계 `Engine.parse(scene, 리터럴)` ↔ `parseChoice(sceneId, fields, literals)`(`parser.ts:50`), `Scene.editableFields` ↔ `PrototypeScene.fields`(`prototype.ts:13`). P03에서 정리.
- **H7.** IME 조합 입력이 실행 취소 단위를 여러 개 만든다(첫 실행 취소 무변화, `CodeEditor.tsx:114`). 값이 빈 문자열이면 밑줄 표시가 사라진다(0폭 데코레이션, `CodeEditor.tsx:134-143`).
- **H8.** 기록: HANDOFF 다음 작업(`HANDOFF.md:28`) 갱신, 아키텍처 §6.2 변경의 버전·작업 로그 반영, P02 결정 3건을 "결정" 절에 기록.

## 6. 판정

**조건부 합격** — B1(§6.1 주석 줄 제외 테스트 추가)과 B2(§6.2 오프셋 계산 문장과 `CodeEditor.tsx:115-119` 일치)를 닫아야 한다.

- 데모와 완료 기준의 수동 항목(슬롯 밖 되돌림·커서·실행 취소, 잘못된 값 후 상태 불변, 비현재 탭 안내 한 줄)은 실제 브라우저에서 모두 재현됨.
- parser·`acceptChange` 단위 테스트는 완료 기준 항목을 양방향으로 고정(M1~M3, M5~M13 검출).
- 계약이 명시한 주석 줄 제외 분기 하나가 테스트로 고정되지 않았고(M16 생존), 아키텍처 문장 하나가 코드와 다르다.

## 7. 남은 일

- 작업 트리: 이 기록 파일 외 변경 없음. 커밋하지 않음.
- B1·B2 반영 후 재검증(범위: `slots.test.ts`, `CodeEditor.tsx` 또는 `00_overview.md` §6.2) → 통과 시 P02 Complete 가능.

## 8. 재현

```bash
cd /home/user/Hidden-Main-
npm run build && npm run lint && npm test
npx vite preview --port 4174 --strictPort &      # 끝나면 PID로 종료
node <scratch>/pw/main.mjs; node <scratch>/pw/race.mjs; node <scratch>/pw/ime.mjs
python3 <scratch>/mutate.py                       # M1~M26, 각 변형 후 백업 복원·filecmp
git status --short
```
