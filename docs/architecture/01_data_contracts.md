# 데이터 계약

> 상태: **v0.7** · 2026-10-23 · 상위 기준: [`../SOT.md`](../SOT.md), [`00_overview.md`](00_overview.md)
> 작성 규칙: [`../guides/data-contracts.md`](../guides/data-contracts.md), [`../guides/api-and-persistence-schemas.md`](../guides/api-and-persistence-schemas.md)
> 정본 코드: 엔진 계약은 `src/engine/types.ts`, `SaveSnapshot`·`WorkspaceView`·`KeyValueStore`는 `src/persistence/save.ts`. 이 문서와 코드가 다르면 이 문서를 고친다.

---

## 1. 계약 목록과 소유자

| 개념 | 정본 소유자 | 쓰기 권한 | 수명 | 저장 |
| --- | --- | --- | --- | --- |
| `Scenario` / `Stage` / `Scene` / `Ending` / `StaticFile` | 시나리오 데이터 (`src/scenario/`) | 작성자(빌드 시점)만 | 정적 | 번들 |
| `Choice` | Input Parser가 생성, `Progress`에 그대로 보관 | Parser만 생성 | 플레이 전체 | 함 (`Progress` 안) |
| `ParseError` | Input Parser | Parser만 생성 | 실행 1회 | 안 함 |
| `Progress` | Story Engine | `apply()`만 | 플레이 전체 | 함 |
| `DerivedState` | Story Engine | 없음 (계산 결과) | 계산 시점 | 안 함 |
| `PlayerEdits` | EditorPane (플레이어) | 편집 이벤트만 | 플레이 전체 | 함 |
| `WorkspaceView` (열린 탭, 활성 파일) | UI (App이 상태로 보관) | UI만 | 플레이 전체 | 함 (새로고침 후 탭 복원, SoT §3.6). 타입은 저장 형식의 일부라 `persistence/`에 선언 |
| `SaveSnapshot` | Persistence 어댑터 | 어댑터만 | 저장소 | localStorage |
| 고른 시나리오 id | App(`main.py` 실행) | `choose()`만 | 브라우저 | localStorage `incident-workspace:active` (SoT §3.7) |
| `main.py` 값(`scenario`, `restart`) | EditorPane (플레이어) | 편집 이벤트만 | 작업 공간이 열려 있는 동안 | 안 함 |

---

## 2. 공통 타입

```ts
type SceneId = string;
type StageId = string;
type EndingId = string;

type Value = number | boolean | string;   // 지정 변수 값의 유일한 타입 정의. 아래 모든 계약이 이것을 참조한다.

type LogLine = { level: "info" | "warn" | "error"; text: string };
```

---

## 3. 시나리오 계약 (정적)

ideation §6.2의 Stage/Scene를 정리한 것이다.

```ts
type Scenario = {
  id: string;                 // 예: "incident-0214"
  title: string;              // main.py 시나리오 목록의 제목
  summary: string;            // 그 아래 한 줄 소개
  version: number;            // 시나리오 내용 변경 시 증가 (저장 호환성 판단에 사용)
  initialFiles: StaticFile[]; // 설정 파일 등 처음부터 보이는 비스테이지 파일. main.py는 앱 소유라 넣지 않는다
  stages: Stage[];
  scenes: Scene[];            // 모든 사건을 한 번씩. 스테이지는 sceneIds로 참조만 한다
  endings: Ending[];
  startSceneId: SceneId;
};

type StaticFile = { path: string; content: string };

type Stage = {
  id: StageId;
  filePath: string;           // 예: "incidents/02_security_audit.py"
  template: string;           // .py 원문 (?raw import). 사건 함수 블록 단위로 나뉘어 진행에 따라 추가됨 (DB-03)
  sceneIds: SceneId[];        // 파일 안 사건 순서
};

type Scene = {
  id: SceneId;
  stageId: StageId;
  functionName: string;       // 템플릿 안 사건 블록을 찾는 키
  editableFields: EditableField[];
  transitions: Transition[];  // 위에서부터 첫 번째로 조건이 맞는 것 적용. 마지막은 빈 조건(기본 경로)이어야 함
};

type EditableField =
  | { name: string; type: "int"; options: number[] }   // action = 1..3
  | { name: string; type: "bool" }
  | { name: string; type: "number"; min: number; max: number }
  | { name: string; type: "string"; options: string[] };

type Transition = {
  when: Condition;            // 이번 선택 값과 플래그에 대한 조건
  effects: Effect[];          // 플래그 설정
  log: LogLine[];             // Terminal 출력
  next: { scene: SceneId } | { ending: EndingId };
};

type Condition = Clause[];    // 모두 참이어야 참(AND). 빈 배열 = 항상 참
type Clause = {
  ref: { choice: string } | { flag: string };   // 이번 선택의 필드 또는 누적 플래그
  op: "==" | "!=" | ">=" | "<=";   // ">=", "<="는 숫자 값끼리만. 불리언·문자열에는 "==", "!="만 (시나리오 검증 테스트로 확인)
  value: Value;
};

type Effect = { flag: string; value: Value };   // 플래그를 이 값으로 설정

type Ending = { id: EndingId; log: LogLine[] };  // 엔딩 도달 시 Terminal 출력
```

- 전이 그래프는 앞으로만 간다: `next.scene`은 아직 도달하지 않은 사건이어야 한다(되돌아가는 루프 없음). 이미 도달한 사건으로 돌아가면 해결된 값과 공개 알림이 다시 처리되므로, P04 시나리오 검증 테스트가 막는다.
- 파일 단위로도 앞으로만 간다: `next.scene`의 스테이지는 지금 스테이지이거나 `stages` 목록에서 뒤에 있어야 한다(시나리오 검증, 아키텍처 §5.2 — 떠난 파일의 `next_file()` 안내와 파일 순번이 이 규칙에 기댄다).
- 템플릿 줄바꿈은 LF로 다룬다. 저장소는 `.gitattributes`로 `.py`를 LF로 고정하고, 엔진도 렌더 전에 CRLF를 LF로 바꾼다.
- `description`(ideation)은 별도 필드로 두지 않는다. 주석은 `template` 안에 이미 있는 텍스트이므로 같은 이야기를 두 곳에 쓰지 않는다. 선택에 따른 주석 변형은 템플릿 안의 표시 블록 + 조건으로 표현한다. MVP 범위는 새로 추가되는 사건 함수에 한정한다(DB-01).
- 기본값(`action = 1` 같은 초기 값)도 템플릿 텍스트가 정본이다. `EditableField`에 기본값을 따로 두지 않는다.
- 시나리오는 위 타입의 TypeScript 객체로 작성하고, 함수·클로저 없이 순수 데이터만 쓴다(DB-04).

### 3.1 ideation 필드와의 대응

| ideation §6.2 | 이 계약 | 이유 |
| --- | --- | --- |
| `Stage.scenes` | `Stage.sceneIds` + `Scenario.scenes` | 사건 정의는 `Scenario.scenes` 한 곳에만 두고, 스테이지는 순서만 참조하도록 이름으로 구분 |
| `Stage.initialCode` | `Stage.template` | 처음 화면에 그대로 보이는 코드가 아니라, 사건 블록 단위로 잘려 진행에 따라 조립되는 원본이므로(DB-03) 이름을 바꿈 |
| `Stage.unlockCondition` | 없음 (파생) | DB-03(B)에서 스테이지 파일은 그 안의 사건이 처음 현재 사건이 될 때 나타난다. 전이 그래프에서 결정되므로 별도 조건을 두면 같은 사실을 두 곳에 쓰게 된다. 조건부로만 나타나는 파일은 P1(DB-01) |
| `Scene.functionName` | `Scene.functionName` | 이름은 같다. 화면상 함수 이름이자, 템플릿에서 이 사건의 블록과 값 슬롯을 찾는 키로 쓰인다 |
| `Scene.description` | 없음 (`template` 안 주석) | 위 설명 참고 |
| `Scene.transitions` | `Scene.transitions` | 같음 |
| `Scene.effects` | `Transition.effects` | 결과 상태 변화는 어떤 선택을 했느냐에 따라 다르므로 선택별 전이에 둠 |

---

## 4. 입력 계약 (Parser)

```ts
// 입력: 필드명 → 원문 리터럴 맵 (PlayerEdits의 현재 사건 항목 + 편집 안 한 필드는 ValueSlot.defaultLiteral). 렌더된 파일 텍스트를 다시 파싱하지 않는다.
type ParseResult =
  | { ok: true; choice: Choice }
  | { ok: false; errors: ParseError[] };

type Choice = {
  sceneId: SceneId;
  values: Record<string, Value>;   // 검증 통과한 값만
};

type ParseError = {
  field: string;
  raw: string;                     // 플레이어가 입력한 원문
  kind: "not_literal" | "type_mismatch" | "out_of_range";
};
```

- 필드 누락·중복은 DB-02(B)에서 구조상 불가능하므로 오류 종류에 두지 않는다. 편집 값이 없는 필드는 템플릿 기본값의 원문을 쓴다.

---

## 5. 진행 계약 (정본, 저장 대상)

```ts
type Progress = {
  choices: Choice[];   // 적용된 선택의 순서 기록. 유일한 정본.
};
```

- `Choice`는 parser가 만든 것을 그대로 쌓는다. 별도의 "적용된 선택" 타입을 두지 않는다.
- ideation §6.2 GameState의 항목과의 관계:

| ideation 항목 | 이 설계에서 | 이유 |
| --- | --- | --- |
| 사건 진행 기록 | `Progress.choices` (정본) | 다른 모든 진행 상태의 출처 |
| 현재 함수 | 파생 (`derive`) | 마지막 전이의 `next`로 결정됨 |
| 스토리 플래그 | 파생 | `choices`를 재생하며 `effects` 누적 |
| 해금된 파일 목록 | 파생 (`DerivedState.files`의 키) | 지금까지 현재 사건이 된 적 있는 사건들의 스테이지 파일. 별도 목록을 두면 `files`와 같은 사실을 두 번 쓰게 됨 |
| 엔딩 상태 | 파생 | 마지막 전이가 `ending`이면 종료 |
| 현재 파일 | `WorkspaceView` (UI 상태) | 게임 규칙이 아니라 화면 상태 |
| 사용자 코드 수정 내용 | `PlayerEdits` (별도 계약) | 소유자가 플레이어로 다름 |

- 같은 사실을 두 군데에 쓰지 않으므로 "플래그와 기록이 어긋나는" 상태가 생길 수 없다.

---

## 6. 파생 계약 (저장 안 함)

```ts
type DerivedState = {
  currentSceneId: SceneId | null;   // 엔딩 도달 시 null
  flags: Record<string, Value>;
  ending: EndingId | null;
  log: LogLine[];                   // 전체 Terminal 기록 (재생으로 복원)
  files: Record<string, FileView>;  // 보이는 파일 전부(initialFiles + 해금된 스테이지) → 템플릿 + 스토리 오버레이 (플레이어 편집 적용 전)
  handoffs: Record<string, string>; // 진행이 떠난 파일 → 그 파일의 next_file()이 가리키는 파일 (재생 중 기록, 아키텍처 §5.2)
};

type FileView = {
  text: string;
  valueSlots: ValueSlot[];          // 현재 사건의 편집 가능 구간. 현재 사건이 이 파일에 없으면 빈 배열
};

type ValueSlot = {
  sceneId: SceneId;
  field: string;
  start: number;                    // text 안 오프셋 (JS 문자열 인덱스, UTF-16 코드 단위). 리터럴 시작
  end: number;                      // 리터럴 끝 (미포함)
  defaultLiteral: string;           // 템플릿의 해당 줄에서 읽은 기본값 원문 (템플릿이 정본, 이 필드는 그 투영)
};
```

- 값 슬롯은 정적 템플릿의 사건 블록 안 `필드명 = 리터럴` 줄에서 계산한다([아키텍처 §6.1](00_overview.md#61-값-슬롯-표식-규칙)). 슬롯의 위치·기본값은 Engine이 소유하고, UI는 읽기만 한다.
- 플레이어 편집을 반영한 화면용 `FileView`는 Engine의 `applyEdits(fileView, edits)`가 만든다(슬롯 구간 치환 + 뒤 슬롯 오프셋 이동, [아키텍처 §6.2](00_overview.md#62-편집-반영-규칙)). 결과는 저장하지 않는다.

- `derive(scenario, progress)`는 순수 함수다. 같은 입력이면 항상 같은 결과다.
- MVP 분량(선택 수십 회)에서는 매번 처음부터 재생해도 비용이 무시할 수준이다. 캐시는 측정으로 필요가 확인될 때만 둔다.
- 해결된 사건 함수의 값은 `Choice.values`를 Python 리터럴로 다시 써서 표시한다(DB-03 고정 표시): 정수·실수는 JavaScript 기본 숫자 표기, 불리언은 `True`/`False`, 문자열은 큰따옴표 + 필요한 이스케이프. 플레이어가 쓴 원래 표기(작은따옴표, `2.0` 등)는 보존하지 않는다.

---

## 7. 플레이어 편집 계약

DB-02(B): 플레이어는 지정 변수의 값만 편집한다.

```ts
type PlayerEdits = Record<SceneId, Record<string, string>>;  // 사건 → 필드명 → 편집 중인 원문 리터럴
```

- 원문 리터럴(예: `"2"`, `"True"`)을 그대로 둔다. 해석·검증은 실행 시 parser가 한다.
- 화면 텍스트는 매번 `render` → `applyEdits`로 재구성하므로 스토리 오버레이와 충돌하지 않는다.
- 해결된 사건의 값은 `Progress.choices`에서 오므로 `PlayerEdits`에서 지운다(DB-03 고정 표시). 따라서 실제로 남는 항목은 현재 사건 하나뿐이다.
- 편집 내용은 **아직 실행되지 않은 입력**이다. 실행이 성공해야만 `Progress`에 들어간다. 편집 자체가 진행 상태를 바꾸지 않는다.

---

## 8. 화면 상태 계약

```ts
type WorkspaceView = {
  openFiles: string[];        // 탭 순서
  activeFile: string | null;
};
```

- 복원 시 보이는 파일(`DerivedState.files`의 키와 공용 파일 `main.py`)에 없는 경로는 버린다. `activeFile`이 버려졌으면 남은 첫 탭, 없으면 `null`. 남은 탭이 하나도 없으면 시나리오를 처음 고른 화면(`main.py`와 시작 사건의 파일, 시작 파일이 활성)으로 돌아간다. `main.py`에서 시나리오를 고른 경우에는 복원 뒤 현재 사건의 파일을 열고 활성으로 한다(SoT §3.7).

---

## 9. 저장 계약

```ts
type SaveSnapshot = {
  schemaVersion: 1;        // 저장 형식 버전 (Persistence 어댑터 소유)
  scenarioId: string;
  scenarioVersion: number; // 저장 당시 Scenario.version
  progress: Progress;
  playerEdits: PlayerEdits;
  workspace: WorkspaceView;
  savedAt: string;         // ISO 8601, 저장 시각 (표시·디버깅용, 규칙에 쓰지 않음)
};
```

- 키: `incident-workspace:save:<scenarioId>` (시나리오별 1슬롯). 고른 시나리오 id는 `incident-workspace:active`에 따로 둔다. `restart = True`로 고르면 그 시나리오의 슬롯만 지운다(SoT §3.7).
- 시나리오를 바꾸기 직전에 지금 시나리오를 즉시 저장한다(같은 시나리오를 restart로 고를 때는 저장 뒤에 지워야 하므로 이 순서가 계약이다).
- 저장 시점: 실행 성공 직후, 편집·탭 변경 시(디바운스), 그리고 페이지를 떠날 때(`pagehide`)에는 App이 ref에 동기 기록해 둔 최신 진행·편집 값으로 즉시 저장한다(디바운스 대기분을 쓰지 않는다 — 입력 직후의 새로고침에서는 디바운스 예약 자체가 아직 안 됐을 수 있다). 그래서 새로고침 직전의 편집도 복원된다. 실행 실패 시에는 진행 상태를 바꾸지 않으므로 그로 인한 저장도 없다.
- 복원 규칙:
  - JSON 파싱 실패, `schemaVersion` 불일치, 또는 JSON이지만 모양이 계약과 다름(선택이 객체가 아님, `values`가 값 객체가 아님, 탭 목록이 문자열 배열이 아님 등) → 저장을 버리고 새 게임. Terminal에 한 줄 안내. 복원은 어떤 저장 내용에도 예외를 던지지 않는다(던지면 첫 화면이 비고, 저장이 남아 있어 새로고침해도 계속 빈다).
  - 같은 버전인데 재생이 중간에 막힘 → 재생 가능한 앞부분까지 복원, 편집 값 폐기, 안내 한 줄.
  - `scenarioVersion` 불일치 → `choices`를 재생해 보고, 재생 중 존재하지 않는 사건·필드·값을 만나면 그 직전까지 유효한 기록만 유지. `playerEdits`는 전부 버린다(현재 사건이 달라졌을 수 있으므로 템플릿 기본값으로 돌아감). `workspace`는 위 §8 규칙으로 정리.
  - localStorage 접근 자체가 실패(사생활 보호 모드 등) → 저장 없이 플레이 가능해야 한다.
- `schemaVersion`을 바꾸는 변경은 마이그레이션 또는 폐기 정책을 같은 커밋에서 정한다.
- 알려진 한계: 같은 브라우저에서 게임을 여러 탭으로 열면 마지막에 저장한 탭이 이긴다(뒤처진 탭을 닫을 때의 `pagehide` 저장이 다른 탭의 앞선 진행을 덮어쓸 수 있다). MVP는 한 탭 플레이를 전제로 한다.

---

## 10. 열거형·기본값의 정본

| 값 | 정본 위치 | 복사본 |
| --- | --- | --- |
| 값 타입 `Value`, 필드 타입 `int / bool / number / string` | `engine/types.ts` | 없음 |
| `ParseError.kind` | `engine/types.ts` | 없음 (Terminal 문구는 `kind`에서 만듦) |
| 선택지 기본값 | 시나리오 `.py` 템플릿 텍스트 | `ValueSlot.defaultLiteral` (Engine이 템플릿에서 읽은 투영, 저장 안 함) |
| 허용 값·범위 | `Scene.editableFields` | 템플릿 주석(사람용 설명) — 시나리오 검증 테스트로 일치 확인 (P04) |
| 저장 키 접두사, `schemaVersion`, 고른 시나리오 키 | `persistence/` | 없음 |
| 시나리오 목록·순서 | `scenario/index.ts`의 `scenarios` | `main.py` 목록(앱이 매번 생성, 저장 안 함) |
| `main.py` 필드(`scenario` 허용값 = 1..시나리오 수, `restart`) | `app/hub/hub.ts`의 `hubFields` | `main.py` 템플릿 주석 |
