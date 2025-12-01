from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

# [Main] 리스트 조회용 스키마
class BattleMainBase(BaseModel):
    battle_date: datetime
    tier: str
    wave: int
    game_time: str
    real_time: str
    
    coin_earned: int
    coins_per_hour: int
    cells_earned: int
    reroll_shards_earned: int
    
    killer: str
    damage_dealt: str
    notes: Optional[str] = None

class BattleMainResponse(BattleMainBase):
    class Config:
        from_attributes = True

# [Detail] 상세 조회용 스키마
class BattleDetailResponse(BaseModel):
    battle_date: datetime
    combat_json: Dict[str, Any]
    utility_json: Dict[str, Any]
    enemy_json: Dict[str, Any]
    bot_json: Dict[str, Any]

    class Config:
        from_attributes = True

# [Full] 전체 응답 스키마
class FullReportResponse(BaseModel):
    main: BattleMainResponse
    detail: BattleDetailResponse