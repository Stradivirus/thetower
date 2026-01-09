# back/crud/report_queries.py

# [최적화 완료] BattleDetail JOIN 없음. Main 테이블 단독 조회.
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
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="AND m.battle_date >= :cutoff_date",
        limit_offset=""
    )

def get_history_reports_query():
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="",
        limit_offset="LIMIT :limit OFFSET :skip"
    )

def get_reports_by_month_query():
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="""
          AND m.battle_date >= :start_date
          AND m.battle_date < :end_date
        """,
        limit_offset=""
    )