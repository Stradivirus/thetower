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

# [수정됨] 내부 db.commit() 모두 제거
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

    # 데이터가 없으면 통계 삭제 (Flush 상태 유지, 커밋 X)
    if not agg or agg.game_count == 0:
        db.query(DailyStats).filter(
            DailyStats.owner_id == user_id,
            DailyStats.target_date == target_date
        ).delete()
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
    
    # 여기서 db.commit() 하지 않음!

# 2. 일간 통계 조회 (Window Function 최적화)
def get_weekly_stats(db: Session, user_id: int):
    yesterday = get_yesterday()
    yesterday_date = yesterday.date()
    
    display_start_date = yesterday_date - timedelta(days=6)
    fetch_start_date = yesterday_date - timedelta(days=7) 

    sql = text("""
        WITH daily_totals AS (
            SELECT 
                TO_CHAR(target_date, 'YYYY-MM-DD') as date_str,
                total_coins,
                total_cells
            FROM daily_stats
            WHERE owner_id = :user_id
              AND target_date >= :fetch_start_date
              AND target_date <= :yesterday_date
        ),
        with_prev AS (
            SELECT 
                date_str,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY date_str) as prev_coins,
                LAG(total_cells) OVER (ORDER BY date_str) as prev_cells
            FROM daily_totals
        )
        SELECT 
            date_str,
            total_coins,
            total_cells,
            CASE 
                WHEN prev_coins > 0 THEN 
                    ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1)
                ELSE 0 
            END as coin_growth,
            CASE 
                WHEN prev_cells > 0 THEN 
                    ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1)
                ELSE 0 
            END as cell_growth
        FROM with_prev
        WHERE date_str >= :display_start_date
        ORDER BY date_str ASC
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "fetch_start_date": fetch_start_date,
        "yesterday_date": yesterday_date,
        "display_start_date": display_start_date.strftime("%Y-%m-%d")
    }).fetchall()
    
    if not results:
        daily_stats = []
        for i in range(7):
            d = display_start_date + timedelta(days=i)
            daily_stats.append({
                "date": d.strftime("%Y-%m-%d"),
                "total_coins": 0,
                "total_cells": 0,
                "coin_growth": 0.0,
                "cell_growth": 0.0
            })
        return {"daily_stats": daily_stats}
    
    daily_stats = [
        {
            "date": row.date_str,
            "total_coins": row.total_coins or 0,
            "total_cells": row.total_cells or 0,
            "coin_growth": float(row.coin_growth or 0),
            "cell_growth": float(row.cell_growth or 0)
        }
        for row in results
    ]

    return {"daily_stats": daily_stats}

# 3. 주간 트렌드 (Window Function + 어제 기준 7일씩 역산)
def get_weekly_trends(db: Session, user_id: int):
    yesterday = get_yesterday()
    yesterday_date = yesterday.date()
    
    fetch_start_date = yesterday_date - timedelta(days=63)
    
    sql = text("""
        WITH weekly_grouped AS (
            SELECT 
                FLOOR((:yesterday_date - target_date) / 7) as week_idx,
                SUM(total_coins) as total_coins,
                SUM(total_cells) as total_cells
            FROM daily_stats
            WHERE owner_id = :user_id
              AND target_date >= :fetch_start_date
              AND target_date <= :yesterday_date
            GROUP BY FLOOR((:yesterday_date - target_date) / 7)
        ),
        with_dates AS (
            SELECT 
                week_idx,
                TO_CHAR(:yesterday_date - (week_idx * 7 * INTERVAL '1 day') - INTERVAL '6 days', 'YYYY-MM-DD') as week_start_date,
                total_coins,
                total_cells
            FROM weekly_grouped
        ),
        with_prev AS (
            SELECT 
                week_start_date,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY week_start_date ASC) as prev_coins,
                LAG(total_cells) OVER (ORDER BY week_start_date ASC) as prev_cells
            FROM with_dates
        )
        SELECT 
            week_start_date,
            total_coins,
            total_cells,
            CASE 
                WHEN prev_coins > 0 THEN 
                    ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1)
                ELSE 0 
            END as coin_growth,
            CASE 
                WHEN prev_cells > 0 THEN 
                    ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1)
                ELSE 0 
            END as cell_growth
        FROM with_prev
        ORDER BY week_start_date ASC
        LIMIT 8
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "yesterday_date": yesterday_date,
        "fetch_start_date": fetch_start_date
    }).fetchall()
    
    if not results:
        trend_stats = []
        for i in range(8):
            end_date = yesterday_date - timedelta(days=i*7)
            start_date = end_date - timedelta(days=6)
            trend_stats.append({
                "week_start_date": start_date.strftime("%Y-%m-%d"),
                "total_coins": 0,
                "total_cells": 0,
                "coin_growth": 0.0,
                "cell_growth": 0.0
            })
        return {"weekly_stats": trend_stats}
    
    trend_stats = [
        {
            "week_start_date": row.week_start_date,
            "total_coins": row.total_coins or 0,
            "total_cells": row.total_cells or 0,
            "coin_growth": float(row.coin_growth or 0),
            "cell_growth": float(row.cell_growth or 0)
        }
        for row in results
    ]
    
    return {"weekly_stats": trend_stats}

# 4. 월간 트렌드 (Window Function 최적화)
def get_monthly_trends(db: Session, user_id: int):
    now_utc = datetime.now(timezone.utc)
    this_month_str = now_utc.strftime("%Y-%m")
    
    start_date = (now_utc.replace(day=1) - timedelta(days=240)).date()
    
    sql = text("""
        WITH monthly_totals AS (
            SELECT 
                TO_CHAR(target_date, 'YYYY-MM') as month_str,
                SUM(total_coins) as total_coins,
                SUM(total_cells) as total_cells
            FROM daily_stats
            WHERE owner_id = :user_id
              AND target_date >= :start_date
            GROUP BY TO_CHAR(target_date, 'YYYY-MM')
        ),
        with_prev AS (
            SELECT 
                month_str,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY month_str) as prev_coins,
                LAG(total_cells) OVER (ORDER BY month_str) as prev_cells
            FROM monthly_totals
        )
        SELECT 
            month_str as month,
            total_coins,
            total_cells,
            CASE 
                WHEN prev_coins > 0 THEN 
                    ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1)
                ELSE 0 
            END as coin_growth,
            CASE 
                WHEN prev_cells > 0 THEN 
                    ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1)
                ELSE 0 
            END as cell_growth,
            CASE WHEN month_str = :this_month THEN true ELSE false END as is_current
        FROM with_prev
        ORDER BY month_str ASC
        LIMIT 6
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "start_date": start_date,
        "this_month": this_month_str
    }).fetchall()
    
    trend_stats = [
        {
            "month": row.month,
            "total_coins": row.total_coins or 0,
            "total_cells": row.total_cells or 0,
            "coin_growth": float(row.coin_growth or 0),
            "cell_growth": float(row.cell_growth or 0),
            "is_current": row.is_current
        }
        for row in results
    ]
    
    return {"monthly_stats": trend_stats}