from infra import auth, logs


class SecurityAudit:

    def audit_logins(self):
        # @if notified == True
        # 보안팀 답장: "지금은 인원이 없다. 계정 감사는 직접 진행해 달라."
        # @else
        # 보안팀에는 아직 알리지 않았다.
        # @end
        #
        # 02:13 전후로 로그인한 계정은 셋이다. 감사할 계정 이름을 target 값에 넣는다.
        # 큰따옴표까지 그대로 쓴다. 예: target = "guest"
        #   "admin"  - 관리자 계정
        #   "backup" - 백업 전용 계정
        #   "guest"  - 방문자 계정
        # 기회는 2번이다. 찾지 못하면 다른 값으로 다시 실행할 수 있다.

        window = "02:10-02:20"

        target = "admin"
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return auth.audit(target, window)

    def review_access(self):
        # @if backup_suspect == True
        # backup 계정이 02:13에 내부 주소 10.0.2.14에서 로그인했다.
        # 백업 서버는 3년 전에 폐기되었고, 계정만 남아 있었다.
        #
        # 계정 처리 방법을 골라 action 값을 바꾼다.
        #   1. backup 계정을 잠근다.
        #   2. 잠그지 않고 감시만 한다.
        # @else
        # 감사한 계정에서는 특이점이 없었다. 로그인 기록만 보관된다.
        #
        # 다음 조치를 골라 action 값을 바꾼다.
        #   1. 계정 정책만 다시 확인한다.
        #   2. 전체 계정에 감시 규칙을 건다.
        # @end

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return auth.apply_policy(action)

    def preserve_logs(self):
        # 로그는 매일 03:00에 지워진다(보존 기간 1일).
        # 지금 보존해 두지 않으면 오늘 새벽 기록은 사라진다.
        # 보존하려면 keep_logs를 True로 바꾼다.

        retention_days = 1

        keep_logs = False
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return logs.snapshot(keep_logs)
