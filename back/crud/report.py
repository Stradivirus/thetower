"""
파일명: thetower/back/crud/report.py
용도: 전투 기록(Battle Report) CRUD 및 조회 로직 (비동기 및 월별 요약 캐싱 적용)
기능: 기록 생성, 상세/목록/월별 조회, 통계 기반 뷰 제공 및 삭제
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import func, text, select
from models import BattleMain, BattleDetail, MonthlySummary
from datetime import datetime, timedelta, timezone
from .report_queries import (
    get_recent_reports_query,
    get_history_reports_query,
    get_reports_by_month_query
)
from .report_utils import row_to_report_dict

async def update_monthly_summary_add(db: AsyncSession, owner_id: int, date_obj: datetime, coins: float, cells: float, shards: float):
    """전투 기록 추가 시 월간 요약 대장 수치 누적"""
    month_key = date_obj.strftime("%Y-%m")
    stmt = select(MonthlySummary).filter(MonthlySummary.month_key == month_key, MonthlySummary.owner_id == owner_id)
    res = await db.execute(stmt)
    summary = res.scalars().first()
    
    if summary:
        summary.count += 1
        summary.total_coins += coins
        summary.total_cells += cells
        summary.total_shards += shards
    else:
        summary = MonthlySummary(
            month_key=month_key,
            owner_id=owner_id,
            count=1,
            total_coins=coins,
            total_cells=cells,
            total_shards=shards
        )
        db.add(summary)

async def update_monthly_summary_remove(db: AsyncSession, owner_id: int, date_obj: datetime, coins: float, cells: float, shards: float):
    """전투 기록 삭제 또는 덮어쓰기 시 월간 요약 대장 수치 차감"""
    month_key = date_obj.strftime("%Y-%m")
    stmt = select(MonthlySummary).filter(MonthlySummary.month_key == month_key, MonthlySummary.owner_id == owner_id)
    res = await db.execute(stmt)
    summary = res.scalars().first()
    
    if summary:
        summary.count = max(0, summary.count - 1)
        summary.total_coins = max(0, summary.total_coins - coins)
        summary.total_cells = max(0, summary.total_cells - cells)
        summary.total_shards = max(0, summary.total_shards - shards)

async def create_battle_record(db: AsyncSession, parsed_data: dict, user_id: int, notes: str = None):
    """
    파싱된 데이터를 기반으로 새로운 전투 기록을 생성합니다.
    - BattleMain: 주요 통계 데이터 저장 (merge를 통한 중복 처리)
    - BattleDetail: 상세 JSON 데이터 저장 (detail_data가 있을 때만)
    - MonthlySummary: 실시간 통계 요약 갱신
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
        # 1. Main 저장 준비
        battle_main = BattleMain(**main_data, owner_id=user_id)
        
        # 중복 방지 및 덮어쓰기 처리: 기존 기록 여부 체크
        stmt_existing_main = select(BattleMain).filter(BattleMain.battle_date == battle_main.battle_date, BattleMain.owner_id == user_id)
        res_existing_main = await db.execute(stmt_existing_main)
        existing_main = res_existing_main.scalars().first()

        # 기존 기록이 있으면 먼저 요약에서 수치 차감
        if existing_main:
            await update_monthly_summary_remove(
                db, 
                user_id, 
                battle_main.battle_date, 
                existing_main.coin_earned or 0, 
                existing_main.cells_earned or 0, 
                existing_main.reroll_shards_earned or 0
            )

        # 요약 대장에 새로운 값을 더해줌
        await update_monthly_summary_add(
            db, 
            user_id, 
            battle_main.battle_date, 
            battle_main.coin_earned or 0, 
            battle_main.cells_earned or 0, 
            battle_main.reroll_shards_earned or 0
        )

        await db.merge(battle_main)
        
        # 2. Detail 저장 (데이터가 있는 경우에만)
        if detail_data:
            stmt = select(BattleDetail).filter(
                BattleDetail.battle_date == battle_main.battle_date,
                BattleDetail.owner_id == user_id
            )
            result = await db.execute(stmt)
            existing_detail = result.scalars().first()

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
        
        await db.commit()
        return battle_main

    except Exception as e:
        await db.rollback()
        print(f"❌ [Save Error] 트랜잭션 롤백됨: {e}")
        return None

async def count_reports(db: AsyncSession) -> int:
    """시스템 전체의 총 전투 기록 개수를 반환합니다."""
    stmt = select(func.count(BattleMain.battle_date))
    result = await db.execute(stmt)
    return result.scalar() or 0

def get_cutoff_date():
    """최근 기록을 구분하는 기준 날짜(오늘 자정 기준 7일 전)를 반환합니다."""
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=7)

async def get_recent_reports(db: AsyncSession, user_id: int):
    """특정 사용자의 최근 7일간 전투 기록 목록을 조회합니다."""
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    sql = text(get_recent_reports_query())
    results = (await db.execute(sql, {"user_id": user_id, "cutoff_date": cutoff_date_naive})).fetchall()
    return [row_to_report_dict(row) for row in results]

async def get_history_reports(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100):
    """특정 사용자의 전체 전투 기록 목록을 페이징하여 조회합니다."""
    sql = text(get_history_reports_query())
    results = (await db.execute(sql, {"user_id": user_id, "skip": skip, "limit": limit})).fetchall()
    return [row_to_report_dict(row) for row in results]

async def get_history_view(db: AsyncSession, user_id: int):
    """
    기록실 메인 뷰 데이터를 조회합니다.
    - 최근 7일 상세 기록 + 그 이전 월별 요약 통계 (MonthlySummary 활용 최적화)
    """
    recent_reports = await get_recent_reports(db, user_id)
    
    # 1. 요약 테이블 전체 조회
    stmt = select(MonthlySummary).filter(MonthlySummary.owner_id == user_id).order_by(MonthlySummary.month_key.desc())
    result = await db.execute(stmt)
    summaries = result.scalars().all()
    
    summary_map = {
        s.month_key: {
            "month_key": s.month_key,
            "count": s.count,
            "total_coins": float(s.total_coins),
            "total_cells": float(s.total_cells),
            "total_shards": float(s.total_shards)
        }
        for s in summaries
    }
    
    # 2. 최근 7일 상세 기록이 월별 요약 통계와 겹치지 않도록 차감 보정 (인메모리 최적화)
    for r in recent_reports:
        b_date = r.get('battle_date')
        if isinstance(b_date, str):
            b_date = datetime.fromisoformat(b_date)
        m_key = b_date.strftime("%Y-%m")
        
        if m_key in summary_map:
            summary_map[m_key]["count"] = max(0, summary_map[m_key]["count"] - 1)
            summary_map[m_key]["total_coins"] = max(0.0, summary_map[m_key]["total_coins"] - float(r.get('coin_earned') or 0))
            summary_map[m_key]["total_cells"] = max(0.0, summary_map[m_key]["total_cells"] - float(r.get('cells_earned') or 0))
            summary_map[m_key]["total_shards"] = max(0.0, summary_map[m_key]["total_shards"] - float(r.get('reroll_shards_earned') or 0))
            
    # 3. 보정 후 잔여 카운트가 존재하는 월별 요약만 리스트로 반환
    monthly_summaries = []
    for m_key in sorted(summary_map.keys(), reverse=True):
        val = summary_map[m_key]
        if val["count"] > 0:
            monthly_summaries.append(val)
            
    return {"recent_reports": recent_reports, "monthly_summaries": monthly_summaries}

async def get_reports_by_month(db: AsyncSession, user_id: int, month_key: str):
    """특정 월의 전투 기록 목록을 조회합니다 (최근 7일 제외)."""
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    cutoff_date = now_utc - timedelta(days=7)
    start_date = datetime.strptime(f"{month_key}-01", "%Y-%m-%d")
    end_date = (start_date + timedelta(days=32)).replace(day=1)
    
    sql = text(get_reports_by_month_query())
    results = (await db.execute(sql, {"user_id": user_id, "start_date": start_date, "end_date": min(end_date, cutoff_date)})).fetchall()
    return [row_to_report_dict(row) for row in results]

async def get_full_report(db: AsyncSession, battle_date: datetime, user_id: int):
    """특정 시점의 전투 기록 요약(Main)과 상세(Detail) 데이터를 통합 조회합니다."""
    stmt = select(BattleMain).options(joinedload(BattleMain.detail)).filter(BattleMain.battle_date == battle_date, BattleMain.owner_id == user_id)
    result = await db.execute(stmt)
    main = result.scalars().first()
    if not main: return None
    return {"main": main, "detail": main.detail}

async def delete_battle_record(db: AsyncSession, battle_date: datetime, user_id: int) -> bool:
    """특정 전투 기록을 삭제합니다 (BattleDetail은 Cascade 삭제되며, MonthlySummary 실시간 차감)."""
    try:
        stmt = select(BattleMain).filter(BattleMain.battle_date == battle_date, BattleMain.owner_id == user_id)
        result = await db.execute(stmt)
        record = result.scalars().first()
        if record:
            # 삭제하기 전에 요약 대장에서 수치 차감
            await update_monthly_summary_remove(
                db, 
                user_id, 
                battle_date, 
                record.coin_earned or 0, 
                record.cells_earned or 0, 
                record.reroll_shards_earned or 0
            )
            await db.delete(record)
            await db.commit()
            return True
        return False
    except Exception as e:
        await db.rollback()
        print(f"❌ [Delete Error] 삭제 트랜잭션 롤백됨: {e}")
        return False

async def update_battle_memo(db: AsyncSession, battle_date: datetime, user_id: int, notes: str) -> bool:
    """특정 전투 기록의 메모를 수정합니다."""
    try:
        stmt = select(BattleMain).filter(BattleMain.battle_date == battle_date, BattleMain.owner_id == user_id)
        result = await db.execute(stmt)
        record = result.scalars().first()
        if record:
            record.notes = notes
            await db.commit()
            return True
        return False
    except Exception as e:
        await db.rollback()
        print(f"❌ [Memo Update Error] 메모 수정 트랜잭션 롤백됨: {e}")
        return False