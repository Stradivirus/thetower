from fastapi import APIRouter, Depends, HTTPException, Form, Body
from sqlalchemy.orm import Session
from database import get_db
from schemas import BattleMainResponse, FullReportResponse
import crud
from parser import parse_battle_report
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/", response_model=BattleMainResponse)
def create_report(
    report_text: str = Form(...), 
    notes: Optional[str] = Form(None), # 메모 입력 추가
    db: Session = Depends(get_db)
):
    """전투 보고서 텍스트와 메모를 받아 저장"""
    try:
        parsed_data = parse_battle_report(report_text)
        result = crud.create_battle_record(db, parsed_data, notes)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[BattleMainResponse])
def get_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """가벼운 리스트 조회 (Main 데이터만)"""
    return crud.get_battle_mains(db, skip=skip, limit=limit)

@router.get("/{battle_date}", response_model=FullReportResponse)
def get_report_detail(battle_date: str, db: Session = Depends(get_db)):
    """상세 조회 (JSON 데이터 포함)"""
    try:
        date_obj = datetime.fromisoformat(battle_date)
        report = crud.get_full_report(db, date_obj)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")