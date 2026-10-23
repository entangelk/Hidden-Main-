from infra import facility


class SublevelAccess:

    def request_access(self):
        # @if traced_b2 == True
        # 회로는 B2 동쪽 복도에서 끝난다. 그쪽 방은 출입 기록이 3년째 없다.
        # @else
        # B2 어딘가가 원인이라는 것까지만 안다.
        # @end
        #
        # B2 출입 방법을 골라 action 값을 바꾼다.
        #   1. 시설팀에 출입증을 정식으로 요청한다.
        #   2. 유지보수용 비상 코드로 문을 연다.

        floor = "B2"

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return facility.request_access(floor, action)

    def enter_room(self):
        # @if badge == True
        # 출입증으로 B2 복도 문이 열렸다.
        # @else
        # 비상 코드로 B2 복도 문을 열었다. 경보음이 짧게 울리고 멈췄다.
        # @end
        # @if spike_seen == True
        # 전력 기록: 02:14마다 B2-07 회로에서 짧은 급증이 있다.
        # @end
        # @if traced_b2 == True
        # B2 동쪽 끝 방은 "B2-07"이다.
        # @end
        #
        # 들어갈 방 번호를 room 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "B2-03" - 서쪽 창고
        #   "B2-07" - 동쪽 끝 보관실
        #   "B2-11" - 공조기계실

        room = "B2-03"
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return facility.enter(room)

    def handle_device(self):
        # @if device_found == True
        # 선반 뒤에 전원이 들어온 낡은 서버가 있다. 라벨: BACKUP-02.
        # 화면에는 02:14에 실행되는 동기화 작업 하나만 떠 있다.
        # @end
        # @if device_locked == True
        # 작업 상태: 인증 실패 — backup 계정이 잠겨 있다.
        # @end
        # @if device_found == True
        #
        # 처리 방법을 골라 action 값을 바꾼다.
        #   1. 사진과 기록을 남기고 그대로 둔다.
        #   2. 전원을 뽑는다.
        #   3. 아무것도 하지 않고 나온다.
        # @else
        # 방에는 먼지 쌓인 상자뿐이다. 02:14의 원인은 여기 없다.
        #
        # 할 일을 골라 action 값을 바꾼다.
        #   1. 빈 방을 사진으로 남긴다.
        #   2. 옆방들도 둘러본다.
        #   3. 바로 나온다.
        # @end

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return facility.handle(action)
