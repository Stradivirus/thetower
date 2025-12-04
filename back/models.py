from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Integer, default=1)

    # 1:N 관계 (리포트)
    reports = relationship("BattleMain", back_populates="owner")
    
    # 1:1 관계 (진행 상황 - 스톤 등)
    progress = relationship("UserProgress", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # 1:1 관계 (모듈) [New]
    modules = relationship("UserModules", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    progress_json = Column(JSONB) 
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="progress")

# [New] 모듈 데이터 저장용 테이블
class UserModules(Base):
    __tablename__ = "user_modules"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    # 보유 현황 + 장착 현황을 모두 이 JSON에 저장
    # 예: { "아스트랄 구조": 1, "equipped_cannon": "아스트랄 구조" }
    modules_json = Column(JSONB, default={}) 
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="modules")

class BattleMain(Base):
    __tablename__ = "battle_mains"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner_id = Column(Integer, ForeignKey("users.id"))
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
    
    battle_date = Column(DateTime, ForeignKey("battle_mains.battle_date"), primary_key=True)
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    main = relationship("BattleMain", back_populates="detail")