from infra import thermal, crac


class ThermalMonitor:

    def check_alarm(self):
        # [토요일 03:40] 서버실 온도 경보가 울렸다. 평소 24도인 실내가 31도까지 올랐다.
        # 33도를 넘으면 서버가 스스로 꺼지기 시작한다.
        #
        # 먼저 할 일을 골라 action 값을 바꾼 뒤 Ctrl+Enter로 실행한다.
        #   1. 열 지도를 띄워 어디가 뜨거운지 본다.
        #   2. 전체 팬 속도를 최대로 올린다.
        #   3. 센서 오류로 보고 경보를 끈다.

        room_temp = 31.2

        action = 1

        return thermal.respond(action)

    def inspect_unit(self):
        # @if mapped == True
        # 뜨거운 곳은 R열 뒤쪽이다. R열을 맡는 냉각 장치는 config/facility.py에 있다.
        # @else
        # 어디가 뜨거운지는 아직 모른다. 냉각 장치는 세 대이고, 맡는 구역은 config/facility.py에 있다.
        # @end
        #
        # 상태를 확인할 냉각 장치 이름을 unit 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "CRAC-1"
        #   "CRAC-2"
        #   "CRAC-3"

        unit = "CRAC-1"

        return crac.status(unit)
