# back/crud/report.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, text
from models import BattleMain, BattleDetail
from datetime import datetime, timedelta, timezone
from .report_queries import (
    get_recent_reports_query,
    get_history_reports_query,
    get_reports_by_month_query
)
from .report_utils import row_to_report_dict

def create_battle_record(db: Session, parsed_data: dict, user_id: int, notes: str = None):
    """
    전투 기록을 생성하거나 업데이트합니다.
    1. 빈 데이터(웨이브 0, 적 0)는 저장을 거부합니다.
    2. Main 데이터는 merge를 사용하고, Detail 데이터는 존재 여부 확인 후 Update/Insert를 수행합니다.
    """
    main_data = parsed_data['main']
    detail_data = parsed_data['detail']

    # [1] 빈 껍데기 데이터 방지 (Validation)
    # OCR 실패로 인해 웨이브도 0이고, 적 처치 수도 0인 데이터는 저장하지 않고 무시합니다.
    if main_data.get('wave', 0) == 0 and detail_data.get('total_enemies', 0) == 0:
        print(f"⚠️ [User {user_id}] 유효하지 않은 데이터(Empty Data)라 저장을 건너뜁니다.")
        return None 

    if notes:
        main_data['notes'] = notes

    # [2] Main 데이터 처리
    # (Main은 PK가 battle_date + owner_id로 잡혀 있어 merge가 Update로 동작)
    battle_main = BattleMain(**main_data, owner_id=user_id)
    db.merge(battle_main)
    
    # [3] Detail 데이터 처리 (중복 방지 핵심 로직)
    # 무조건 Insert하는 대신, 같은 날짜/유저의 데이터가 있는지 먼저 확인합니다.
    existing_detail = db.query(BattleDetail).filter(
        BattleDetail.battle_date == battle_main.battle_date,
        BattleDetail.owner_id == user_id
    ).first()

    if existing_detail:
        # [CASE A] 이미 존재하면 -> 내용을 업데이트합니다 (Update)
        for key, value in detail_data.items():
            # detail_data의 모든 키(total_enemies, combat_json 등)를 기존 객체에 덮어씌움
            if hasattr(existing_detail, key):
                setattr(existing_detail, key, value)
    else:
        # [CASE B] 없으면 -> 새로 만듭니다 (Insert)
        new_detail = BattleDetail(
            battle_date=battle_main.battle_date,
            owner_id=user_id,
            **detail_data
        )
        db.add(new_detail)
    
    db.commit()
    return battle_main

def count_reports(db: Session) -> int:
    return db.query(BattleMain).count()

def get_cutoff_date():
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=7)

def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    sql = text(get_recent_reports_query())
    results = db.execute(sql, {
        "user_id": user_id,
        "cutoff_date": cutoff_date_naive
    }).fetchall()
    
    return [row_to_report_dict(row) for row in results]

def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    sql = text(get_history_reports_query())
    results = db.execute(sql, {
        "user_id": user_id,
        "skip": skip,
        "limit": limit
    }).fetchall()
    
    return [row_to_report_dict(row) for row in results]

def get_history_view(db: Session, user_id: int):
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    # 1. 최근 7일치 상세 데이터
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

def get_reports_by_month(db: Session, user_id: int, month_key: str):
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)

    start_date = datetime.strptime(f"{month_key}-01", "%Y-%m-%d")
    end_date = (start_date + timedelta(days=32)).replace(day=1)

    sql = text(get_reports_by_month_query())
    results = db.execute(sql, {
        "user_id": user_id,
        "start_date": start_date,
        "end_date": min(end_date, cutoff_date)
    }).fetchall()
    
    return [row_to_report_dict(row) for row in results]

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