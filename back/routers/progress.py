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
    return crud.update_user_progress(db, current_user.id, data.progress_json)