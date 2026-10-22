from infra import reporting


class CaseReport:

    def draft_report(self):
        # @if device_found == True
        # 확인한 사실: 폐기된 서버 BACKUP-02가 B2-07에서 매일 02:14에 외부로 데이터를 보냈다.
        # @else
        # 확인한 사실: 02:14 전송의 출처는 끝내 찾지 못했다.
        # @end
        # @if logs_kept == True
        # 보존한 로그가 근거로 첨부된다.
        # @else
        # 03:00에 로그가 지워져 근거 자료가 없다.
        # @end
        #
        # 보고서에 무엇을 쓸지 고른다.
        #   1. 확인한 사실을 그대로 쓴다.
        #   2. "일시적 네트워크 장애"로 정리한다.

        case_id = "INC-0214"

        action = 1

        return reporting.draft(case_id, action)

