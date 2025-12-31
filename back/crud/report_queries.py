# back/crud/report_queries.py
"""
SQL 쿼리 모음
리포트 조회 시 사용되는 복잡한 SQL을 별도 관리
"""

# [최적화 완료] 정수형 컬럼 사용으로 연산 속도 및 CPU 부하 대폭 개선
QUERY_REPORTS_WITH_RATIOS = """
    WITH parsed_damages AS (
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
            d.combat_json,
            
            -- [최적화] 데스웨이브 비율 (JSON 파싱 제거 -> 컬럼 직접 사용)
            CASE 
                WHEN d.total_enemies > 0 THEN
                    ROUND((d.death_wave_kills::numeric / d.total_enemies::numeric * 100), 1)
                ELSE 0
            END as death_wave_ratio,
            
            -- [최적화] 스포트라이트 비율 (JSON 파싱 제거 -> 컬럼 직접 사용)
            CASE 
                WHEN d.total_enemies > 0 THEN
                    ROUND((d.spotlight_kills::numeric / d.total_enemies::numeric * 100), 1)
                ELSE 0
            END as spotlight_ratio
            
        FROM battle_mains m
        LEFT JOIN battle_details d ON m.battle_date = d.battle_date
        WHERE m.owner_id = :user_id
          {date_filter}
        ORDER BY m.battle_date DESC
        {limit_offset}
    )
    SELECT * FROM parsed_damages
"""

def get_recent_reports_query():
    """최근 7일 리포트 조회 쿼리"""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="AND m.battle_date >= :cutoff_date",
        limit_offset=""
    )

def get_history_reports_query():
    """전체 기록 조회 쿼리 (페이징)"""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="",
        limit_offset="LIMIT :limit OFFSET :skip"
    )

def get_reports_by_month_query():
    """특정 월 조회 쿼리"""
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="""
          AND m.battle_date >= :start_date
          AND m.battle_date < :end_date
        """,
        limit_offset=""
    )