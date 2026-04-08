"""
파일명: thetower/back/routers/reports.py
용도: 전투 기록(Battle Report) 관련 API 라우터
기능: 리포트 생성(텍스트 파싱), 조회(최근/목록/통계/상세), 최고 기록 연동 및 삭제
"""
from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, get_db_replica
from schemas import (
    BattleMainResponse,
    FullReportResponse,
    FullReportV2Response,
    WeeklyStatsResponse,
    WeeklyTrendResponse,
    HistoryViewResponse
)
import crud
from crud import max_wave as max_wave_crud
from crud.report_v2 import create_battle_record_v2
from parser import parse_battle_report
from parser_v2 import is_v2, parse_battle_report_v2
from datetime import datetime
from typing import List, Optional
from models import User
from auth import get_current_user
import slack
import re

router = APIRouter(prefix="/api/reports", tags=["reports"])

# =================================================================
# 1. 생성 (POST) - 리포트 텍스트 파싱 및 저장
# =================================================================

@router.post("/", response_model=BattleMainResponse)
def create_report(
    report_text: str = Form(...),
    notes: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    텍스트 형식의 전투 리포트를 파싱하여 DB에 저장합니다.
    - V1/V2 포맷 자동 감지 (줄 수 기준)
    - V1: 기존 BattleDetail 저장
    - V2: BattleMainV2 + BattleDetailV2 추가 저장 (BattleDetail 저장 안 함)
    - 티어별 서버 최고 기록 갱신 시도
    - 50건 단위 기록 발생 시 Slack 알림 전송 (Background Task)
    """
    try:
        # 1. 버전 감지 및 파싱
        if is_v2(report_text):
            parsed_data = parse_battle_report_v2(report_text)
            # V2는 main 데이터만 기존 create_battle_record에 넘김
            # BattleDetail은 생성하지 않도록 detail 키를 비워서 전달
            v1_compatible = {
                'main': parsed_data['main'],
                'detail': {
                    'combat_json': {},
                    'utility_json': {},
                    'enemy_json': {},
                    'bot_json': {},
                }
            }
            result = crud.create_battle_record(db, v1_compatible, current_user.id, notes)
        else:
            parsed_data = parse_battle_report(report_text)
            result = crud.create_battle_record(db, parsed_data, current_user.id, notes)

        if not result:
            print(f"⚠️ [User {current_user.id}] Invalid data, skipping save.")
            raise HTTPException(status_code=400, detail="Invalid data provided or data skipped")

        # 2. V2 전용 데이터 저장
        if is_v2(report_text):
            v2_result = create_battle_record_v2(db, parsed_data, current_user.id)
            if not v2_result:
                print(f"⚠️ [User {current_user.id}] V2 data save failed.")

        # 3. 서버 최고 기록(Max Wave) 갱신 시도
        try:
            main_data = parsed_data.get('main', {})
            tier_str = str(main_data.get('tier', '1'))
            tier_match = re.search(r'\d+', tier_str)
            tier_val = int(tier_match.group()) if tier_match else 0
            wave_val = int(main_data.get('wave', 0))

            if tier_val > 0 and wave_val > 0:
                max_wave_crud.update_tier_record(db, tier=tier_val, wave=wave_val)
        except Exception as e:
            print(f"Max Wave Update Skipped: {e}")

        # 4. 알림 전송 (50건 단위)
        if background_tasks:
            try:
                total_count = crud.count_reports(db)
                if total_count > 0 and total_count % 50 == 0:
                    msg = f"⚔️ [New Record] {total_count}번째 전투 기록이 등록되었습니다!"
                    background_tasks.add_task(slack.send_slack_notification, msg)
            except Exception as e:
                print(f"Notification Error: {e}")

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Report Creation Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# =================================================================
# 2. 통계 및 목록 조회
# =================================================================

@router.get("/view", response_model=HistoryViewResponse)
def get_history_view_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """기록실 메인 화면을 위한 최근 기록 및 월별 요약 데이터를 조회합니다."""
    return crud.get_history_view(db, current_user.id)

@router.get("/month/{month_key}", response_model=List[BattleMainResponse])
def get_reports_by_month_api(
    month_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 월에 해당하는 전투 기록 목록을 조회합니다."""
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
    """최근 7일간의 전투 기록 목록을 조회합니다."""
    return crud.get_recent_reports(db, current_user.id)

@router.get("/history", response_model=List[BattleMainResponse])
def get_history_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 전체 전투 기록을 페이징하여 조회합니다."""
    return crud.get_history_reports(db, current_user.id, skip=skip, limit=limit)

@router.get("/weekly-stats", response_model=WeeklyStatsResponse)
def get_weekly_stats_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """최근 일주일간의 자원 획득량 및 성장률 통계를 조회합니다."""
    return crud.get_weekly_stats(db, current_user.id)

@router.get("/weekly-trends", response_model=WeeklyTrendResponse)
def get_weekly_trends_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """주간 성장 트렌드 분석 데이터를 조회합니다."""
    return crud.get_weekly_trends(db, current_user.id)

@router.get("/monthly-trends")
def get_monthly_trends_api(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """월간 성장 트렌드 분석 데이터를 조회합니다."""
    return crud.get_monthly_trends(db, current_user.id)

# =================================================================
# 3. 상세 조회 및 삭제
# =================================================================

@router.get("/{battle_date}", response_model=FullReportV2Response)
def get_report_detail(
    battle_date: str,
    db: Session = Depends(get_db_replica),
    current_user: User = Depends(get_current_user)
):
    """
    특정 전투 기록의 상세 데이터를 조회합니다.
    - V1: main + detail 반환
    - V2: main + v2_main + v2_detail 반환 (detail은 None)
    - 리플리카 DB를 사용하여 대용량 상세 JSON 데이터를 로드합니다.
    """
    try:
        date_obj = datetime.fromisoformat(battle_date)
        report = crud.get_full_report(db, date_obj, current_user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # V2 데이터 조회 시도
        from models import BattleMainV2, BattleDetailV2
        v2_main = db.query(BattleMainV2).filter(
            BattleMainV2.battle_date == date_obj,
            BattleMainV2.owner_id == current_user.id
        ).first()

        v2_detail = db.query(BattleDetailV2).filter(
            BattleDetailV2.battle_date == date_obj,
            BattleDetailV2.owner_id == current_user.id
        ).first()

        return {
            "main": report["main"],
            "detail": report["detail"],       # V1이면 데이터 있음, V2면 빈 JSON
            "v2_main": v2_main,               # V1이면 None
            "v2_detail": v2_detail,           # V1이면 None
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.delete("/{battle_date}")
def delete_report(
    battle_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """전투 기록을 삭제합니다. (V2 데이터는 CASCADE로 자동 삭제)"""
    try:
        date_obj = datetime.fromisoformat(battle_date)
        success = crud.delete_battle_record(db, date_obj, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"status": "success", "message": "Record deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")