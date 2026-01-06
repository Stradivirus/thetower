# back/crud/stats.py
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import BattleMain, DailyStats
from datetime import datetime, timedelta, timezone

# 헬퍼 함수
def get_yesterday():
    """UTC 기준 어제 자정 (naive datetime)"""
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    return now_utc - timedelta(days=1)

def calculate_and_upsert_daily_stat(db: Session, user_id: int, target_dt: datetime):
    target_date = target_dt.date()
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = start_of_day + timedelta(days=1)

    agg = db.query(
        func.sum(BattleMain.coin_earned).label("total_coins"),
        func.sum(BattleMain.cells_earned).label("total_cells"),
        func.sum(BattleMain.reroll_shards_earned).label("total_shards"),
        func.count(BattleMain.battle_date).label("game_count")
    ).filter(
        BattleMain.owner_id == user_id,
        BattleMain.battle_date >= start_of_day,
        BattleMain.battle_date < end_of_day
    ).first()

    if not agg or agg.game_count == 0:
        db.query(DailyStats).filter(
            DailyStats.owner_id == user_id,
            DailyStats.target_date == target_date
        ).delete()
        db.commit()
        return

    stat_record = db.query(DailyStats).filter(
        DailyStats.owner_id == user_id,
        DailyStats.target_date == target_date
    ).first()

    if not stat_record:
        stat_record = DailyStats(owner_id=user_id, target_date=target_date)
        db.add(stat_record)
    
    stat_record.total_coins = agg.total_coins or 0
    stat_record.total_cells = agg.total_cells or 0
    stat_record.total_shards = agg.total_shards or 0
    stat_record.game_count = agg.game_count or 0
    
    db.commit()

# 1. 일간 통계 (8일치 조회 후 7일 표시)
def get_weekly_stats(db: Session, user_id: int):
    yesterday = get_yesterday()
    yesterday_date = yesterday.date()
    
    # 화면 표시: D-6 ~ D-0 (7일)
    # 데이터 조회: D-7 ~ D-0 (8일) -> 첫 날 성장률 계산용
    display_start_date = yesterday_date - timedelta(days=6)
    fetch_start_date = yesterday_date - timedelta(days=7) 
    
    stats = db.query(DailyStats).filter(
        DailyStats.owner_id == user_id,
        DailyStats.target_date >= fetch_start_date,
        DailyStats.target_date <= yesterday_date
    ).order_by(DailyStats.target_date.asc()).all()
    
    stats_map = {s.target_date.strftime("%Y-%m-%d"): s for s in stats}
    
    daily_stats = []
    
    # D-7 (화면에 안 나오는 1일 전 데이터)를 초기 prev 값으로 세팅
    start_prev_date_str = fetch_start_date.strftime("%Y-%m-%d")
    start_prev_stat = stats_map.get(start_prev_date_str)
    
    prev_coins = start_prev_stat.total_coins if start_prev_stat else 0
    prev_cells = start_prev_stat.total_cells if start_prev_stat else 0
    
    # 루프는 D-6 (화면에 나오는 첫 날) 부터 7일간
    for i in range(7):
        current_date = display_start_date + timedelta(days=i)
        date_str = current_date.strftime("%Y-%m-%d")
        stat = stats_map.get(date_str)
        
        total_coins = stat.total_coins if stat else 0
        total_cells = stat.total_cells if stat else 0
        
        coin_growth = 0.0
        cell_growth = 0.0
        
        if prev_coins > 0:
            coin_growth = round(((total_coins - prev_coins) / prev_coins * 100), 1)
        if prev_cells > 0:
            cell_growth = round(((total_cells - prev_cells) / prev_cells * 100), 1)
            
        daily_stats.append({
            "date": date_str,
            "total_coins": total_coins,
            "total_cells": total_cells,
            "coin_growth": coin_growth,
            "cell_growth": cell_growth
        })
        
        prev_coins = total_coins
        prev_cells = total_cells

    return {"daily_stats": daily_stats}

# 2. 주간 트렌드 (어제 기준 9주 조회 후 8주 표시)
def get_weekly_trends(db: Session, user_id: int):
    yesterday = get_yesterday()
    yesterday_date = yesterday.date()
    
    # 어제로부터 9주 전 (63일 전)
    start_date = yesterday_date - timedelta(days=63)
    
    # 어제부터 7일씩 역산하여 주차 번호 부여하는 SQL
    sql = text("""
        SELECT 
            TO_CHAR(
                :yesterday_date - (FLOOR((:yesterday_date - target_date) / 7) * INTERVAL '7 days'),
                'YYYY-MM-DD'
            ) as week_start,
            SUM(total_coins) as coins,
            SUM(total_cells) as cells
        FROM daily_stats
        WHERE owner_id = :user_id
          AND target_date >= :start_date
          AND target_date <= :end_date
        GROUP BY FLOOR((:yesterday_date - target_date) / 7)
        ORDER BY FLOOR((:yesterday_date - target_date) / 7) DESC
        LIMIT 9
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "yesterday_date": yesterday_date,
        "start_date": start_date,
        "end_date": yesterday_date
    }).fetchall()
    
    trend_stats = []
    prev_coins = 0
    prev_cells = 0
    
    # 결과가 최신순(DESC)으로 정렬되어 있으므로 역순으로 처리
    results_asc = list(reversed(results))
    
    for i, row in enumerate(results_asc):
        curr_coins = row.coins or 0
        curr_cells = row.cells or 0
        
        # 첫 번째 데이터(가장 오래된 1주)는 prev 설정용으로만 쓰고 건너뜀
        if i == 0:
            prev_coins = curr_coins
            prev_cells = curr_cells
            continue
        
        # 두 번째 데이터부터 리스트에 추가 (성장률 계산 가능)
        c_growth = 0.0
        if prev_coins > 0:
            c_growth = round(((curr_coins - prev_coins) / prev_coins * 100), 1)
        cl_growth = 0.0
        if prev_cells > 0:
            cl_growth = round(((curr_cells - prev_cells) / prev_cells * 100), 1)
            
        trend_stats.append({
            "week_start_date": row.week_start,
            "total_coins": curr_coins,
            "total_cells": curr_cells,
            "coin_growth": c_growth,
            "cell_growth": cl_growth
        })
        
        prev_coins = curr_coins
        prev_cells = curr_cells
        
    return {"weekly_stats": trend_stats}

# 3. 월간 트렌드 (7개월 조회 후 6개월 표시)
def get_monthly_trends(db: Session, user_id: int):
    now_utc = datetime.now(timezone.utc)
    this_month_str = now_utc.strftime("%Y-%m")
    # 6개월치를 보여주려면 +1개월 더 가져와야 함 (약 240일 전)
    start_date = (now_utc.replace(day=1) - timedelta(days=240)).date()
    
    sql = text("""
        SELECT 
            TO_CHAR(target_date, 'YYYY-MM') as month_str,
            SUM(total_coins) as coins,
            SUM(total_cells) as cells
        FROM daily_stats
        WHERE owner_id = :user_id
          AND target_date >= :start_date
        GROUP BY TO_CHAR(target_date, 'YYYY-MM')
        ORDER BY month_str ASC
        LIMIT 7
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "start_date": start_date
    }).fetchall()
    
    trend_stats = []
    prev_coins = 0
    prev_cells = 0
    
    for i, row in enumerate(results):
        curr_coins = row.coins or 0
        curr_cells = row.cells or 0
        
        # 첫 번째 데이터는 prev 설정용으로만 사용
        if i == 0:
            prev_coins = curr_coins
            prev_cells = curr_cells
            continue
            
        c_growth = 0.0
        if prev_coins > 0:
            c_growth = round(((curr_coins - prev_coins) / prev_coins * 100), 1)
        cl_growth = 0.0
        if prev_cells > 0:
            cl_growth = round(((curr_cells - prev_cells) / prev_cells * 100), 1)
            
        trend_stats.append({
            "month": row.month_str,
            "total_coins": curr_coins,
            "total_cells": curr_cells,
            "coin_growth": c_growth,
            "cell_growth": cl_growth,
            "is_current": (row.month_str == this_month_str)
        })
        prev_coins = curr_coins
        prev_cells = curr_cells
        
    return {"monthly_stats": trend_stats}