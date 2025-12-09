from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db, get_db_read
from schemas import BattleMainResponse, FullReportResponse, WeeklyStatsResponse
import crud
from parser import parse_battle_report
from datetime import datetime
from typing import List, Optional
from models import User
from auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

# --- 1. 리포트 생성 (POST) ---
@router.post("/", response_model=BattleMainResponse)
def create_report(
    report_text: str = Form(...), 
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_data = parse_battle_report(report_text)
        result = crud.create_battle_record(db, parsed_data, current_user.id, notes)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 2. 고정 경로 조회 (GET) ---
# [중요] 이 함수들은 반드시 /{battle_date}보다 먼저 와야 합니다!

@router.get("/recent", response_model=List[BattleMainResponse])
def get_recent_reports(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    return crud.get_recent_reports(db, current_user.id)

@router.get("/history", response_model=List[BattleMainResponse])
def get_history_reports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_history_reports(db, current_user.id, skip=skip, limit=limit)

@router.get("/weekly-stats", response_model=WeeklyStatsResponse)
def get_weekly_stats_api(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    return crud.get_weekly_stats(db, current_user.id)

# --- 3. 동적 경로 조회 (GET) ---
# [중요] 변수({battle_date})를 받는 경로는 가장 마지막에 두어야 합니다.
@router.get("/{battle_date}", response_model=FullReportResponse)
def get_report_detail(
    battle_date: str, 
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    try:
        date_obj = datetime.fromisoformat(battle_date)
        report = crud.get_full_report(db, date_obj, current_user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")