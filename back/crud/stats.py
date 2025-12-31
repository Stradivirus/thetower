from sqlalchemy.orm import Session
from sqlalchemy import func, literal, text
from models import BattleMain
from datetime import datetime, timedelta, timezone

# 헬퍼 함수 - 시간 계산 중복 제거
def get_yesterday():
    """UTC 기준 어제 자정 (naive datetime)"""
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    return now_utc - timedelta(days=1)

# 1. 일간 통계 (Window Function 적용)
def get_weekly_stats(db: Session, user_id: int):
    yesterday = get_yesterday()
    fetch_start_date = yesterday - timedelta(days=7)
    display_start_date = yesterday - timedelta(days=6)
    
    # [최적화] LAG를 사용해 전일 데이터와 성장률을 DB에서 한 번에 계산
    sql = text("""
        WITH daily_totals AS (
            SELECT 
                TO_CHAR(battle_date, 'YYYY-MM-DD') as date_str,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :fetch_start_date
              AND battle_date < :end_date
            GROUP BY TO_CHAR(battle_date, 'YYYY-MM-DD')
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
        "end_date": yesterday + timedelta(days=1),
        "display_start_date": display_start_date.strftime("%Y-%m-%d")
    }).fetchall()
    
    # 결과가 없으면 7일치 빈 데이터 생성
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
    
    # DB 결과 변환
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

# 2. 주간 트렌드 (Window Function 적용)
def get_weekly_trends(db: Session, user_id: int):
    yesterday = get_yesterday()
    fetch_start_date = yesterday - timedelta(days=63)
    
    # [최적화] Window Function으로 주차별 성장률 계산
    sql = text("""
        WITH weekly_totals AS (
            SELECT 
                FLOOR(EXTRACT(EPOCH FROM (:yesterday - battle_date)) / (7 * 86400)) as week_offset,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :fetch_start_date
              AND battle_date < :end_date
            GROUP BY week_offset
        ),
        with_dates AS (
            SELECT 
                week_offset,
                (:yesterday - (week_offset * 7 * INTERVAL '1 day'))::date as end_date,
                (:yesterday - (week_offset * 7 * INTERVAL '1 day') - INTERVAL '6 days')::date as start_date,
                total_coins,
                total_cells
            FROM weekly_totals
        ),
        with_prev AS (
            SELECT 
                TO_CHAR(start_date, 'YYYY-MM-DD') as week_start_date,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY start_date) as prev_coins,
                LAG(total_cells) OVER (ORDER BY start_date) as prev_cells
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
        "yesterday": yesterday,
        "fetch_start_date": fetch_start_date,
        "end_date": yesterday + timedelta(days=1)
    }).fetchall()
    
    # 결과가 없으면 8주치 빈 데이터 생성
    if not results:
        trend_stats = []
        for i in range(8):
            week_idx = 7 - i
            end_date = yesterday - timedelta(days=week_idx * 7)
            start_date = end_date - timedelta(days=6)
            trend_stats.append({
                "week_start_date": start_date.strftime("%Y-%m-%d"),
                "total_coins": 0,
                "total_cells": 0,
                "coin_growth": 0.0,
                "cell_growth": 0.0
            })
        return {"weekly_stats": trend_stats}
    
    # DB 결과 변환
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

# 3. 월간 트렌드 (Window Function 적용)
def get_monthly_trends(db: Session, user_id: int):
    now_utc = datetime.now(timezone.utc)
    this_month_str = now_utc.strftime("%Y-%m")
    start_date = (now_utc.replace(day=1) - timedelta(days=210)).replace(day=1)
    
    # [최적화] Window Function으로 월별 성장률 계산
    sql = text("""
        WITH monthly_totals AS (
            SELECT 
                TO_CHAR(battle_date, 'YYYY-MM') as month_str,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :start_date
            GROUP BY TO_CHAR(battle_date, 'YYYY-MM')
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
    
    # DB 결과 변환
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