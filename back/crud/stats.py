"""
파일명: thetower/back/crud/stats.py
용도: 통계 데이터 집계 및 차트 데이터 생성 로직
기능: 일간/주간/월간 자원 획득 통계 조회 및 성장률 계산 (SQL Window 함수 활용)
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import BattleMain
from datetime import datetime, timedelta, timezone
import calendar

def get_today_utc():
    """UTC 기준 오늘 자정 날짜를 반환합니다."""
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)

def get_weekly_stats(db: Session, user_id: int, limit: int = 7):
    """일간 성장 분석 데이터를 조회합니다 (N일)."""
    today_utc = get_today_utc()
    target_date = today_utc.date() - timedelta(days=1)
    display_start_date = target_date - timedelta(days=limit - 1)
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=limit + 7)

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
            CASE WHEN prev_coins > 0 THEN ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1) ELSE 0 END as coin_growth,
            CASE WHEN prev_cells > 0 THEN ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1) ELSE 0 END as cell_growth
        FROM with_prev
        WHERE date_str >= :display_start_date
        ORDER BY date_str ASC
    """)
    
    results = db.execute(sql, {"user_id": user_id, "utc_start_limit": utc_start_limit, "target_date": target_date, "display_start_date": display_start_date.strftime("%Y-%m-%d")}).fetchall()
    result_map = {row.date_str: row for row in results}
    
    daily_stats = []
    for i in range(limit):
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
            daily_stats.append({"date": d_str, "total_coins": 0, "total_cells": 0, "coin_growth": 0.0, "cell_growth": 0.0})
    return {"daily_stats": daily_stats}

def get_weekly_trends(db: Session, user_id: int, limit: int = 8):
    """주간 트렌드 분석 데이터를 조회합니다 (N주)."""
    today_utc = get_today_utc()
    target_date = today_utc.date() - timedelta(days=1)
    # 시작일 계산: 오늘 기준 (limit-1)주 전의 월요일 혹은 일요일로 잡기 위해 넉넉히 계산
    display_start_date = target_date - timedelta(days=(limit * 7) - 1)
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=(limit * 7) + 14)
    
    sql = text("""
        WITH weekly_raw AS (
            SELECT 
                TO_CHAR(DATE_TRUNC('week', battle_date), 'YYYY-MM-DD') as week_start_date,
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
                week_start_date,
                total_coins,
                total_cells,
                LAG(total_coins) OVER (ORDER BY week_start_date ASC) as prev_coins,
                LAG(total_cells) OVER (ORDER BY week_start_date ASC) as prev_cells
            FROM weekly_raw
        )
        SELECT 
            week_start_date, total_coins, total_cells,
            CASE WHEN prev_coins > 0 THEN ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1) ELSE 0 END as coin_growth,
            CASE WHEN prev_cells > 0 THEN ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1) ELSE 0 END as cell_growth
        FROM with_prev
        ORDER BY week_start_date DESC
    """)
    
    results = db.execute(sql, {"user_id": user_id, "utc_start_limit": utc_start_limit, "target_date": target_date}).fetchall()
    result_map = {row.week_start_date: row for row in results}
    
    # 0으로 채우기
    trend_stats = []
    # 가장 최근 주의 월요일 찾기
    last_monday = target_date - timedelta(days=target_date.weekday())
    for i in range(limit):
        w_start = (last_monday - timedelta(weeks=i)).strftime("%Y-%m-%d")
        if w_start in result_map:
            row = result_map[w_start]
            trend_stats.append({
                "week_start_date": w_start,
                "total_coins": row.total_coins or 0, "total_cells": row.total_cells or 0,
                "coin_growth": float(row.coin_growth or 0), "cell_growth": float(row.cell_growth or 0)
            })
        else:
            trend_stats.append({"week_start_date": w_start, "total_coins": 0, "total_cells": 0, "coin_growth": 0.0, "cell_growth": 0.0})
    
    return {"weekly_stats": trend_stats[::-1]}

def get_monthly_trends(db: Session, user_id: int, limit: int = 6):
    """월간 트렌드 분석 데이터를 조회합니다 (N개월)."""
    today_utc = get_today_utc()
    this_month_str = today_utc.strftime("%Y-%m")
    utc_start_limit = datetime.now(timezone.utc) - timedelta(days=(limit + 3) * 30)
    
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
                month_str, total_coins, total_cells,
                LAG(total_coins) OVER (ORDER BY month_str) as prev_coins,
                LAG(total_cells) OVER (ORDER BY month_str) as prev_cells
            FROM monthly_raw
        )
        SELECT 
            month_str as month, total_coins, total_cells,
            CASE WHEN prev_coins > 0 THEN ROUND(((total_coins - prev_coins)::numeric / prev_coins * 100)::numeric, 1) ELSE 0 END as coin_growth,
            CASE WHEN prev_cells > 0 THEN ROUND(((total_cells - prev_cells)::numeric / prev_cells * 100)::numeric, 1) ELSE 0 END as cell_growth,
            CASE WHEN month_str = :this_month THEN true ELSE false END as is_current
        FROM with_prev
        ORDER BY month_str DESC
    """)
    
    results = db.execute(sql, {"user_id": user_id, "utc_start_limit": utc_start_limit, "this_month": this_month_str}).fetchall()
    result_map = {row.month: row for row in results}
    
    # 0으로 채우기
    trend_stats = []
    curr_year = today_utc.year
    curr_month = today_utc.month
    for i in range(limit):
        m = curr_month - i
        y = curr_year
        while m <= 0:
            m += 12
            y -= 1
        m_str = f"{y}-{m:02d}"
        if m_str in result_map:
            row = result_map[m_str]
            trend_stats.append({
                "month": m_str, "total_coins": row.total_coins or 0, "total_cells": row.total_cells or 0,
                "coin_growth": float(row.coin_growth or 0), "cell_growth": float(row.cell_growth or 0),
                "is_current": row.is_current
            })
        else:
            trend_stats.append({"month": m_str, "total_coins": 0, "total_cells": 0, "coin_growth": 0.0, "cell_growth": 0.0, "is_current": (m_str == this_month_str)})
            
    return {"monthly_stats": trend_stats[::-1]}
