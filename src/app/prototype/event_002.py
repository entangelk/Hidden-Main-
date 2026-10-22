from incidents import trace


class TrafficTrace:

    def trace_source(self):
        # 전송 기록을 따라가자 같은 내부 주소가 반복해서 나타난다.
        # 10.0.2.14 — 자산 목록에 없는 주소다.
        #
        # 다음 조치를 골라 action 값을 바꾼 뒤 Ctrl+Enter로 실행한다.
        #   1. 내부 주소의 위치를 추적한다.
        #   2. 기록을 보존하고 보안팀에 보고한다.

        source = "10.0.2.14"

        action = 1

        return trace.follow(source, action)
