"""
파일명: thetower/back/crud/report.py
용도: 전투 기록(Battle Report) CRUD 및 조회 로직
기능: 기록 생성, 상세/목록/월별 조회, 통계 기반 뷰 제공 및 삭제
"""
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
    파싱된 데이터를 기반으로 새로운 전투 기록을 생성합니다.
    - BattleMain: 주요 통계 데이터 저장 (merge를 통한 중복 처리)
    - BattleDetail: 상세 JSON 데이터 저장 (detail_data가 있을 때만)
    """
    main_data = parsed_data['main']
    detail_data = parsed_data.get('detail')

    # 유효성 검사: 웨이브와 적 처치수가 모두 0이면 저장하지 않음
    if main_data.get('wave', 0) == 0 and main_data.get('total_enemies', 0) == 0:
        print(f"⚠️ [User {user_id}] 유효하지 않은 데이터라 저장을 건너뜁니다.")
        return None 

    if notes:
        main_data['notes'] = notes

    try:
        # 1. Main 저장 (기존 데이터가 있으면 덮어쓰기)
        battle_main = BattleMain(**main_data, owner_id=user_id)
        db.merge(battle_main)
        
        # 2. Detail 저장 (데이터가 있는 경우에만)
        if detail_data:
            existing_detail = db.query(BattleDetail).filter(
                BattleDetail.battle_date == battle_main.battle_date,
                BattleDetail.owner_id == user_id
            ).first()

            if existing_detail:
                for key, value in detail_data.items():
                    if hasattr(existing_detail, key):
                        setattr(existing_detail, key, value)
            else:
                new_detail = BattleDetail(
                    battle_date=battle_main.battle_date,
                    owner_id=user_id,
                    **detail_data
                )
                db.add(new_detail)
        
        db.commit()
        return battle_main

    except Exception as e:
        db.rollback()
        print(f"❌ [Save Error] 트랜잭션 롤백됨: {e}")
        return None

def count_reports(db: Session) -> int:
    """시스템 전체의 총 전투 기록 개수를 반환합니다."""
    return db.query(BattleMain).count()

def get_cutoff_date():
    """최근 기록을 구분하는 기준 날짜(오늘 자정 기준 7일 전)를 반환합니다."""
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=7)

def get_recent_reports(db: Session, user_id: int):
    """특정 사용자의 최근 7일간 전투 기록 목록을 조회합니다."""
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    sql = text(get_recent_reports_query())
    results = db.execute(sql, {"user_id": user_id, "cutoff_date": cutoff_date_naive}).fetchall()
    return [row_to_report_dict(row) for row in results]

def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """특정 사용자의 전체 전투 기록 목록을 페이징하여 조회합니다."""
    sql = text(get_history_reports_query())
    results = db.execute(sql, {"user_id": user_id, "skip": skip, "limit": limit}).fetchall()
    return [row_to_report_dict(row) for row in results]

def get_history_view(db: Session, user_id: int):
    """
    기록실 메인 뷰 데이터를 조회합니다.
    - 최근 7일 상세 기록 + 그 이전 월별 요약 통계
    """
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)
    recent_reports = get_recent_reports(db, user_id)
    
    # 월별 요약 집계
    monthly_groups = (
        db.query(
            func.to_char(BattleMain.battle_date, 'YYYY-MM').label('month_key'),
            func.count(BattleMain.battle_date).label('count'),
            func.sum(BattleMain.coin_earned).label('total_coins'),
            func.sum(BattleMain.cells_earned).label('total_cells'),
            func.sum(BattleMain.reroll_shards_earned).label('total_shards')
        )
        .filter(BattleMain.owner_id == user_id, BattleMain.battle_date < cutoff_date)
        .group_by(func.to_char(BattleMain.battle_date, 'YYYY-MM'))
        .order_by(func.to_char(BattleMain.battle_date, 'YYYY-MM').desc())
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
    return {"recent_reports": recent_reports, "monthly_summaries": monthly_summaries}

def get_reports_by_month(db: Session, user_id: int, month_key: str):
    """특정 월의 전투 기록 목록을 조회합니다 (최근 7일 제외)."""
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)
    start_date = datetime.strptime(f"{month_key}-01", "%Y-%m-%d")
    end_date = (start_date + timedelta(days=32)).replace(day=1)
    
    sql = text(get_reports_by_month_query())
    results = db.execute(sql, {"user_id": user_id, "start_date": start_date, "end_date": min(end_date, cutoff_date)}).fetchall()
    return [row_to_report_dict(row) for row in results]

def get_full_report(db: Session, battle_date: datetime, user_id: int):
    """특정 시점의 전투 기록 요약(Main)과 상세(Detail) 데이터를 통합 조회합니다."""
    main = db.query(BattleMain).options(joinedload(BattleMain.detail)).filter(BattleMain.battle_date == battle_date, BattleMain.owner_id == user_id).first()
    if not main: return None
    return {"main": main, "detail": main.detail}

def delete_battle_record(db: Session, battle_date: datetime, user_id: int) -> bool:
    """특정 전투 기록을 삭제합니다 (BattleDetail은 Cascade 삭제됨)."""
    try:
        record = db.query(BattleMain).filter(BattleMain.battle_date == battle_date, BattleMain.owner_id == user_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ [Delete Error] 삭제 트랜잭션 롤백됨: {e}")
        return False