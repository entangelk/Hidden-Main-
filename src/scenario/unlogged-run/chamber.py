from infra import chambers, microscope, registry


class ChamberMonitor:

    def read_chamber(self):
        # @if halted == True
        # run-0을 멈추자 배양 챔버 한 곳에서 영양액 공급 경보가 울렸다.
        # @else
        # run-0이 무엇을 키우고 있는지 보려면 챔버를 확인해야 한다.
        # @end
        #
        # 배양 챔버는 4대다. 들여다볼 챔버 번호를 chamber 값에 넣는다. 1~4 사이의 정수.

        chamber = 1

        return chambers.read(chamber)

    def scan_samples(self):
        # @if chamber_found == True
        # 4번 챔버의 'LMN' 용기 12개. 살아 있는지 보려면 현미경 스캔을 돌려야 한다.
        # @else
        # 어느 챔버인지 확실하지 않지만, 챔버 4대 전체 스캔은 돌릴 수 있다.
        # @end
        #
        # 스캔을 돌리려면 scan을 True로 바꾼다. 스캔 중에는 챔버 문이 잠긴다.

        scan = False

        return microscope.scan(scan)

    def check_project(self):
        # @if owner_traced == True
        # run-0은 퇴사한 한서윤 박사의 단말에서 등록됐다. 박사가 이끌던 프로젝트를 찾아보자.
        # @else
        # 용기 라벨 'LMN'이 어떤 프로젝트의 약자인지 찾아보자. 목록은 config/lab.py에 있다.
        # @end
        #
        # 조회할 프로젝트 이름을 project 값에 넣는다. 큰따옴표까지 그대로 쓴다.
        #   "ARGO"  - 효소 연구
        #   "TIDE"  - 해양 미생물 연구
        #   "LUMEN" - 재생 세포 연구

        project = "ARGO"

        return registry.lookup(project)
