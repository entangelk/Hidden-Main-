from infra import audit, scheduler


class Scheduler:

    def check_queue(self):
        # [일요일 01:20] 연구소 자동화 스케줄러에서 처음 보는 작업이 돌고 있다.
        # 작업 이름은 run-0. 실험 대장에는 이런 실험이 등록돼 있지 않다.
        #
        # 먼저 할 일을 골라 action 값을 바꾼 뒤 Ctrl+Enter로 실행한다.
        #   1. 작업 대기열을 자세히 본다.
        #   2. run-0을 즉시 멈춘다.
        #   3. 테스트 작업으로 보고 넘어간다.

        job = "run-0"

        action = 1
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return scheduler.handle(job, action)

    def find_owner(self):
        # @if queue_read == True
        # run-0은 2년 전부터 매일 01:00에 돈다. 작성자 칸이 비어 있다.
        # 사람이 직접 등록했다면 작성자 칸이 채워졌을 것이다.
        # @else
        # run-0이 언제부터 있었는지는 모른다. 실행 계정부터 찾아보자.
        # @end
        #
        # 실행 기록을 조회할 계정 이름을 account 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "svc-lab" - 자동화 스케줄러 서비스 계정
        #   "kim.jh"  - 야간 담당 연구원
        #   "admin"   - 시스템 관리자

        account = "kim.jh"
        # Ctrl+Enter(macOS는 Cmd+Enter)로 실행한다.

        return audit.jobs_by(account)
