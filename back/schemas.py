"""
파일명: thetower/back/schemas.py
용도: Pydantic 모델을 이용한 데이터 검증(Validation) 및 응답(Response) 스키마 정의
구조: 인증, 게임 데이터, 전투 리포트, 통계, 뷰 모델
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# =================================================================
# 1. 유저 및 인증 관련 스키마 (User & Auth)
# =================================================================

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    """회원가입 요청 스키마"""
    password: str

class UserResponse(UserBase):
    """사용자 정보 응답 스키마"""
    id: int
    is_active: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """토큰 페이로드 데이터 스키마"""
    username: Optional[str] = None

# =================================================================
# 2. 게임 진행도 및 모듈 관련 스키마 (Progress & Modules)
# =================================================================

class ProgressBase(BaseModel):
    progress_json: Dict[str, Any]

class ProgressResponse(ProgressBase):
    """게임 진행 상황 응답 스키마"""
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class UserModulesBase(BaseModel):
    inventory_json: Dict[str, Any]
    equipped_json: Dict[str, Any]

class UserModulesResponse(UserModulesBase):
    """모듈 인벤토리 응답 스키마"""
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# =================================================================
# 3. 전투 기록 관련 스키마 (Battle Report)
# =================================================================

class BattleCreate(BaseModel):
    """전투 기록 생성 요청 스키마 (파싱된 데이터 전송용)"""
    battle_date: str
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
    
    top_damages: List[str] = [] 
    
    death_wave_ratio: Optional[str] = None
    spotlight_ratio: Optional[str] = None
    golden_bot_ratio: Optional[str] = None

    combat_json: Dict[str, Any] = {}
    utility_json: Dict[str, Any] = {}
    enemy_json: Dict[str, Any] = {}
    bot_json: Dict[str, Any] = {}

    notes: Optional[str] = None

class BattleMainResponse(BaseModel):
    """전투 기록 요약 응답 스키마 (목록 조회용)"""
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
    
    total_enemies: Optional[int] = 0 # 추가: 전체 적 처치 수
    best_coins_per_minute: Optional[int] = None # 추가: 분당 최고 코인 수
    
    notes: Optional[str] = None
    top_damages: List[str] = [] 
    death_wave_ratio: Optional[str] = None
    spotlight_ratio: Optional[str] = None
    golden_bot_ratio: Optional[str] = None
    class Config:
        from_attributes = True

class BattleDetailResponse(BaseModel):
    """전투 기록 상세 JSON 응답 스키마"""
    combat_json: Dict[str, Any] = {}
    utility_json: Dict[str, Any] = {}
    enemy_json: Dict[str, Any] = {}
    bot_json: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class FullReportResponse(BaseModel):
    """전투 기록 요약 + 상세 통합 응답 스키마"""
    main: BattleMainResponse
    detail: BattleDetailResponse

# =================================================================
# 4. 통계 관련 스키마 (Stats)
# =================================================================

class DailyStat(BaseModel):
    """일간 통계 항목"""
    date: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyStatsResponse(BaseModel):
    """주간 통계 응답"""
    daily_stats: List[DailyStat]

class WeeklyTrendStat(BaseModel):
    """주간 트렌드 항목"""
    week_start_date: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float

class WeeklyTrendResponse(BaseModel):
    """주간 트렌드 응답"""
    weekly_stats: List[WeeklyTrendStat]

class MonthlyTrendStat(BaseModel):
    """월간 트렌드 항목"""
    month: str
    total_coins: int
    total_cells: int
    coin_growth: float
    cell_growth: float
    is_current: Optional[bool] = False

class MonthlyTrendResponse(BaseModel):
    """월간 트렌드 응답"""
    monthly_stats: List[MonthlyTrendStat]

# =================================================================
# 5. 기록실 최적화 뷰 스키마 (History View)
# =================================================================

class MonthlySummary(BaseModel):
    """월별 자원 획득 요약 정보"""
    month_key: str        # 예: "2023-12"
    count: int            # 해당 월의 게임 수
    total_coins: int      # 해당 월의 총 코인 획득량
    total_cells: int      # 해당 월의 총 셀 획득량
    total_shards: int     # 해당 월의 총 다시 뽑기 파편 획득량

class HistoryViewResponse(BaseModel):
    """기록실 메인 뷰 응답 스키마"""
    recent_reports: List[BattleMainResponse]  # 최근 7일치 상세 기록
    monthly_summaries: List[MonthlySummary]   # 그 이전 데이터들의 월별 요약

class TierRecordSchema(BaseModel):
    """티어별 최고 기록 응답 스키마"""
    tier: int
    max_wave: int
    my_wave: int = 0  # 사용자의 해당 티어 최고 기록

    class Config:
        from_attributes = True

# =================================================================
# V2 전투 기록 관련 스키마
# =================================================================

class BattleMainV2Schema(BaseModel):
    """BattleMainV2 응답 스키마 - 기록 섹션 및 신규 지표"""
    battle_date: datetime
    owner_id: int

    cells_per_hour: Optional[int] = None

    best_coins_per_minute: Optional[int] = None
    max_wave_skip: Optional[int] = None
    best_skip_coins: Optional[int] = None
    best_skip_cells: Optional[int] = None
    max_smart_missile_stack: Optional[int] = None
    max_golden_combo: Optional[int] = None
    best_golden_combo_coins: Optional[int] = None
    max_inner_mine_charge: Optional[int] = None

    class Config:
        from_attributes = True


class BattleDetailV2Schema(BaseModel):
    """BattleDetailV2 응답 스키마 - 섹션별 JSON"""
    damage_json: Dict[str, Any] = {}
    utility_json: Dict[str, Any] = {}
    stats_json: Dict[str, Any] = {}
    enemy_json: Dict[str, Any] = {}
    coin_json: Dict[str, Any] = {}
    currency_json: Dict[str, Any] = {}
    kill_source_json: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class FullReportV2Response(BaseModel):
    """V2 전투 기록 통합 응답 스키마 (main + v2_main + v2_detail)"""
    main: BattleMainResponse          # 기존 BattleMain 데이터
    v2_main: Optional[BattleMainV2Schema] = None      # V2 신규 컬럼 (없으면 V1 데이터)
    detail: Optional[BattleDetailResponse] = None     # V1 detail (V1 유저)
    v2_detail: Optional[BattleDetailV2Schema] = None  # V2 detail (V2 유저)