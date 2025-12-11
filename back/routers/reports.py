from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, get_db_read
# [Modified] 새로 추가된 스키마 import
from schemas import (
    BattleMainResponse, 
    FullReportResponse, 
    WeeklyStatsResponse, 
    WeeklyTrendResponse, 
    HistoryViewResponse
)
import crud
from parser import parse_battle_report
from datetime import datetime
from typing import List, Optional
from models import User
from auth import get_current_user
import slack

router = APIRouter(prefix="/api/reports", tags=["reports"])

# 1. 생성 (POST)
@router.post("/", response_model=BattleMainResponse)
def create_report(
    report_text: str = Form(...), 
    notes: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        parsed_data = parse_battle_report(report_text)
        result = crud.create_battle_record(db, parsed_data, current_user.id, notes)
        
        if background_tasks:
            try:
                total_count = crud.count_reports(db)
                if total_count % 10 == 0:
                    msg = f"⚔️ [New Record] {total_count}번째 전투 기록이 등록되었습니다!"
                    background_tasks.add_task(slack.send_slack_notification, msg)
            except Exception as e:
                print(f"Notification Check Error: {e}")

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. 통계 및 목록 조회

# [New] 기록실 메인 뷰 (최근 7일 상세 + 월별 요약) - 최적화된 API
@router.get("/view", response_model=HistoryViewResponse)
def get_history_view_api(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    return crud.get_history_view(db, current_user.id)

# [New] 월별 상세 기록 조회 (Lazy Load)
@router.get("/month/{month_key}", response_model=List[BattleMainResponse])
def get_reports_by_month_api(
    month_key: str,
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    # month_key validation (YYYY-MM)
    try:
        datetime.strptime(month_key, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
        
    return crud.get_reports_by_month(db, current_user.id, month_key)

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

@router.get("/weekly-trends", response_model=WeeklyTrendResponse)
def get_weekly_trends_api(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    return crud.get_weekly_trends(db, current_user.id)

# 3. 상세 조회 및 삭제

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

@router.delete("/{battle_date}")
def delete_report(
    battle_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        date_obj = datetime.fromisoformat(battle_date)
        success = crud.delete_battle_record(db, date_obj, current_user.id)
        if not success:
             raise HTTPException(status_code=404, detail="Report not found")
        return {"status": "success", "message": "Record deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")