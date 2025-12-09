from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

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

class ProgressBase(BaseModel):
    progress_json: Dict[str, Any]

class ProgressResponse(ProgressBase):
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class UserModulesBase(BaseModel):
    inventory_json: Dict[str, Any]
    equipped_json: Dict[str, Any]

class UserModulesResponse(UserModulesBase):
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class DamageItem(BaseModel):
    name: str
    value: str

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
    top_damages: List[DamageItem] = [] 
    
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

# --- 통계 관련 스키마 ---

# 1. 일간(Daily) 통계
class DailyStat(BaseModel):
    date: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyStatsResponse(BaseModel):
    daily_stats: List[DailyStat]

# 2. 주간(Weekly) 트렌드 [New]
class WeeklyTrendStat(BaseModel):
    week_start_date: str  # 해당 주 월요일
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyTrendResponse(BaseModel):
    weekly_stats: List[WeeklyTrendStat]