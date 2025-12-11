from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime, timezone
import re

# [Fix] The Tower 게임 단위 파싱 (aa, ab, ac 추가)
def parse_game_number(value_str: str) -> float:
    if not value_str: return 0.0
    clean_str = str(value_str).strip().replace(',', '')
    
    # 단위 정의 (게임 내 표기법 기준)
    # 주의: 긴 단위(2글자)를 짧은 단위(1글자)보다 먼저 검사해야 안전합니다.
    multipliers = {
        # [New] 새로 찾은 단위들 (aa ~ ac)
        'ac': 10**42, # Tredecillion
        'ab': 10**39, # Duodecillion
        'aa': 10**36, # Undecillion
        
        # 기존 단위들
        'q': 10**15, 'Q': 10**18, 
        's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27,
        'n': 10**30, 'N': 10**30,
        'd': 10**33, 'D': 10**33,
        'U': 10**36,  # 혹시 몰라 기존 대문자 U도 남겨둠
        
        't': 10**12, 'T': 10**12, 
        'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 
        'k': 10**3, 'K': 10**3
    }
    
    multiplier = 1.0
    
    # 위에서 정의한 순서대로(긴 것부터) suffix 매칭 시도
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = float(mult)
            # 단위 부분 제거 (숫자만 남김)
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
    
    # [Optimized] 복합 인덱스 (내 기록 조회 속도 향상)
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