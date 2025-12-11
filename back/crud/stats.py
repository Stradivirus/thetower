from sqlalchemy.orm import Session
from sqlalchemy import func
from models import BattleMain
from datetime import datetime, timedelta, timezone

# 캐시 관련 로직 및 변수는 DB 집계 최적화로 인해 불필요하므로 제거함

# 1. 일간 통계
def get_weekly_stats(db: Session, user_id: int):
    # 시간 기준 설정
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    # 7일치 데이터를 보여주기 위해, 성장률 계산용 하루 전 데이터까지 포함하여 약 8일 전부터 조회
    fetch_start_date = yesterday - timedelta(days=7)
    
    # [Optimized] DB 레벨에서 날짜별 그룹화 및 합계 계산
    # func.to_char는 PostgreSQL 기준입니다. SQLite 사용 시 func.strftime('%Y-%m-%d', ...) 등으로 변경 필요
    results = db.query(
        func.to_char(BattleMain.battle_date, 'YYYY-MM-DD').label('date_str'),
        func.sum(BattleMain.coin_earned).label('total_coins'),
        func.sum(BattleMain.cells_earned).label('total_cells')
    ).filter(
        BattleMain.owner_id == user_id,
        BattleMain.battle_date >= fetch_start_date,
        BattleMain.battle_date < now_utc
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
    # 시간 기준 설정
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    # 8주치 데이터를 보여주기 위해 넉넉하게 약 9주(63일) 전부터 조회
    fetch_start_date = yesterday - timedelta(days=63)
    
    # [Optimized] 여기서도 일별 집계만 DB에서 가져옴 (수천 개 row -> 수십 개 row로 감소)
    # 주 단위 그룹화는 "어제" 기준으로 동적으로 변하므로 Python에서 처리하는 것이 효율적임
    results = db.query(
        func.to_char(BattleMain.battle_date, 'YYYY-MM-DD').label('date_str'),
        func.sum(BattleMain.coin_earned).label('total_coins'),
        func.sum(BattleMain.cells_earned).label('total_cells')
    ).filter(
        BattleMain.owner_id == user_id,
        BattleMain.battle_date >= fetch_start_date,
        BattleMain.battle_date < now_utc
    ).group_by(
        func.to_char(BattleMain.battle_date, 'YYYY-MM-DD')
    ).all()

    # 일별 데이터를 맵으로 변환
    daily_map = {
        r.date_str: {"coins": r.total_coins or 0, "cells": r.total_cells or 0}
        for r in results
    }

    weekly_map = {}
    
    # DB에서 가져온 일별 데이터를 "어제 기준 주간"으로 묶기
    # fetch_start_date부터 yesterday까지 날짜를 순회
    current_iter_date = fetch_start_date
    while current_iter_date < now_utc:
        date_str = current_iter_date.strftime("%Y-%m-%d")
        
        # 어제와의 날짜 차이 계산
        diff_days = (yesterday - current_iter_date).days
        if diff_days >= 0:
            week_idx = diff_days // 7
            
            # 해당 주차의 시작일과 종료일 계산 (키 값 생성을 위해)
            end_date = yesterday - timedelta(days=week_idx * 7)
            start_date = end_date - timedelta(days=6)
            key = start_date.strftime("%Y-%m-%d")
            
            if key not in weekly_map:
                weekly_map[key] = {"coins": 0, "cells": 0}
            
            # 해당 날짜에 데이터가 있다면 더하기
            if date_str in daily_map:
                weekly_map[key]["coins"] += daily_map[date_str]["coins"]
                weekly_map[key]["cells"] += daily_map[date_str]["cells"]
        
        current_iter_date += timedelta(days=1)

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