from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db
from schemas import BattleReportResponse, CombatStatsResponse, UtilityStatsResponse, EnemyStatsResponse, BotGuardianStatsResponse, FullReportResponse
import crud
from parser import parse_battle_report
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/", response_model=BattleReportResponse)
def create_report(report_text: str = Form(), db: Session = Depends(get_db)):  # Form() 추가
    """전투 보고서 텍스트를 받아서 파싱 후 저장"""
    try:
        parsed_data = parse_battle_report(report_text)
        result = crud.create_full_report(db, parsed_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[BattleReportResponse])
def get_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """전투 보고서 목록 조회"""
    return crud.get_battle_reports(db, skip=skip, limit=limit)

@router.get("/{battle_date}", response_model=FullReportResponse)
def get_report(battle_date: str, db: Session = Depends(get_db)):
    """특정 날짜의 전체 보고서 조회"""
    try:
        date = datetime.fromisoformat(battle_date)
        report = crud.get_full_report(db, date)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.get("/{battle_date}/combat", response_model=CombatStatsResponse)
def get_combat(battle_date: str, db: Session = Depends(get_db)):
    """전투 통계만 조회"""
    try:
        date = datetime.fromisoformat(battle_date)
        stats = crud.get_combat_stats(db, date)
        if not stats:
            raise HTTPException(status_code=404, detail="Combat stats not found")
        return stats
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.get("/{battle_date}/utility", response_model=UtilityStatsResponse)
def get_utility(battle_date: str, db: Session = Depends(get_db)):
    """유틸리티 통계만 조회"""
    try:
        date = datetime.fromisoformat(battle_date)
        stats = crud.get_utility_stats(db, date)
        if not stats:
            raise HTTPException(status_code=404, detail="Utility stats not found")
        return stats
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.get("/{battle_date}/enemy", response_model=EnemyStatsResponse)
def get_enemy(battle_date: str, db: Session = Depends(get_db)):
    """적 통계만 조회"""
    try:
        date = datetime.fromisoformat(battle_date)
        stats = crud.get_enemy_stats(db, date)
        if not stats:
            raise HTTPException(status_code=404, detail="Enemy stats not found")
        return stats
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.get("/{battle_date}/bot", response_model=BotGuardianStatsResponse)
def get_bot(battle_date: str, db: Session = Depends(get_db)):
    """봇/가디언 통계만 조회"""
    try:
        date = datetime.fromisoformat(battle_date)
        stats = crud.get_bot_guardian_stats(db, date)
        if not stats:
            raise HTTPException(status_code=404, detail="Bot/Guardian stats not found")
        return stats
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")