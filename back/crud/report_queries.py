"""
파일명: thetower/back/crud/report_queries.py
용도: 전투 기록 조회를 위한 복잡한 RAW SQL 쿼리 정의
기능: 비율 계산(Kill Ratios)을 포함한 최적화된 SQL 쿼리 제공
"""

# [최적화] BattleDetail JOIN 없이 Main 테이블 단독 조회를 위한 베이스 쿼리
# CASE 문을 사용하여 처치 수 비율(Death Wave, Spotlight, Golden Bot)을 계산함
QUERY_REPORTS_WITH_RATIOS = """
    SELECT
        m.battle_date,
        m.tier,
        m.wave,
        m.game_time,
        m.real_time,
        m.coin_earned,
        m.coins_per_hour,
        m.cells_earned,
        m.reroll_shards_earned,
        m.killer,
        m.damage_dealt,
        m.damage_taken,
        m.notes,
        m.created_at,
        
        CASE 
            WHEN m.total_enemies > 0 THEN
                ROUND((m.death_wave_kills::numeric / m.total_enemies::numeric * 100), 1)
            ELSE 0
        END as death_wave_ratio,
        
        CASE 
            WHEN m.total_enemies > 0 THEN
                ROUND((m.spotlight_kills::numeric / m.total_enemies::numeric * 100), 1)
            ELSE 0
        END as spotlight_ratio,

        CASE 
            WHEN m.total_enemies > 0 THEN
                ROUND((m.golden_bot_kills::numeric / m.total_enemies::numeric * 100), 1)
            ELSE 0
        END as golden_bot_ratio,

        m.top_damages
        
    FROM battle_mains m
    WHERE m.owner_id = :user_id
      {date_filter}
    ORDER BY m.battle_date DESC
    {limit_offset}
"""

def get_recent_reports_query():
    """최근 7일간의 기록을 조회하는 쿼리를 반환합니다."""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="AND m.battle_date >= :cutoff_date",
        limit_offset=""
    )

def get_history_reports_query():
    """전체 기록을 페이징하여 조회하는 쿼리를 반환합니다."""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="",
        limit_offset="LIMIT :limit OFFSET :skip"
    )

def get_reports_by_month_query():
    """특정 월의 기록을 조회하는 쿼리를 반환합니다."""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="""
          AND m.battle_date >= :start_date
          AND m.battle_date < :end_date
        """,
        limit_offset=""
    )