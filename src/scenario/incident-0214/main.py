# Incident Workspace
#
# 야간 당직 개발자용 사건 대응 저장소.
# 처리할 사건 파일은 incidents/ 폴더에 순번(01_, 02_, ...)을 붙여 생긴다.
# 한 파일의 사건이 끝나면 그 파일 맨 아래에 다음 파일 안내가 붙는다.
#
# 사용법:
#   1. 사건 파일을 열고 함수 위의 주석을 읽는다.
#   2. 밑줄 친 값(예: action = 1)만 바꿀 수 있다.
#   3. Ctrl+Enter(macOS는 Cmd+Enter)로 실행하고 아래 터미널을 본다.
#
# 첫 사건: incidents/01_event_001.py

import importlib


def main():
    event_001 = importlib.import_module("incidents.01_event_001")
    event_001.IncidentMonitor().triage_alert()


if __name__ == "__main__":
    main()
