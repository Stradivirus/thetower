"""
파일명: thetower/back/models.py
용도: 데이터베이스 테이블 스키마 정의 (SQLAlchemy ORM)
구조: 사용자(User), 진행도(Progress), 모듈(Modules), 전투 기록(BattleMain/Detail), 티어 기록(TierRecord)
"""
from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime, timezone

class User(Base):
    """사용자 계정 정보 테이블"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)
    
    reports = relationship("BattleMain", back_populates="owner")
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")
    modules = relationship("UserModules", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProgress(Base):
    """사용자의 게임 진행 상황(카드, UW 등)을 JSONB 형태로 저장"""
    __tablename__ = "user_progress"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    progress_json = Column(JSONB) 
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="progress")

class UserModules(Base):
    """사용자의 모듈 인벤토리 및 장착 정보를 저장"""
    __tablename__ = "user_modules"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    inventory_json = Column(JSONB, default={}) 
    equipped_json = Column(JSONB, default={})
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
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

    total_enemies = Column(Integer, default=0)
    death_wave_kills = Column(Integer, default=0)
    spotlight_kills = Column(Integer, default=0)
    golden_bot_kills = Column(Integer, default=0)
    
    top_damages = Column(JSONB, default=[])

    notes = Column(Text, nullable=True)

    detail = relationship("BattleDetail", back_populates="main", uselist=False, cascade="all, delete-orphan")

class BattleDetail(Base):
    """
    전투 기록의 상세 데이터(JSONB) 테이블
    - 무거운 원본 파싱 데이터를 보관하며 BattleMain과 1:1 관계
    """
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
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    main = relationship("BattleMain", back_populates="detail")

class TierRecord(Base):
    """티어별 전 서버 최고 웨이브 기록 테이블"""
    __tablename__ = "tier_records"

    tier = Column(Integer, primary_key=True, index=True) # 티어가 고유 ID 역할
    max_wave = Column(Integer, nullable=False)