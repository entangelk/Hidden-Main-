# 데이터 계약

> 상태: **v0.1 초안** · 2026-10-22 · 상위 기준: [`../SOT.md`](../SOT.md), [`00_overview.md`](00_overview.md)
> 작성 규칙: [`../guides/data-contracts.md`](../guides/data-contracts.md), [`../guides/api-and-persistence-schemas.md`](../guides/api-and-persistence-schemas.md)
> 아래 타입은 계약의 모양을 보이기 위한 초안이다. 실제 정본은 구현 시 `src/engine/types.ts` 한 곳에 둔다.

---

## 1. 계약 목록과 소유자

| 개념 | 정본 소유자 | 쓰기 권한 | 수명 | 저장 |
| --- | --- | --- | --- | --- |
| `Scenario` / `Stage` / `Scene` / `Ending` | 시나리오 데이터 (`src/scenario/`) | 작성자(빌드 시점)만 | 정적 | 번들 |
| `ChoiceInput` | Input Parser | Parser만 생성 | 실행 1회 | 안 함 |
| `Progress` | Story Engine | `apply()`만 | 플레이 전체 | 함 |
| `DerivedState` | Story Engine | 없음 (계산 결과) | 계산 시점 | 안 함 |
| `PlayerEdits` | EditorPane (플레이어) | 편집 이벤트만 | 플레이 전체 | 함 |
| `WorkspaceView` (열린 탭, 활성 파일) | UI | UI만 | 세션 | 선택 (편의용) |
| `SaveSnapshot` | Persistence 어댑터 | 어댑터만 | 저장소 | localStorage |

---

## 2. 시나리오 계약 (정적)

ideation §6.2의 Stage/Scene를 정리한 것이다.

```ts
type Scenario = {
  id: string;                 // 예: "incident-0214"
  version: number;            // 시나리오 내용 변경 시 증가 (저장 호환성 판단에 사용)
  initialFiles: StaticFile[]; // main.py, 설정 파일 등 처음부터 보이는 비스테이지 파일
  stages: Stage[];
  endings: Ending[];
  startSceneId: SceneId;
};

type Stage = {
  id: StageId;
  filePath: string;           // 예: "incidents/security_audit.py"
  template: string;           // .py 원문 (?raw import)
  sceneIds: SceneId[];        // 파일 안 사건 순서
  unlock: Condition;          // 해금 조건
};

type Scene = {
  id: SceneId;
  stageId: StageId;
  functionName: string;       // 코드상 함수 이름 = 파서 탐색 범위
  editableFields: EditableField[];
  transitions: Transition[];  // 위에서부터 첫 번째로 조건이 맞는 것 적용
};

type EditableField =
  | { name: string; type: "int"; options: number[] }                  // action = 1..3
  | { name: string; type: "bool" }
  | { name: string; type: "number"; min: number; max: number }
  | { name: string; type: "string"; options: string[] };

type Transition = {
  when: Condition;            // 이번 선택 값과 플래그에 대한 조건
  effects: Effect[];          // 플래그 설정 등
  log: LogLine[];             // Terminal 출력
  next: { scene: SceneId } | { ending: EndingId };
};
```

- `description`(ideation)은 별도 필드로 두지 않는다. 주석은 `template` 안에 이미 있는 텍스트이므로 같은 이야기를 두 곳에 쓰지 않는다. 선택에 따른 주석 변형은 템플릿 안의 표시 블록 + 조건으로 표현한다(범위는 DB-01).
- 기본값(`action = 1` 같은 초기 값)도 템플릿 텍스트가 정본이다. `EditableField`에 기본값을 따로 두지 않는다.
- 시나리오 형식(TS 객체 vs JSON)은 DB-04에서 정한다. 위 모양은 형식과 무관하다.

---

## 3. 진행 계약 (정본, 저장 대상)

```ts
type Progress = {
  choices: AppliedChoice[];   // 적용된 선택의 순서 기록. 유일한 정본.
};

type AppliedChoice = {
  sceneId: SceneId;
  values: Record<string, number | boolean | string>;  // 검증 통과한 값만
};
```

- ideation §6.2 GameState의 항목과의 관계:

| ideation 항목 | 이 설계에서 | 이유 |
| --- | --- | --- |
| 사건 진행 기록 | `Progress.choices` (정본) | 다른 모든 진행 상태의 출처 |
| 현재 함수 | 파생 (`derive`) | 마지막 전이의 `next`로 결정됨 |
| 스토리 플래그 | 파생 | `choices`를 재생하며 `effects` 누적 |
| 해금된 파일 목록 | 파생 | 플래그·진행 기록에 `Stage.unlock` 적용 |
| 엔딩 상태 | 파생 | 마지막 전이가 `ending`이면 종료 |
| 현재 파일 | `WorkspaceView` (UI 상태) | 게임 규칙이 아니라 화면 상태 |
| 사용자 코드 수정 내용 | `PlayerEdits` (별도 계약) | 소유자가 플레이어로 다름 |

- 같은 사실을 두 군데에 쓰지 않으므로 "플래그와 기록이 어긋나는" 상태가 생길 수 없다.

---

## 4. 파생 계약 (저장 안 함)

```ts
type DerivedState = {
  currentSceneId: SceneId | null;   // 엔딩 도달 시 null
  flags: Record<string, number | boolean | string>;
  unlockedFiles: string[];          // initialFiles + 해금된 Stage.filePath
  ending: EndingId | null;
  log: LogLine[];                   // 전체 Terminal 기록 (재생으로 복원)
  fileView: (path: string) => string; // 템플릿 + 스토리 오버레이 (플레이어 편집 적용 전)
};
```

- `derive(scenario, progress)`는 순수 함수다. 같은 입력이면 항상 같은 결과다.
- MVP 분량(선택 수십 회)에서는 매번 처음부터 재생해도 비용이 무시할 수준이다. 캐시는 측정으로 필요가 확인될 때만 둔다.

---

## 5. 플레이어 편집 계약

DB-02 결과에 따라 둘 중 하나가 된다.

| DB-02 | 모양 | 비고 |
| --- | --- | --- |
| A/C (전체 자유 편집) | `Record<filePath, string>` — 파일 전체 텍스트 | 스토리 오버레이와 병합 규칙 필요 |
| B (지정 값만 편집) | `Record<SceneId, Record<fieldName, string>>` — 필드별 원문 리터럴 | 화면 텍스트는 매번 `render`로 재구성, 충돌 없음 |

- 어느 쪽이든 편집 내용은 **아직 실행되지 않은 입력**이다. 실행이 성공해야만 `Progress`에 들어간다. 편집 자체가 진행 상태를 바꾸지 않는다.

---

## 6. 저장 계약

```ts
type SaveSnapshot = {
  schemaVersion: 1;        // 저장 형식 버전 (Persistence 어댑터 소유)
  scenarioId: string;
  scenarioVersion: number; // 저장 당시 Scenario.version
  progress: Progress;
  playerEdits: PlayerEdits;
  savedAt: string;         // ISO 8601, 저장 시각 (표시·디버깅용, 규칙에 쓰지 않음)
};
```

- 키: `incident-workspace:save:<scenarioId>` (시나리오별 1슬롯).
- 저장 시점: 실행 성공 직후, 편집 변경 시(디바운스). 실행 실패 시에는 진행 상태를 저장하지 않는다.
- 복원 규칙:
  - JSON 파싱 실패 또는 `schemaVersion` 불일치 → 저장을 버리고 새 게임. Terminal에 한 줄 안내.
  - `scenarioVersion` 불일치 → `choices`를 재생해 보고, 재생 중 존재하지 않는 사건·값을 만나면 그 직전까지 유효한 기록만 유지.
  - localStorage 접근 자체가 실패(사생활 보호 모드 등) → 저장 없이 플레이 가능해야 한다.
- `schemaVersion`을 바꾸는 변경은 마이그레이션 또는 폐기 정책을 같은 커밋에서 정한다.

---

## 7. 열거형·기본값의 정본

| 값 | 정본 위치 | 복사본 |
| --- | --- | --- |
| 필드 타입 `int / bool / number / string` | `engine/types.ts` | 없음 |
| 선택지 기본값 | 시나리오 `.py` 템플릿 텍스트 | 없음 |
| 허용 값·범위 | `Scene.editableFields` | 템플릿 주석(사람용 설명) — 시나리오 검증 테스트로 일치 확인 (P04) |
| 저장 키 접두사, `schemaVersion` | `persistence/` | 없음 |
