# Incident Workspace
#
# 야간 당직 개발자용 사건 대응 저장소.
# 처리할 사건 파일은 incidents/ 폴더에 생긴다.
#
# 사용법:
#   1. 사건 파일을 열고 함수 위의 주석을 읽는다.
#   2. 밑줄 친 값(예: action = 1)만 바꿀 수 있다.
#   3. Ctrl+Enter(macOS는 Cmd+Enter)로 실행하고 아래 터미널을 본다.
#
# 첫 사건: incidents/event_001.py

from incidents import event_001


def main():
    event_001.IncidentMonitor().triage_alert()


if __name__ == "__main__":
    main()
