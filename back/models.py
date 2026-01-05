# back/models.py
from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index, ForeignKeyConstraint
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
    # 이제 (battle_date + owner_id) 조합이 유일해야 합니다.
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
    
    # [변경] 컬럼 정의 (여기서는 FK를 직접 걸지 않고 아래 __table_args__에서 묶어서 걺)
    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)
    
    # [추가] 복합 외래 키 (Composite Foreign Key) + Cascade 삭제
    # SQL: FOREIGN KEY (battle_date, owner_id) REFERENCES battle_mains (...) ON DELETE CASCADE
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
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    # 관계 설정
    main = relationship("BattleMain", back_populates="detail")