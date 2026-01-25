from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, get_db_replica
from schemas import (
    BattleMainResponse, 
    FullReportResponse, 
    WeeklyStatsResponse, 
    WeeklyTrendResponse, 
    HistoryViewResponse
)
import crud
# [중요] 최고 기록 갱신을 위해 max_wave 모듈을 crud에서 가져옵니다.
from crud import max_wave as max_wave_crud 
from parser import parse_battle_report
from datetime import datetime
from typing import List, Optional
from models import User
from auth import get_current_user
import slack
import re

router = APIRouter(prefix="/api/reports", tags=["reports"])

# 1. 생성 (POST) - 텍스트(Form) 수신 및 파싱
@router.post("/", response_model=BattleMainResponse)
def create_report(
    report_text: str = Form(...), 
    notes: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. 텍스트 파싱 (기존 로직 유지)
        parsed_data = parse_battle_report(report_text)
        
        # 2. DB 저장 (기존 로직 유지)
        result = crud.create_battle_record(db, parsed_data, current_user.id, notes)
        
        # [추가됨] 안전장치: 결과가 없으면(유효하지 않은 데이터) 에러 처리해서 500 에러 방지
        if not result:
            print(f"⚠️ [User {current_user.id}] Invalid data, skipping save.")
            raise HTTPException(status_code=400, detail="Invalid data provided or data skipped")
        
        # 3. [추가된 핵심 기능] 서버 최고 기록(Max Wave) 갱신 시도
        try:
            main_data = parsed_data.get('main', {})
            
            # 티어 문자열("Tier 15" 등)에서 숫자만 추출
            tier_str = str(main_data.get('tier', '1'))
            tier_match = re.search(r'\d+', tier_str)
            tier_val = int(tier_match.group()) if tier_match else 0
            
            wave_val = int(main_data.get('wave', 0))

            # 유효한 티어와 웨이브라면 기록 갱신 시도
            if tier_val > 0 and wave_val > 0:
                max_wave_crud.update_tier_record(db, tier=tier_val, wave=wave_val)
        except Exception as e:
            # 최고 기록 갱신 실패하더라도 메인 리포트 저장은 성공했으므로 에러를 던지지 않고 로그만 남김
            print(f"Max Wave Update Skipped: {e}")

        # 4. 알림 전송 (유저 카운트는 없고, 50건 단위 기록 알림만 유지)
        if background_tasks:
            try:
                # crud.count_reports 함수가 존재하는지 확인해주세요 (없으면 에러 로그 찍히고 넘어감)
                total_count = crud.count_reports(db)
                if total_count > 0 and total_count % 50 == 0:
                    msg = f"⚔️ [New Record] {total_count}번째 전투 기록이 등록되었습니다!"
                    background_tasks.add_task(slack.send_slack_notification, msg)
            except Exception as e:
                print(f"Notification Error: {e}")
                pass

        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Report Creation Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# 2. 통계 및 목록 조회 

@router.get("/view", response_model=HistoryViewResponse)
def get_history_view_api(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return crud.get_history_view(db, current_user.id)

@router.get("/month/{month_key}", response_model=List[BattleMainResponse])
def get_reports_by_month_api(
    month_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        datetime.strptime(month_key, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
        
    return crud.get_reports_by_month(db, current_user.id, month_key)

@router.get("/recent", response_model=List[BattleMainResponse])
def get_recent_reports(
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_weekly_stats(db, current_user.id)

@router.get("/weekly-trends", response_model=WeeklyTrendResponse)
def get_weekly_trends_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_weekly_trends(db, current_user.id)

@router.get("/monthly-trends")
def get_monthly_trends_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.get_monthly_trends(db, current_user.id)

# 3. 상세 조회 및 삭제

@router.get("/{battle_date}", response_model=FullReportResponse)
def get_report_detail(
    battle_date: str, 
    db: Session = Depends(get_db_replica),
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