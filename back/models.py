from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text
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
    # k=3, m=6, b=9, t=12, q=15, Q=18, s=21, S=24, o=27, n=30, d=33 ...
    multipliers = {
        # 소문자/대문자 구분이 중요한 단위들
        'q': 10**15, 'Q': 10**18, 
        's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27, # Octillion
        'n': 10**30, 'N': 10**30, # Nonillion
        'd': 10**33, 'D': 10**33, # Decillion
        'U': 10**36,              # Undecillion
        
        # 대소문자 구분 없이 쓰이는 일반 단위 (안전장치)
        't': 10**12, 'T': 10**12, 
        'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 
        'k': 10**3, 'K': 10**3
    }
    
    # 문자열 끝에서부터 단위를 찾음
    multiplier = 1.0
    
    # 긴 단위부터 짧은 단위 순으로 체크하는 것이 안전하지만, 
    # 여기선 1글자 단위가 대부분이므로 suffix 매칭
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
        # '입힌 대미지'(총합)은 반드시 제외해야 함
        exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
        
        damage_list = []
        for key, val in combat.items():
            if key in exclude_keys: continue
            
            # 값이 있는 경우만 처리
            if isinstance(val, (str, int, float)):
                damage_list.append({
                    "name": key.replace(" 대미지", ""), 
                    "value": str(val),
                    "raw": parse_game_number(str(val))
                })
        
        # 파싱된 raw 값 기준으로 내림차순 정렬
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