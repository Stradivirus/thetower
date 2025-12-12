# back/crud/stats.py
from sqlalchemy.orm import Session
from sqlalchemy import func, literal
from models import BattleMain
from datetime import datetime, timedelta, timezone

# [New] 헬퍼 함수 - 시간 계산 중복 제거
def get_yesterday():
    """UTC 기준 어제 자정 (naive datetime)"""
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    return now_utc - timedelta(days=1)

# 1. 일간 통계
def get_weekly_stats(db: Session, user_id: int):
    yesterday = get_yesterday()
    fetch_start_date = yesterday - timedelta(days=7)
    
    # [Optimized] DB 레벨에서 날짜별 그룹화 및 합계 계산
    results = db.query(
        func.to_char(BattleMain.battle_date, 'YYYY-MM-DD').label('date_str'),
        func.sum(BattleMain.coin_earned).label('total_coins'),
        func.sum(BattleMain.cells_earned).label('total_cells')
    ).filter(
        BattleMain.owner_id == user_id,
        BattleMain.battle_date >= fetch_start_date,
        BattleMain.battle_date < (yesterday + timedelta(days=1))
    ).group_by(
        func.to_char(BattleMain.battle_date, 'YYYY-MM-DD')
    ).all()

    # DB 결과를 딕셔너리로 변환 (빠른 조회를 위해)
    daily_map = {
        r.date_str: {"coins": r.total_coins or 0, "cells": r.total_cells or 0}
        for r in results
    }

    daily_stats = []
    display_start_date = yesterday - timedelta(days=6)
    
    # 표시할 날짜 리스트 생성 (과거 -> 최신)
    target_dates = []
    for i in range(7):
        d = display_start_date + timedelta(days=i)
        target_dates.append(d.strftime("%Y-%m-%d"))

    for date_str in target_dates:
        curr_data = daily_map.get(date_str, {"coins": 0, "cells": 0})
        
        # 전일 데이터 조회 (성장률 계산용)
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

    return {"daily_stats": daily_stats}

# 2. 주간 트렌드
def get_weekly_trends(db: Session, user_id: int):
    yesterday = get_yesterday()
    fetch_start_date = yesterday - timedelta(days=63)
    
    # [Optimized] DB에서 주차 계산 및 그룹화
    # PostgreSQL에서 날짜 차이를 초 단위로 계산
    results = db.query(
        func.floor(
            func.extract('epoch', literal(yesterday) - BattleMain.battle_date) / (7 * 86400)
        ).label('week_offset'),
        func.sum(BattleMain.coin_earned).label('total_coins'),
        func.sum(BattleMain.cells_earned).label('total_cells')
    ).filter(
        BattleMain.owner_id == user_id,
        BattleMain.battle_date >= fetch_start_date,
        BattleMain.battle_date < (yesterday + timedelta(days=1))
    ).group_by('week_offset').all()

    # 주차별 데이터 맵 생성
    weekly_map = {}
    for r in results:
        week_idx = int(r.week_offset)
        end_date = yesterday - timedelta(days=week_idx * 7)
        start_date = end_date - timedelta(days=6)
        key = start_date.strftime("%Y-%m-%d")
        
        weekly_map[key] = {
            "coins": r.total_coins or 0,
            "cells": r.total_cells or 0
        }

    trend_stats = []
    target_weeks = []
    
    # 최근 8주 목록 생성
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

    return {"weekly_stats": trend_stats}