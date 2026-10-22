from incidents import monitor


class IncidentResponder:

    def triage_alert(self):
        # [02:14] 모니터링 시스템이 비정상 트래픽을 감지했다.
        # 서버 한 대가 새벽 시간에 외부로 대량의 데이터를 보내고 있다.
        #
        # 대응 방법을 골라 action 값을 바꾼 뒤 Ctrl+Enter로 실행한다.
        #   1. 접근 기록을 분석한다.
        #   2. 해당 서버를 네트워크에서 격리한다.
        #   3. 경보를 무시한다.

        alert_id = 2048
        severity = 0.73

        action = 1

        if severity >= 0.65:
            return monitor.dispatch(alert_id, action)

        return monitor.ignore(alert_id)


if __name__ == "__main__":
    IncidentResponder().triage_alert()
