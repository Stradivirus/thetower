# back/routers/max_wave.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, schemas # [수정] 상대경로 제거
from crud import max_wave # [수정] crud 패키지에서 바로 import

router = APIRouter(
    prefix="/api",
    tags=["max_wave"],
)

@router.get("/max-waves", response_model=List[schemas.TierRecordSchema])
def get_max_waves(db: Session = Depends(database.get_db)):
    return max_wave.get_all_tier_records(db)