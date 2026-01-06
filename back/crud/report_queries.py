# back/crud/report_queries.py
"""
SQL 쿼리 모음
리포트 조회 시 사용되는 복잡한 SQL을 별도 관리
"""

# [수정 포인트] 
# 1. DISTINCT ON 제거: PK(battle_date, owner_id)로 유니크함이 보장된다면 정렬 부하를 줄임
# 2. 성능 최적화: 단순 JOIN 사용

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
        d.combat_json,
        
        -- 데스웨이브 비율
        CASE 
            WHEN d.total_enemies > 0 THEN
                ROUND((d.death_wave_kills::numeric / d.total_enemies::numeric * 100), 1)
            ELSE 0
        END as death_wave_ratio,
        
        -- 스포트라이트 비율
        CASE 
            WHEN d.total_enemies > 0 THEN
                ROUND((d.spotlight_kills::numeric / d.total_enemies::numeric * 100), 1)
            ELSE 0
        END as spotlight_ratio,

        -- 황금 봇 비율
        CASE 
            WHEN d.total_enemies > 0 THEN
                ROUND((d.golden_bot_kills::numeric / d.total_enemies::numeric * 100), 1)
            ELSE 0
        END as golden_bot_ratio
        
    FROM battle_mains m
    -- [수정] 1:1 관계이므로 단순 LEFT JOIN
    LEFT JOIN battle_details d ON m.battle_date = d.battle_date AND m.owner_id = d.owner_id
    WHERE m.owner_id = :user_id
      {date_filter}
    ORDER BY m.battle_date DESC
    {limit_offset}
"""

def get_recent_reports_query():
    """최근 7일 리포트 조회 쿼리"""
    # 파티션 Pruning이 가장 잘 작동하는 쿼리 (날짜 조건 존재)
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="AND m.battle_date >= :cutoff_date",
        limit_offset=""
    )

def get_history_reports_query():
    """전체 기록 조회 쿼리 (페이징)"""
    # 주의: 날짜 조건이 없으면 모든 파티션을 스캔할 수 있음.
    # 인덱스가 잘 타더라도 데이터가 많아지면 느려질 수 있는 지점.
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="",
        limit_offset="LIMIT :limit OFFSET :skip"
    )

def get_reports_by_month_query():
    """특정 월 조회 쿼리"""
    # 파티션 Pruning 작동 (범위 조건 존재)
    return QUERY_REPORTS_WITH_RATIOS.format(
        date_filter="""
          AND m.battle_date >= :start_date
          AND m.battle_date < :end_date
        """,
        limit_offset=""
    )