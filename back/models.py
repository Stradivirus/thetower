from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime, timezone
import re

# [Fix] The Tower 게임 단위에 맞춘 정밀 파싱
def parse_game_number(value_str: str) -> float:
    if not value_str: return 0.0
    # 공백 제거 및 콤마 제거
    clean_str = str(value_str).strip().replace(',', '')
    
    # 단위 정의 (게임 내 표기법 기준)
    multipliers = {
        'q': 10**15, 'Q': 10**18, 
        's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27,
        'n': 10**30, 'N': 10**30,
        'd': 10**33, 'D': 10**33,
        'U': 10**36,
        
        't': 10**12, 'T': 10**12, 
        'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 
        'k': 10**3, 'K': 10**3
    }
    
    multiplier = 1.0
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = float(mult)
            clean_str = clean_str[:-len(suffix)]
            break
            
    try:
        return float(clean_str) * multiplier
    except:
        return 0.0

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
    
    # [Optimized] 복합 인덱스 추가 (내 기록 조회 속도 향상)
    __table_args__ = (
        Index('idx_owner_date', 'owner_id', 'battle_date'),
    )
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

    @property
    def top_damages(self):
        # detail이 없거나, 로딩되지 않았거나(Deferred), combat_json이 비어있으면 빈 리스트 반환
        if not self.detail or not self.detail.combat_json:
            return []
        
        combat = self.detail.combat_json
        exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
        
        damage_list = []
        for key, val in combat.items():
            if key in exclude_keys: continue
            
            if isinstance(val, (str, int, float)):
                damage_list.append({
                    "name": key.replace(" 대미지", ""), 
                    "value": str(val),
                    "raw": parse_game_number(str(val))
                })
        
        damage_list.sort(key=lambda x: x['raw'], reverse=True)
        return damage_list

class BattleDetail(Base):
    __tablename__ = "battle_details"
    
    battle_date = Column(DateTime, ForeignKey("battle_mains.battle_date"), primary_key=True)
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    main = relationship("BattleMain", back_populates="detail")