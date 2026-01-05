# back/models.py
from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index, ForeignKeyConstraint, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    
    reports = relationship("BattleMain", back_populates="owner")
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")
    modules = relationship("UserModules", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    progress_json = Column(JSONB) 
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="progress")

class UserModules(Base):
    __tablename__ = "user_modules"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    inventory_json = Column(JSONB, default={}) 
    equipped_json = Column(JSONB, default={})
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="modules")

class BattleMain(Base):
    __tablename__ = "battle_mains"
    
    # [Optimized] 복합 인덱스
    __table_args__ = (
        Index('idx_owner_date', 'owner_id', 'battle_date'),
    )
    
    # [변경] 복합 키 (Composite PK) 설정
    battle_date = Column(DateTime, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="reports")

    tier = Column(String)
    wave = Column(Integer)
    game_time = Column(String)
    real_time = Column(String)
    
    coin_earned = Column(BigInteger)
    coins_per_hour = Column(BigInteger)
    cells_earned = Column(Integer)
    reroll_shards_earned = Column(Integer)

    killer = Column(String)
    damage_dealt = Column(String)
    damage_taken = Column(String)

    notes = Column(Text, nullable=True)

    detail = relationship("BattleDetail", back_populates="main", uselist=False, cascade="all, delete-orphan")

class BattleDetail(Base):
    __tablename__ = "battle_details"
    
    # [변경] 컬럼 정의
    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)
    
    # [추가] 복합 외래 키 + Cascade
    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )
    
    total_enemies = Column(Integer, default=0)
    death_wave_kills = Column(Integer, default=0)
    spotlight_kills = Column(Integer, default=0)
    
    # [New] 황금 봇 처치 수 추가
    golden_bot_kills = Column(Integer, default=0)
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    # 관계 설정
    main = relationship("BattleMain", back_populates="detail")

class DailyStats(Base):
    """
    [New] 일별 통계 요약 테이블
    """
    __tablename__ = "daily_stats"
    
    owner_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    target_date = Column(Date, primary_key=True)
    
    total_coins = Column(BigInteger, default=0)
    total_cells = Column(Integer, default=0)
    total_shards = Column(Integer, default=0)
    
    game_count = Column(Integer, default=0)
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))