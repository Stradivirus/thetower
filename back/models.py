# back/models.py
from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime, timezone
from crud.utils import parse_game_number_safe as parse_game_number

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

    # [New] 데스웨이브 태그 비율 계산
    @property
    def death_wave_ratio(self):
        if not self.detail: return None
        
        # 1. 전체 적 수 (분모)
        enemy_json = self.detail.enemy_json or {}
        total_enemies_str = str(enemy_json.get("적 합계", "0"))
        total_enemies = parse_game_number(total_enemies_str)
        
        if total_enemies <= 0: return "-"

        # 2. 데스웨이브 태그 수 (분자)
        combat_json = self.detail.combat_json or {}
        dw_tags_str = str(combat_json.get("데스웨이브에 의해 표시됨", "0"))
        dw_tags = parse_game_number(dw_tags_str)
        
        ratio = (dw_tags / total_enemies) * 100
        return f"{ratio:.1f}%"

    # [New] 스포트라이트 킬 비율 계산
    @property
    def spotlight_ratio(self):
        if not self.detail: return None
        
        # 1. 전체 적 수 (분모)
        enemy_json = self.detail.enemy_json or {}
        total_enemies_str = str(enemy_json.get("적 합계", "0"))
        total_enemies = parse_game_number(total_enemies_str)
        
        if total_enemies <= 0: return "-"

        # 2. 스포트라이트 킬 수 (분자)
        sl_kill_str = str(enemy_json.get("스포트라이트로 파괴함", "0"))
        sl_kills = parse_game_number(sl_kill_str)
        
        ratio = (sl_kills / total_enemies) * 100
        return f"{ratio:.1f}%"

class BattleDetail(Base):
    __tablename__ = "battle_details"
    
    battle_date = Column(DateTime, ForeignKey("battle_mains.battle_date"), primary_key=True)
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    main = relationship("BattleMain", back_populates="detail")