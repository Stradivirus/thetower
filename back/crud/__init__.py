from .user import get_user_by_username, create_user, count_users
from .game_data import get_user_progress, update_user_progress, get_user_modules, update_user_modules
from .report import (
    create_battle_record, 
    get_recent_reports, 
    get_history_reports, 
    get_full_report, 
    get_cutoff_date, 
    count_reports,
    delete_battle_record 
)
from .stats import get_weekly_stats, get_weekly_trends