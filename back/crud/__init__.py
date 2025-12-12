from .user import (
    get_user_by_username, 
    create_user, 
    count_users
)

# [Report 관련] 
from .report import (
    create_battle_record,
    count_reports,
    get_recent_reports,
    get_history_reports,
    get_full_report,
    delete_battle_record,
    get_history_view,       # [New] 기록실 뷰 (최적화)
    get_reports_by_month    # [New] 월별 상세 (Lazy Load)
)

# [Stats 관련]
# 최적화된 통계 함수들
from .stats import (
    get_weekly_stats,
    get_weekly_trends
)

# [Game Data 관련]
# 게임 데이터(모듈, 진행도 등) 관련 CRUD
from .game_data import *