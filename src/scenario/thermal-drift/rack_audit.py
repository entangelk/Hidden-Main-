from infra import racks, report


class RackAudit:

    def open_rack(self):
        # @if rig_suspect == True
        # 비어 있어야 할 R-17이 한도(6kW)를 넘는 전력을 쓰고 있다.
        # @else
        # 어느 랙이 원인인지는 확실하지 않다. 자산 대장상 비어 있는 R-17이 마음에 걸린다.
        # @end
        #
        # 할 일을 골라 action 값을 바꾼다.
        #   1. R-17 문을 열고 안을 확인한다.
        #   2. 랙은 건드리지 않고 온도만 지켜본다.

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return racks.inspect("R-17", action)

    def file_report(self):
        # @if rig_found == True
        # 확인한 사실: R-17에 자산 대장에 없는 GPU 서버 4대가 외부 회선에 연결돼 돌고 있었다.
        # @else
        # 확인한 사실: CRAC-3가 일정에 없던 점검 모드였다. 원인은 확인하지 못했다.
        # @end
        # @if pattern_found == True
        # svc-facility 계정이 6주째 매주 토요일 03:00에 CRAC-3를 점검 모드로 바꿔 왔다.
        # @end
        # @if cooling_resumed == True
        # 냉각은 복구됐고 실내 온도는 정상으로 돌아오고 있다.
        # @else
        # CRAC-3는 아직 점검 모드다. 06:00에 저절로 풀린다.
        # @end
        #
        # 보고서를 보낼 곳을 recipient 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "facility" - 시설팀 (svc-facility 계정을 관리하는 곳)
        #   "security" - 보안팀
        #   "none"     - 보고하지 않는다

        recipient = "facility"
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return report.send("INC-0340", recipient)
