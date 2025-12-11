from sqlalchemy.orm import Session, joinedload, load_only
from sqlalchemy import func
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

# [Legacy] 기존 대시보드용 최근 기록
def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    return (
        db.query(BattleMain)
        .options(
            joinedload(BattleMain.detail).load_only(BattleDetail.combat_json)
        )
        .filter(BattleMain.owner_id == user_id)
        .filter(BattleMain.battle_date >= cutoff_date_naive)
        .order_by(BattleMain.battle_date.desc())
        .all()
    )

# [Legacy] 단순 목록 조회
def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(BattleMain)
        .options(
            joinedload(BattleMain.detail).load_only(BattleDetail.combat_json)
        )
        .filter(BattleMain.owner_id == user_id)
        .order_by(BattleMain.battle_date.desc())
        .offset(skip).limit(limit)
        .all()
    )

# [New] 기록실 최적화 뷰 (최근 7일 상세 + 나머지 월별 요약)
def get_history_view(db: Session, user_id: int):
    # 기준: 최근 7일
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    # 1. 최근 7일치 상세 데이터 (Recent List)
    recent_reports = (
        db.query(BattleMain)
        .options(
            joinedload(BattleMain.detail).load_only(BattleDetail.combat_json)
        )
        .filter(BattleMain.owner_id == user_id)
        .filter(BattleMain.battle_date >= cutoff_date)
        .order_by(BattleMain.battle_date.desc())
        .all()
    )

    # 2. 7일 이전 데이터 월별 요약 (Monthly Aggregation)
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

# [Optimized] 특정 월의 상세 기록 조회 (Lazy Loading 용)
def get_reports_by_month(db: Session, user_id: int, month_key: str):
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    # 괄호()로 감싸서 들여쓰기 문제 원천 차단
    return (
        db.query(BattleMain)
        .options(
            joinedload(BattleMain.detail).load_only(BattleDetail.combat_json)
        )
        .filter(BattleMain.owner_id == user_id)
        .filter(func.to_char(BattleMain.battle_date, 'YYYY-MM') == month_key)
        .filter(BattleMain.battle_date < cutoff_date)
        .order_by(BattleMain.battle_date.desc())
        .all()
    )

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