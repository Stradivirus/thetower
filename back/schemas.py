from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# 1. 유저 및 인증 (User & Auth) - [기존 코드 복구]
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

# 2. 게임 진행도 및 모듈 (Progress)
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

# 3. 전투 기록 (Report)

class DamageItem(BaseModel):
    name: str
    value: str
    raw: float = 0.0  # [New] 정렬 및 계산을 위한 숫자형 데이터

class BattleMainResponse(BaseModel):
    battle_date: datetime
    created_at: Optional[datetime] = None
    
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
    damage_taken: str
    
    notes: Optional[str] = None
    
    top_damages: List[DamageItem] = []

    class Config:
        from_attributes = True

class BattleDetailResponse(BaseModel):
    combat_json: Dict[str, Any] = {}
    utility_json: Dict[str, Any] = {}
    enemy_json: Dict[str, Any] = {}
    bot_json: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class FullReportResponse(BaseModel):
    main: BattleMainResponse
    detail: BattleDetailResponse

# 4. 통계 (Stats)
class DailyStat(BaseModel):
    date: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyStatsResponse(BaseModel):
    daily_stats: List[DailyStat]

class WeeklyTrendStat(BaseModel):
    week_start_date: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyTrendResponse(BaseModel):
    weekly_stats: List[WeeklyTrendStat]

# 5. 기록실 최적화 뷰 (History View)
class MonthlySummary(BaseModel):
    month_key: str        # 예: "2023-12"
    count: int            # 게임 수
    total_coins: int      # 총 코인
    total_cells: int      # 총 셀
    total_shards: int     # 총 파편

class HistoryViewResponse(BaseModel):
    recent_reports: List[BattleMainResponse]  # 최근 7일치 상세
    monthly_summaries: List[MonthlySummary]   # 그 이전 월별 요약