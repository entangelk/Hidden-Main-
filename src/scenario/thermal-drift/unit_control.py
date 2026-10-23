from infra import audit, crac, power


class UnitControl:

    def resume_cooling(self):
        # @if crac3_found == True
        # CRAC-3가 03:00부터 '점검 모드'로 냉각을 멈췄다. 점검 일정은 매월 첫째 화요일 10:00뿐이다.
        # @else
        # 확인한 장치는 정상이었다. 장치 목록을 다시 보니 CRAC-3만 03:00부터 '점검 모드'다.
        # @end
        # @if fans_max == True
        # 팬을 최대로 올렸지만 R열 온도는 내려가지 않았다.
        # @end
        #
        # CRAC-3의 점검 모드를 풀려면 resume을 True로 바꾼다.
        # False면 그대로 두고 기록부터 본다.

        resume = False

        return crac.set_mode("CRAC-3", resume)

    def trace_override(self):
        # @if crac3_found == True
        # CRAC-3를 점검 모드로 바꾼 계정은 svc-facility(시설 관리 자동화 계정)다.
        # @else
        # 냉각 장치의 모드는 시설 관리 자동화 계정 svc-facility만 바꿀 수 있다.
        # @end
        # 이 계정의 모드 변경 기록을 며칠 치 볼지 days 값에 넣는다. 1~30 사이의 숫자.
        # 기간이 길수록 반복되는 패턴이 보일 수 있다.

        account = "svc-facility"

        days = 1

        return audit.mode_changes(account, days)

    def check_power(self):
        # @if pattern_found == True
        # 점검 모드가 켜지는 03:00~06:00에 R열 전력도 함께 오른다. 어느 랙인지 보자.
        # @else
        # R열이 뜨거워진 만큼 어딘가에서 전력도 더 쓰고 있을 것이다.
        # @end
        #
        # 전력 사용량을 볼 랙 이름을 rack 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "R-15" - 웹 서버
        #   "R-16" - 스토리지
        #   "R-17" - 예비 랙 (자산 대장에는 비어 있다)

        rack = "R-15"

        return power.rack_usage(rack)
