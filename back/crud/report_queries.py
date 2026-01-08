# back/crud/report_queries.py
"""
SQL 쿼리 모음
리포트 조회 시 사용되는 복잡한 SQL을 별도 관리
"""

# [최적화 완료] 
# 1. BattleDetail JOIN 제거 (모든 데이터가 BattleMain에 있음)
# 2. 단일 테이블 조회로 성능 향상

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
        
        -- Main 테이블에 있는 값으로 비율 계산
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
        
        
        d.combat_json 
        
    FROM battle_mains m
    LEFT JOIN battle_details d ON m.battle_date = d.battle_date AND m.owner_id = d.owner_id
    
    WHERE m.owner_id = :user_id
      {date_filter}
    ORDER BY m.battle_date DESC
    {limit_offset}
"""

# (참고) 만약 리스트에서 '최고 데미지(top_damages)'를 안 보여줘도 된다면
# 위 쿼리에서 'd.combat_json'과 'LEFT JOIN ...'을 완전히 삭제하면 속도가 훨씬 빨라집니다.
# 지금은 기존 기능을 유지하기 위해 JOIN은 남겨두었지만, 계산 로직은 Main 컬럼을 씁니다.

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