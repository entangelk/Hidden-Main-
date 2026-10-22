from infra import power


class PowerControl:

    def inspect_power(self):
        # @if isolated == True
        # db-07은 격리했는데도 지하 2층(B2) 회로의 전력 사용량이 그대로다.
        # @else
        # 같은 시각, 지하 2층(B2) 회로의 전력 사용량도 함께 올라갔다.
        # @end
        # B2는 도면상 창고와 폐기 장비 보관실뿐이다.
        #
        # 조사 방법을 고른다.
        #   1. B2 회로를 따라가 어느 방인지 찾는다.
        #   2. 무정전 전원장치(UPS) 기록만 확인한다.
        #   3. B2 차단기를 내린다.

        circuit = "B2-EAST"

        action = 1

        return power.inspect(circuit, action)

    def set_limit(self):
        # 전력 경보 기준(%)을 정한다. 기본값 50이면 큰 급증만 잡힌다.
        # limit를 0~100 사이로 바꾼다. 낮출수록 작은 변화도 기록한다.

        sample_rate = 60

        limit = 50

        return power.set_alert_threshold(limit)
