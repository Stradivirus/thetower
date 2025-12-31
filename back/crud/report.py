# back/crud/report.py
from sqlalchemy.orm import Session, joinedload, load_only
from sqlalchemy import func, text
from models import BattleMain, BattleDetail
from datetime import datetime, timedelta, timezone

def create_battle_record(db: Session, parsed_data: dict, user_id: int, notes: str = None):
    main_data = parsed_data['main']
    detail_data = parsed_data['detail']
    
    if notes:
        main_data['notes'] = notes

    battle_main = BattleMain(**main_data, owner_id=user_id)
    battle_detail = BattleDetail(
        battle_date=battle_main.battle_date,
        **detail_data
    )
    
    db.merge(battle_main)
    db.merge(battle_detail)
    db.commit()
    return battle_main

def count_reports(db: Session) -> int:
    return db.query(BattleMain).count()

def get_cutoff_date():
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=7)

# [최적화] DB에서 top_damages, 비율 계산 후 반환
def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    # Raw SQL로 계산된 필드 포함하여 조회
    sql = text("""
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
                
                -- death_wave_ratio 계산
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.combat_json->>'데스웨이브에 의해 표시됨', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as death_wave_ratio,
                
                -- spotlight_ratio 계산
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'스포트라이트로 파괴함', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as spotlight_ratio
                
            FROM battle_mains m
            LEFT JOIN battle_details d ON m.battle_date = d.battle_date
            WHERE m.owner_id = :user_id
              AND m.battle_date >= :cutoff_date
            ORDER BY m.battle_date DESC
        )
        SELECT * FROM parsed_damages
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "cutoff_date": cutoff_date_naive
    }).fetchall()
    
    # ORM 객체로 변환 (Pydantic 호환)
    reports = []
    for row in results:
        # top_damages 계산 (combat_json 파싱)
        top_damages = []
        if row.combat_json:
            exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
            
            for key, val in row.combat_json.items():
                if key in exclude_keys: 
                    continue
                
                if isinstance(val, (str, int, float)):
                    # 간단한 숫자 파싱 (x, 단위 제거)
                    clean_val = str(val).replace(',', '').replace('x', '').replace('X', '').rstrip('KMBTQqSsOoNnDdU')
                    try:
                        raw_val = float(clean_val) if clean_val else 0
                    except ValueError:
                        raw_val = 0
                    top_damages.append({
                        "name": key.replace(" 대미지", ""),
                        "value": str(val),
                        "raw": raw_val
                    })
            
            top_damages.sort(key=lambda x: x['raw'], reverse=True)
        
        # 딕셔너리 형태로 반환 (BattleMainResponse 호환)
        reports.append({
            "battle_date": row.battle_date,
            "created_at": row.created_at,
            "tier": row.tier,
            "wave": row.wave,
            "game_time": row.game_time,
            "real_time": row.real_time,
            "coin_earned": row.coin_earned,
            "coins_per_hour": row.coins_per_hour,
            "cells_earned": row.cells_earned,
            "reroll_shards_earned": row.reroll_shards_earned,
            "killer": row.killer,
            "damage_dealt": row.damage_dealt,
            "damage_taken": row.damage_taken,
            "notes": row.notes,
            "top_damages": top_damages,
            "death_wave_ratio": f"{row.death_wave_ratio}%" if row.death_wave_ratio else "-",
            "spotlight_ratio": f"{row.spotlight_ratio}%" if row.spotlight_ratio else "-"
        })
    
    return reports

# [최적화] 전체 기록도 동일하게 처리
def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    sql = text("""
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
                
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.combat_json->>'데스웨이브에 의해 표시됨', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as death_wave_ratio,
                
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'스포트라이트로 파괴함', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as spotlight_ratio
                
            FROM battle_mains m
            LEFT JOIN battle_details d ON m.battle_date = d.battle_date
            WHERE m.owner_id = :user_id
            ORDER BY m.battle_date DESC
            LIMIT :limit OFFSET :skip
        )
        SELECT * FROM parsed_damages
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "skip": skip,
        "limit": limit
    }).fetchall()
    
    reports = []
    for row in results:
        top_damages = []
        if row.combat_json:
            exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
            
            for key, val in row.combat_json.items():
                if key in exclude_keys: 
                    continue
                
                if isinstance(val, (str, int, float)):
                    clean_val = str(val).replace(',', '').replace('x', '').replace('X', '').rstrip('KMBTQqSsOoNnDdU')
                    try:
                        raw_val = float(clean_val) if clean_val else 0
                    except ValueError:
                        raw_val = 0
                    top_damages.append({
                        "name": key.replace(" 대미지", ""),
                        "value": str(val),
                        "raw": raw_val
                    })
            
            top_damages.sort(key=lambda x: x['raw'], reverse=True)
        
        reports.append({
            "battle_date": row.battle_date,
            "created_at": row.created_at,
            "tier": row.tier,
            "wave": row.wave,
            "game_time": row.game_time,
            "real_time": row.real_time,
            "coin_earned": row.coin_earned,
            "coins_per_hour": row.coins_per_hour,
            "cells_earned": row.cells_earned,
            "reroll_shards_earned": row.reroll_shards_earned,
            "killer": row.killer,
            "damage_dealt": row.damage_dealt,
            "damage_taken": row.damage_taken,
            "notes": row.notes,
            "top_damages": top_damages,
            "death_wave_ratio": f"{row.death_wave_ratio}%" if row.death_wave_ratio else "-",
            "spotlight_ratio": f"{row.spotlight_ratio}%" if row.spotlight_ratio else "-"
        })
    
    return reports

# 기록실 최적화 뷰 (최근 7일 상세 + 나머지 월별 요약)
def get_history_view(db: Session, user_id: int):
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    # 1. 최근 7일치 상세 데이터 (최적화된 get_recent_reports 사용)
    recent_reports = get_recent_reports(db, user_id)

    # 2. 7일 이전 데이터 월별 요약
    monthly_groups = (
        db.query(
            func.to_char(BattleMain.battle_date, 'YYYY-MM').label('month_key'),
            func.count(BattleMain.battle_date).label('count'),
            func.sum(BattleMain.coin_earned).label('total_coins'),
            func.sum(BattleMain.cells_earned).label('total_cells'),
            func.sum(BattleMain.reroll_shards_earned).label('total_shards')
        )
        .filter(
            BattleMain.owner_id == user_id,
            BattleMain.battle_date < cutoff_date
        )
        .group_by(
            func.to_char(BattleMain.battle_date, 'YYYY-MM')
        )
        .order_by(
            func.to_char(BattleMain.battle_date, 'YYYY-MM').desc()
        )
        .all()
    )

    monthly_summaries = []
    for row in monthly_groups:
        monthly_summaries.append({
            "month_key": row.month_key,
            "count": row.count,
            "total_coins": row.total_coins or 0,
            "total_cells": row.total_cells or 0,
            "total_shards": row.total_shards or 0
        })

    return {
        "recent_reports": recent_reports,
        "monthly_summaries": monthly_summaries
    }

# 특정 월의 상세 기록 조회 (Lazy Loading 용)
def get_reports_by_month(db: Session, user_id: int, month_key: str):
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    start_date = datetime.strptime(f"{month_key}-01", "%Y-%m-%d")
    end_date = (start_date + timedelta(days=32)).replace(day=1)

    sql = text("""
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
                
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.combat_json->>'데스웨이브에 의해 표시됨', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as death_wave_ratio,
                
                CASE 
                    WHEN NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric > 0 THEN
                        ROUND((
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'스포트라이트로 파괴함', '[^0-9.]', '', 'g'), '')::numeric / 
                            NULLIF(REGEXP_REPLACE(d.enemy_json->>'적 합계', '[^0-9.]', '', 'g'), '')::numeric * 100
                        )::numeric, 1)
                    ELSE 0
                END as spotlight_ratio
                
            FROM battle_mains m
            LEFT JOIN battle_details d ON m.battle_date = d.battle_date
            WHERE m.owner_id = :user_id
              AND m.battle_date >= :start_date
              AND m.battle_date < :end_date
            ORDER BY m.battle_date DESC
        )
        SELECT * FROM parsed_damages
    """)
    
    results = db.execute(sql, {
        "user_id": user_id,
        "start_date": start_date,
        "end_date": min(end_date, cutoff_date)
    }).fetchall()
    
    reports = []
    for row in results:
        top_damages = []
        if row.combat_json:
            exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
            
            for key, val in row.combat_json.items():
                if key in exclude_keys: 
                    continue
                
                if isinstance(val, (str, int, float)):
                    raw_val = float(str(val).replace(',', '').rstrip('KMBTQqSsOoNnDdU') or 0)
                    top_damages.append({
                        "name": key.replace(" 대미지", ""),
                        "value": str(val),
                        "raw": raw_val
                    })
            
            top_damages.sort(key=lambda x: x['raw'], reverse=True)
        
        reports.append({
            "battle_date": row.battle_date,
            "created_at": row.created_at,
            "tier": row.tier,
            "wave": row.wave,
            "game_time": row.game_time,
            "real_time": row.real_time,
            "coin_earned": row.coin_earned,
            "coins_per_hour": row.coins_per_hour,
            "cells_earned": row.cells_earned,
            "reroll_shards_earned": row.reroll_shards_earned,
            "killer": row.killer,
            "damage_dealt": row.damage_dealt,
            "damage_taken": row.damage_taken,
            "notes": row.notes,
            "top_damages": top_damages,
            "death_wave_ratio": f"{row.death_wave_ratio}%" if row.death_wave_ratio else "-",
            "spotlight_ratio": f"{row.spotlight_ratio}%" if row.spotlight_ratio else "-"
        })
    
    return reports

def get_full_report(db: Session, battle_date: datetime, user_id: int):
    main = (
        db.query(BattleMain)
        .options(joinedload(BattleMain.detail))
        .filter(
            BattleMain.battle_date == battle_date,
            BattleMain.owner_id == user_id
        )
        .first()
    )
    
    if not main:
        return None
        
    return {
        "main": main,
        "detail": main.detail
    }

def delete_battle_record(db: Session, battle_date: datetime, user_id: int) -> bool:
    record = (
        db.query(BattleMain)
        .filter(
            BattleMain.battle_date == battle_date,
            BattleMain.owner_id == user_id
        )
        .first()
    )

    if record:
        db.delete(record)
        db.commit()
        return True
    return False