"""
파일명: thetower/back/crud/stats.py
용도: 통계 데이터 집계 및 차트 데이터 생성 로직
기능: 일간/주간/월간 자원 획득 통계 조회 및 성장률 계산 (SQL Window 함수 활용)
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import BattleMain
from datetime import datetime, timedelta, timezone

def get_today_utc():
    """UTC 기준 오늘 자정 날짜를 반환합니다."""
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)

def get_weekly_stats(db: Session, user_id: int):
    """
    일간 성장 분석 데이터를 조회합니다 (최근 7일).
    - 윈도우 함수 LAG를 사용하여 전일 대비 성장률 계산
    - 진행 중인 오늘 데이터를 제외하기 위해 어제 날짜를 기준으로 집계
    """
    today_utc = get_today_utc()
    target_date = today_utc.date() - timedelta(days=1)  # 어제까지의 데이터만 조회
    
    display_start_date = target_date - timedelta(days=6)
    
    # 전일 대비 계산을 위해 넉넉하게 14일 전부터 조회
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=14)

    sql = text("""
        WITH raw_daily AS (
            SELECT 
                TO_CHAR(battle_date, 'YYYY-MM-DD') as date_str,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :utc_start_limit 
              AND battle_date::date <= :target_date
            GROUP BY 1
        ),
        with_prev AS (
            SELECT 
                date_str,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY date_str) as prev_coins,
                LAG(total_cells) OVER (ORDER BY date_str) as prev_cells
            FROM raw_daily
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
        "utc_start_limit": utc_start_limit,
        "target_date": target_date,
        "display_start_date": display_start_date.strftime("%Y-%m-%d")
    }).fetchall()
    
    result_map = {row.date_str: row for row in results}
    
    daily_stats = []
    for i in range(7):
        d_str = (display_start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        if d_str in result_map:
            row = result_map[d_str]
            daily_stats.append({
                "date": row.date_str,
                "total_coins": row.total_coins or 0,
                "total_cells": row.total_cells or 0,
                "coin_growth": float(row.coin_growth or 0),
                "cell_growth": float(row.cell_growth or 0)
            })
        else:
            daily_stats.append({
                "date": d_str,
                "total_coins": 0,
                "total_cells": 0,
                "coin_growth": 0.0,
                "cell_growth": 0.0
            })

    return {"daily_stats": daily_stats}

def get_weekly_trends(db: Session, user_id: int):
    """
    주간 트렌드 분석 데이터를 조회합니다 (최근 8주).
    - 7일 단위 롤링 집계를 통해 안정적인 성장 추세를 파악함
    """
    today_utc = get_today_utc()
    target_date = today_utc.date() - timedelta(days=1)

    # 넉넉하게 70일 전 데이터부터 조회
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=70)
    
    sql = text("""
        WITH weekly_raw AS (
            SELECT 
                FLOOR((:target_date - battle_date::date) / 7) as week_idx,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :utc_start_limit
              AND battle_date::date <= :target_date
            GROUP BY 1
        ),
        with_dates AS (
            SELECT 
                week_idx,
                TO_CHAR(:target_date - (week_idx * 7 + 6) * INTERVAL '1 day', 'YYYY-MM-DD') as week_start_date,
                total_coins,
                total_cells
            FROM weekly_raw
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
        ORDER BY week_start_date DESC
        LIMIT 8
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "utc_start_limit": utc_start_limit,
        "target_date": target_date
    }).fetchall()
    
    trend_stats = [
        {
            "week_start_date": row.week_start_date,
            "total_coins": row.total_coins or 0,
            "total_cells": row.total_cells or 0,
            "coin_growth": float(row.coin_growth or 0),
            "cell_growth": float(row.cell_growth or 0)
        }
        for row in results
    ][::-1] 
    
    return {"weekly_stats": trend_stats}

def get_monthly_trends(db: Session, user_id: int):
    """
    월간 트렌드 분석 데이터를 조회합니다 (최근 6개월).
    - 현재 진행 중인 달(is_current)을 표시하여 시각화에 활용
    """
    today_utc = get_today_utc()
    this_month_str = today_utc.strftime("%Y-%m")
    
    # 넉넉하게 8개월 전부터 조회
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=240)
    
    sql = text("""
        WITH monthly_raw AS (
            SELECT 
                TO_CHAR(battle_date, 'YYYY-MM') as month_str,
                SUM(coin_earned) as total_coins,
                SUM(cells_earned) as total_cells
            FROM battle_mains
            WHERE owner_id = :user_id
              AND battle_date >= :utc_start_limit
            GROUP BY 1
        ),
        with_prev AS (
            SELECT 
                month_str,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY month_str) as prev_coins,
                LAG(total_cells) OVER (ORDER BY month_str) as prev_cells
            FROM monthly_raw
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
        ORDER BY month_str DESC
        LIMIT 6
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "utc_start_limit": utc_start_limit,
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
    ][::-1]
    
    return {"monthly_stats": trend_stats}