# Incident Workspace
#
# 야간 당직 개발자용 사건 대응 저장소.
#
# 사용법:
#   1. 아래 select_scenario()에서 scenario 값을 고르고 Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.
#   2. 사건 파일이 Explorer에 순번(01_, 02_, ...)을 붙여 생긴다. 함수 위의 주석을 읽는다.
#   3. 밑줄 친 값(예: action = 1)만 바꿀 수 있다. 그 파일에서 Ctrl+Enter로 실행하고 아래 터미널을 본다.
#   4. 한 파일의 사건이 끝나면 마지막 사건 함수 아래에 다음 파일 안내(next_file)가 붙는다.

from infra import workspace


def select_scenario():
    # 시나리오를 골라 scenario 값을 그 번호로 바꾼다.
    # {scenarios}
    #
    # 진행은 시나리오마다 따로 저장된다. 다른 시나리오를 골랐다가 돌아와도 이어서 한다.
    # 처음부터 다시 하려면 restart를 True로 바꾼다. 고른 시나리오의 저장이 지워진다.

    scenario = 1
    restart = False
    # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

    return workspace.load(scenario, restart)


if __name__ == "__main__":
    select_scenario()
