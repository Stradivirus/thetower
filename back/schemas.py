from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

# --- User & Token ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Progress ---
class ProgressBase(BaseModel):
    progress_json: Dict[str, Any]

class ProgressResponse(ProgressBase):
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- [Modified] Modules ---
# 보유와 장착을 분리하여 요청/응답 처리
class UserModulesBase(BaseModel):
    inventory_json: Dict[str, Any]
    equipped_json: Dict[str, Any]

class UserModulesResponse(UserModulesBase):
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Reports ---
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

class BattleDetailResponse(BaseModel):
    battle_date: datetime
    combat_json: Dict[str, Any]
    utility_json: Dict[str, Any]
    enemy_json: Dict[str, Any]
    bot_json: Dict[str, Any]
    class Config:
        from_attributes = True

class FullReportResponse(BaseModel):
    main: BattleMainResponse
    detail: BattleDetailResponse