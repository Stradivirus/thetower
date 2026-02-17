"""
파일명: thetower/back/routers/max_wave.py
용도: 티어별 최고 웨이브 기록 조회 API 라우터
기능: 전 서버 최고 기록과 내 최고 기록을 병합하여 반환
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import database, schemas, models
from crud import max_wave
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
    티어별 서버 전체 최고 기록과 로그인한 사용자의 개인 최고 기록을 조회하여 반환합니다.
    - 서버 전체 기록: TierRecord 테이블에서 조회
    - 개인 최고 기록: BattleMain 테이블에서 사용자 ID로 그룹화하여 최대 웨이브 추출
    """
    
    # 1. 서버 전체 최고 기록 조회
    global_records = max_wave.get_all_tier_records(db)
    global_map = {r.tier: r.max_wave for r in global_records}

    # 2. 내 개인 최고 기록 집계 (Raw SQL 스타일 쿼리)
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

    # 3. 데이터 병합 (티어 기준으로 서버 기록과 개인 기록 매칭)
    all_tiers = set(global_map.keys()) | set(my_map.keys())
    
    result = []
    for t in sorted(all_tiers):
        result.append({
            "tier": t,
            "max_wave": global_map.get(t, 0),
            "my_wave": my_map.get(t, 0)
        })
        
    return result