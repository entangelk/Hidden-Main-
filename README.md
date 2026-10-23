# Incident Workspace

VS Code처럼 보이는 웹 IDE 안에서 코드 주석을 읽고, 지정된 변수 값을 바꿔 실행하며 진행하는 선택지형 스토리 어드벤처입니다. 첫 시나리오는 *Incident 02:14*입니다.

## 플레이

배포 주소: https://entangelk.github.io/Hidden-Main-/

1. 처음 열려 있는 `main.py`의 사용법을 읽고, `incidents/01_event_001.py` 탭으로 옮깁니다.
2. 주석을 읽고, 밑줄 친 값만 바꿉니다(다른 곳은 편집되지 않습니다).
3. `Ctrl+Enter`(macOS `Cmd+Enter`)로 실행합니다. 현재 사건 파일이 활성 탭이어야 합니다.
4. Terminal에서 결과를 확인하고, 새로 생긴 함수나 파일로 넘어갑니다.

진행은 브라우저에 자동 저장되어 새로고침해도 이어집니다.

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev       # 개발 서버 (http://localhost:5173)
```

| 명령 | 내용 |
| --- | --- |
| `npm run build` | 타입 검사 후 `dist/`로 빌드 |
| `npm run preview` | 빌드 결과를 로컬에서 확인 |
| `npm test` | 단위 테스트와 시나리오 검증 |
| `npm run lint` | 린트(경고도 실패) |

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 lint·test·build 후 GitHub Pages로 배포합니다. 처음 한 번은 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 합니다.

## 문서

- 제품 기준: [`docs/SOT.md`](docs/SOT.md)
- 아키텍처: [`docs/architecture/`](docs/architecture/)
- 시나리오 설계: [`docs/scenario/incident-0214.md`](docs/scenario/incident-0214.md)
- 현재 상태와 다음 작업: [`HANDOFF.md`](HANDOFF.md)
