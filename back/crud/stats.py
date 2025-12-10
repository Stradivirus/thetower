from sqlalchemy.orm import Session
from models import BattleMain
from datetime import datetime, timedelta, timezone
from .utils import _stats_cache, CACHE_EXPIRE_MINUTES

# 1. 일간 통계
def get_weekly_stats(db: Session, user_id: int):
    cache_key = f"{user_id}_daily"
    
    if cache_key in _stats_cache:
        cache_entry = _stats_cache[cache_key]
        if (datetime.now() - cache_entry["timestamp"]) < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_entry["data"]

    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    fetch_start_date = yesterday - timedelta(days=7)
    
    reports = db.query(BattleMain)\
                .filter(BattleMain.owner_id == user_id)\
                .filter(BattleMain.battle_date >= fetch_start_date)\
                .filter(BattleMain.battle_date < now_utc)\
                .order_by(BattleMain.battle_date.asc())\
                .all()

    daily_map = {}
    for r in reports:
        date_key = r.battle_date.strftime("%Y-%m-%d")
        if date_key not in daily_map:
            daily_map[date_key] = {"coins": 0, "cells": 0}
        
        daily_map[date_key]["coins"] += (r.coin_earned or 0)
        daily_map[date_key]["cells"] += (r.cells_earned or 0)

    daily_stats = []
    display_start_date = yesterday - timedelta(days=6)
    
    target_dates = []
    for i in range(7):
        d = display_start_date + timedelta(days=i)
        target_dates.append(d.strftime("%Y-%m-%d"))

    for date_str in target_dates:
        curr_data = daily_map.get(date_str, {"coins": 0, "cells": 0})
        
        prev_date_obj = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)
        prev_date_str = prev_date_obj.strftime("%Y-%m-%d")
        prev_data = daily_map.get(prev_date_str, {"coins": 0, "cells": 0})
        
        coin_growth = 0.0
        if prev_data["coins"] > 0:
            coin_growth = (curr_data["coins"] - prev_data["coins"]) / prev_data["coins"] * 100
            
        cell_growth = 0.0
        if prev_data["cells"] > 0:
            cell_growth = (curr_data["cells"] - prev_data["cells"]) / prev_data["cells"] * 100
        
        daily_stats.append({
            "date": date_str,
            "total_coins": curr_data["coins"],
            "total_cells": curr_data["cells"],
            "coin_growth": round(coin_growth, 1),
            "cell_growth": round(cell_growth, 1)
        })

    result = {"daily_stats": daily_stats}
    _stats_cache[cache_key] = {"timestamp": datetime.now(), "data": result}
    return result

# 2. 주간 트렌드
def get_weekly_trends(db: Session, user_id: int):
    cache_key = f"{user_id}_weekly"
    
    if cache_key in _stats_cache:
        cache_entry = _stats_cache[cache_key]
        if (datetime.now() - cache_entry["timestamp"]) < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_entry["data"]

    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    fetch_start_date = yesterday - timedelta(days=63)
    
    reports = db.query(BattleMain)\
                .filter(BattleMain.owner_id == user_id)\
                .filter(BattleMain.battle_date >= fetch_start_date)\
                .filter(BattleMain.battle_date < now_utc)\
                .order_by(BattleMain.battle_date.asc())\
                .all()

    weekly_map = {}
    
    for r in reports:
        diff_days = (yesterday - r.battle_date.replace(hour=0,minute=0,second=0,microsecond=0)).days
        if diff_days < 0: continue
        
        week_idx = diff_days // 7
        end_date = yesterday - timedelta(days=week_idx * 7)
        start_date = end_date - timedelta(days=6)
        
        key = start_date.strftime("%Y-%m-%d")
        
        if key not in weekly_map:
            weekly_map[key] = {"coins": 0, "cells": 0}
            
        weekly_map[key]["coins"] += (r.coin_earned or 0)
        weekly_map[key]["cells"] += (r.cells_earned or 0)

    trend_stats = []
    target_weeks = []
    for i in range(8):
        week_idx = 7 - i
        end_date = yesterday - timedelta(days=week_idx * 7)
        start_date = end_date - timedelta(days=6)
        target_weeks.append(start_date.strftime("%Y-%m-%d"))

    for week_str in target_weeks:
        curr_data = weekly_map.get(week_str, {"coins": 0, "cells": 0})
        
        prev_date_obj = datetime.strptime(week_str, "%Y-%m-%d") - timedelta(days=7)
        prev_week_str = prev_date_obj.strftime("%Y-%m-%d")
        prev_data = weekly_map.get(prev_week_str, {"coins": 0, "cells": 0})
        
        coin_growth = 0.0
        if prev_data["coins"] > 0:
            coin_growth = (curr_data["coins"] - prev_data["coins"]) / prev_data["coins"] * 100
            
        cell_growth = 0.0
        if prev_data["cells"] > 0:
            cell_growth = (curr_data["cells"] - prev_data["cells"]) / prev_data["cells"] * 100
            
        trend_stats.append({
            "week_start_date": week_str,
            "total_coins": curr_data["coins"],
            "total_cells": curr_data["cells"],
            "coin_growth": round(coin_growth, 1),
            "cell_growth": round(cell_growth, 1)
        })

    result = {"weekly_stats": trend_stats}
    _stats_cache[cache_key] = {"timestamp": datetime.now(), "data": result}
    return result