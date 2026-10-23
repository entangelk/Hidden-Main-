from infra import alerts, scheduler, notify


class IncidentMonitor:

    def triage_alert(self):
        # [02:14] 모니터링 시스템이 경보를 올렸다.
        # 서버 db-07이 새벽 시간에 외부로 대량의 데이터를 보내고 있다.
        #
        # 대응 방법을 골라 action 값을 바꾼 뒤 Ctrl+Enter로 실행한다.
        #   1. 접근 기록을 분석한다.
        #   2. db-07을 네트워크에서 격리한다.
        #   3. 오탐으로 보고 경보를 끈다.

        alert_id = 2048
        severity = 0.73

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        if severity >= 0.65:
            return alerts.dispatch(alert_id, action)

        return alerts.silence(alert_id)

    def check_schedule(self):
        # @if analyzed == True
        # 접근 기록의 출발지는 10.0.2.14. 설정 파일의 등록 대역에 없는 주소다.
        # @else
        # 출발지는 아직 모른다. 전송이 매일 같은 시각에 있었는지부터 보자.
        # @end
        #
        # 예약 작업 목록을 시간 단위로 볼 수 있다.
        # hour 값을 0~23 사이의 정수(시)로 바꾸고 실행하면 그 시간대의 작업을 조회한다.
        # 기회는 3번이다. 찾지 못하면 다른 값으로 다시 실행할 수 있다.

        hour = 0
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return scheduler.list_jobs(hour)

    def escalate(self):
        # @if cron_found == True
        # 02:00대에 담당자가 없는 작업 "sync_b2"가 매일 돌고 있었다.
        # @end
        #
        # 보안팀에 지금 알릴지 정한다.
        # 알리려면 notify_security를 True로 바꾼다. False면 혼자 조사를 계속한다.

        notify_security = False
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return notify.security(notify_security)
