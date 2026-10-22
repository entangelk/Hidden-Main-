from infra import facility


class SublevelAccess:

    def request_access(self):
        # @if traced_b2 == True
        # 회로는 B2 동쪽 복도에서 끝난다. 그쪽 방은 출입 기록이 3년째 없다.
        # @else
        # B2 어딘가가 원인이라는 것까지만 안다.
        # @end
        #
        # B2 출입 방법을 고른다.
        #   1. 시설팀에 출입증을 정식으로 요청한다.
        #   2. 유지보수용 비상 코드로 문을 연다.

        floor = "B2"

        action = 1

        return facility.request_access(floor, action)

    def enter_room(self):
        # @if spike_seen == True
        # 전력 기록: 02:14마다 B2-07 회로에서 짧은 급증이 있다.
        # @end
        # @if traced_b2 == True
        # B2 동쪽 끝 방은 "B2-07"이다.
        # @end
        #
        # 들어갈 방을 room에 넣는다.
        #   "B2-03" - 서쪽 창고
        #   "B2-07" - 동쪽 끝, 폐기 장비 보관실
        #   "B2-11" - 공조기계실

        room = "B2-03"

        return facility.enter(room)

    def handle_device(self):
        # @if device_found == True
        # 선반 뒤에 전원이 들어온 낡은 서버가 있다. 라벨: BACKUP-02.
        # 화면에는 02:14에 실행되는 동기화 작업 하나만 떠 있다.
        # @else
        # 방에는 먼지 쌓인 상자뿐이다. 02:14의 원인은 여기 없다.
        # @end
        #
        # 처리 방법을 고른다.
        #   1. 사진과 기록을 남기고 그대로 둔다.
        #   2. 전원을 뽑는다.
        #   3. 아무것도 하지 않고 나온다.

        action = 1

        return facility.handle(action)
