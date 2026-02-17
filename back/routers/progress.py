"""
파일명: thetower/back/routers/progress.py
용도: 사용자 게임 진행도(카드, UW 등) 관리 API 라우터
기능: 내 진행도 조회 및 동기화(저장)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import schemas, crud
from models import User
from auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/", response_model=schemas.ProgressResponse)
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자의 게임 진행도 데이터를 조회합니다."""
    progress = crud.get_user_progress(db, current_user.id)
    if not progress:
        return {"progress_json": {}}
    return progress

@router.post("/", response_model=schemas.ProgressResponse)
def save_progress(
    data: schemas.ProgressBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 게임 진행도 데이터를 업데이트(저장)합니다."""
    return crud.update_user_progress(db, current_user.id, data.progress_json)