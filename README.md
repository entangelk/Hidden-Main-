# Incident Workspace

VS Code처럼 보이는 웹 IDE 안에서 코드 주석을 읽고, 지정된 변수 값을 바꿔 실행하며 진행하는 선택지형 스토리 어드벤처입니다.

| 번호 | 시나리오 | 분량 |
| --- | --- | --- |
| 1 | *Incident 02:14* — 새벽 02:14, 서버가 외부로 데이터를 보낸다 | 10~20분 |
| 2 | *Thermal Drift* — 토요일 새벽, 서버실 온도가 멈추지 않고 오른다 | 5~10분 |
| 3 | *Unlogged Run* — 연구소 스케줄러가 기록에 없는 실험을 돌린다 | 5~10분 |

## 플레이

배포 주소: https://entangelk.github.io/Hidden-Main-/

1. 처음 열려 있는 `main.py`에서 `scenario` 값을 시나리오 번호로 바꾸고 `Ctrl+Enter`(macOS `Cmd+Enter`)로 실행합니다.
2. 열린 사건 파일의 주석을 읽고, 밑줄 친 값만 바꿉니다(다른 곳은 편집되지 않습니다).
3. 그 파일에서 `Ctrl+Enter`로 실행합니다. 현재 사건 파일이 활성 탭이어야 합니다.
4. Terminal에서 결과를 확인합니다. 같은 파일에 다음 함수가 생기면 커서가 그 값으로 옮겨 갑니다. 한 파일이 끝나면 맨 아래 `next_file()`이 다음 파일을 알려 주고, 거기서 `Ctrl+Enter`를 누르면 그 파일이 열립니다. 마우스 없이 키보드만으로 진행할 수 있습니다.

진행은 시나리오마다 브라우저에 자동 저장되어, 새로고침하거나 다른 시나리오를 골랐다가 돌아와도 이어집니다. 처음부터 다시 하려면 `main.py`에서 `restart = True`로 실행합니다.

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
