from incidents import reporting


class CaseReport:

    def write_report(self):
        # @if isolated == True
        # 서버는 격리되었다. 남은 일은 보고서를 쓰는 것이다.
        # @else
        # 서버는 아직 연결되어 있다. 보고서를 쓰는 동안에도 전송이 이어진다.
        # @end
        #
        # 보고 방식을 골라 action 값을 바꾼다.
        #   1. 사건을 종결로 보고한다.
        #   2. 상위 부서로 넘긴다.

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return reporting.submit(action)
