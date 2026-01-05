# back/crud/__init__.py
from .user import (
    get_user_by_username,
    create_user,
    get_users,
    get_active_user_count
)
from .game_data import (
    get_user_progress,
    update_user_progress,
    get_user_modules,
    update_user_modules
)
from .report import (
    create_battle_record,
    count_reports,
    get_recent_reports,
    get_history_reports,
    get_history_view,
    get_reports_by_month,
    get_full_report,
    delete_battle_record
)
from .stats import (
    get_weekly_stats,
    get_weekly_trends,
    get_monthly_trends,
    calculate_and_upsert_daily_stat
)