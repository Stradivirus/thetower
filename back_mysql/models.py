"""
파일명: thetower/back_mysql/models.py
용도: MySQL 8.4 / Oracle MySQL HeatWave 호환 데이터베이스 테이블 스키마 정의 (SQLAlchemy ORM)
수정사항:
- PostgreSQL JSONB -> 표준 MySQL JSON 타입으로 변경
- 모든 String 컬럼에 VARCHAR 길이 명시
- 대용량 게임 수치를 위해 Numeric(65, 0) 정밀도 명시
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Index, ForeignKeyConstraint, Numeric, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class User(Base):
    """사용자 계정 정보 테이블"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)
    
    reports = relationship("BattleMain", back_populates="owner")
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")
    modules = relationship("UserModules", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProgress(Base):
    """사용자의 게임 진행 상황(카드, UW 등)을 JSON 형태로 저장"""
    __tablename__ = "user_progress"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    progress_json = Column(JSON) 
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user = relationship("User", back_populates="progress")

class UserModules(Base):
    """사용자의 모듈 인벤토리 및 장착 정보를 저장"""
    __tablename__ = "user_modules"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    inventory_json = Column(JSON, default=dict) 
    equipped_json = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user = relationship("User", back_populates="modules")

class BattleMain(Base):
    """
    전투 기록의 주요 통계 정보 테이블
    - 요약 데이터와 자주 조회되는 항목들을 컬럼으로 분리
    """
    __tablename__ = "battle_mains"
    
    __table_args__ = (
        Index('idx_owner_date', 'owner_id', 'battle_date'),
    )
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    owner = relationship("User", back_populates="reports")

    tier = Column(String(20))
    wave = Column(Integer)
    game_time = Column(String(50))
    real_time = Column(String(50))
    
    coin_earned = Column(Numeric(65, 0))
    coins_per_hour = Column(Numeric(65, 0))
    cells_earned = Column(Numeric(65, 0))
    reroll_shards_earned = Column(Numeric(65, 0))
    best_coins_per_minute = Column(Numeric(65, 0), nullable=True)

    killer = Column(String(100))
    damage_dealt = Column(String(100))
    damage_taken = Column(String(100))

    total_enemies = Column(Numeric(65, 0), default=0)
    death_wave_kills = Column(Numeric(65, 0), default=0)
    spotlight_kills = Column(Numeric(65, 0), default=0)
    golden_bot_kills = Column(Numeric(65, 0), default=0)
    
    top_damages = Column(JSON, default=list)

    notes = Column(Text, nullable=True)

    # --- 관계 설정 및 Cascade ---
    detail = relationship("BattleDetail", back_populates="main", uselist=False, cascade="all, delete-orphan")
    v2_main = relationship("BattleMainV2", back_populates="main", uselist=False, cascade="all, delete-orphan")
    v2_detail = relationship("BattleDetailV2", back_populates="main", uselist=False, cascade="all, delete-orphan")

    @property
    def death_wave_ratio(self) -> str:
        total = float(self.total_enemies or 0)
        if total > 0:
            return f"{round(float(self.death_wave_kills or 0) / total * 100, 1)}%"
        return "0%"

    @property
    def spotlight_ratio(self) -> str:
        total = float(self.total_enemies or 0)
        if total > 0:
            return f"{round(float(self.spotlight_kills or 0) / total * 100, 1)}%"
        return "0%"

    @property
    def golden_bot_ratio(self) -> str:
        total = float(self.total_enemies or 0)
        if total > 0:
            return f"{round(float(self.golden_bot_kills or 0) / total * 100, 1)}%"
        return "0%"

class BattleDetail(Base):
    """전투 기록의 상세 데이터(JSON) 테이블"""
    __tablename__ = "battle_details"
    
    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )
    
    combat_json = Column(JSON)
    utility_json = Column(JSON)
    enemy_json = Column(JSON)
    bot_json = Column(JSON)
    
    main = relationship("BattleMain", back_populates="detail")

class TierRecord(Base):
    """티어별 전 서버 최고 웨이브 기록 테이블"""
    __tablename__ = "tier_records"
    tier = Column(Integer, primary_key=True, index=True, autoincrement=False)
    max_wave = Column(Integer, nullable=False)

# =================================================================
# V2 모델 영역
# =================================================================

class BattleMainV2(Base):
    """data2 포맷 전용 추가 통계 테이블"""
    __tablename__ = "battle_mains_v2"

    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )

    cells_per_hour = Column(Numeric(65, 0), nullable=True)
    max_wave_skip = Column(Integer, nullable=True)
    best_skip_coins = Column(Numeric(65, 0), nullable=True)
    best_skip_cells = Column(Numeric(65, 0), nullable=True)
    max_smart_missile_stack = Column(Integer, nullable=True)
    max_golden_combo = Column(Integer, nullable=True)
    best_golden_combo_coins = Column(Numeric(65, 0), nullable=True)
    max_inner_mine_charge = Column(Integer, nullable=True)

    main = relationship(
        "BattleMain",
        foreign_keys=[battle_date, owner_id],
        primaryjoin="and_(BattleMainV2.battle_date==BattleMain.battle_date, BattleMainV2.owner_id==BattleMain.owner_id)",
        back_populates="v2_main"
    )

class BattleDetailV2(Base):
    """data2 포맷 전용 상세 JSON 테이블"""
    __tablename__ = "battle_details_v2"

    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )

    damage_json = Column(JSON, default=dict)
    utility_json = Column(JSON, default=dict)
    stats_json = Column(JSON, default=dict)
    enemy_json = Column(JSON, default=dict)
    coin_json = Column(JSON, default=dict)
    currency_json = Column(JSON, default=dict)
    kill_source_json = Column(JSON, default=dict)

    main = relationship(
        "BattleMain",
        foreign_keys=[battle_date, owner_id],
        primaryjoin="and_(BattleDetailV2.battle_date==BattleMain.battle_date, BattleDetailV2.owner_id==BattleMain.owner_id)",
        back_populates="v2_detail"
    )

class MonthlySummary(Base):
    """사용자별 월간 전투 기록 요약 통계 테이블"""
    __tablename__ = "monthly_summaries"

    month_key = Column(String(7), primary_key=True)  # 'YYYY-MM' 포맷
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    count = Column(Integer, default=0, nullable=False)
    total_coins = Column(Numeric(65, 0), default=0, nullable=False)
    total_cells = Column(Numeric(65, 0), default=0, nullable=False)
    total_shards = Column(Numeric(65, 0), default=0, nullable=False)
