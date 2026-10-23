from infra import lab, phone


class Decision:

    def make_call(self):
        # @if lumen_found == True
        # LUMEN 시료는 2년 전에 '폐기 완료'로 기록됐다. 그런데 4번 챔버에서 아직 자라고 있다.
        # @else
        # run-0이 어떤 프로젝트의 실험인지는 끝내 확인하지 못했다.
        # @end
        #
        # 날이 밝기 전에 연락할 사람을 who 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "director" - 연구소장
        #   "dr_han"   - 한서윤 박사 (2년 전 퇴사한 수석 연구원)
        #   "nobody"   - 아무에게도 연락하지 않는다

        who = "nobody"
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return phone.call(who)

    def decide(self):
        # @if samples_alive == True
        # 4번 챔버의 시료 12개 중 11개가 살아 있다.
        # @else
        # 시료가 살아 있는지는 확인하지 않았다.
        # @end
        # @if testimony == True
        # 한서윤 박사는 시료만은 살려 두고 싶었다고 했다. 기록을 속인 건 자기 책임이라고.
        # @end
        # @if director_told == True
        # 소장은 아침까지 결정을 기다리겠다고 했다.
        # @end
        #
        # 시료를 어떻게 할지 골라 action 값을 바꾼다.
        #   1. 시료를 보존하고, 있었던 일을 그대로 실험 대장에 올린다.
        #   2. 기록대로 시료를 폐기하고 run-0을 지운다.

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return lab.close_case("LAB-0120", action)
