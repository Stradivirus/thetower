from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db, get_db_read  # [Modified] get_db_read import
from schemas import BattleMainResponse, FullReportResponse
import crud
from parser import parse_battle_report
from datetime import datetime
from typing import List, Optional
from models import User
from auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

# 리포트 생성은 쓰기 작업이므로 get_db(메인 DB) 사용
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

# [New] 최근 3일 리포트 조회 - 읽기 전용 DB 사용
@router.get("/recent", response_model=List[BattleMainResponse])
def get_recent_reports(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    return crud.get_recent_reports(db, current_user.id)

# [New] 과거 리포트 조회 - 읽기 전용 DB 사용
@router.get("/history", response_model=List[BattleMainResponse])
def get_history_reports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_history_reports(db, current_user.id, skip=skip, limit=limit)

# 상세 리포트 조회 - 읽기 전용 DB 사용
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