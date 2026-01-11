# back/routers/max_wave.py

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import database, schemas, models
from crud import max_wave

# [수정] .auth -> auth (상대 경로 점(.) 제거)
# 이제 back/routers/auth.py가 아니라 back/auth.py에서 가져옵니다.
from auth import get_current_user 

router = APIRouter(
    prefix="/api",
    tags=["max_wave"],
)

@router.get("/max-waves", response_model=List[schemas.TierRecordSchema])
def get_max_waves(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    서버 전체 최고 기록과 나의 최고 기록을 병합하여 반환합니다.
    """
    
    # 1. 서버 전체 최고 기록 (Global)
    global_records = max_wave.get_all_tier_records(db)
    global_map = {r.tier: r.max_wave for r in global_records}

    # 2. 내 최고 기록 (My Personal)
    my_records_query = db.query(
        models.BattleMain.tier,
        func.max(models.BattleMain.wave)
    ).filter(
        models.BattleMain.owner_id == current_user.id
    ).group_by(
        models.BattleMain.tier
    ).all()

    my_map = {}
    for tier_str, wave_val in my_records_query:
        if tier_str and tier_str.isdigit():
            my_map[int(tier_str)] = wave_val

    # 3. 데이터 병합 (Merge)
    all_tiers = set(global_map.keys()) | set(my_map.keys())
    
    result = []
    for t in sorted(all_tiers):
        result.append({
            "tier": t,
            "max_wave": global_map.get(t, 0),
            "my_wave": my_map.get(t, 0)
        })
        
    return result