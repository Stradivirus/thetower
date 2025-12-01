from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
from datetime import datetime

class BattleMain(Base):
    """
    [메인 테이블] 
    - 리스트 조회용 핵심 데이터
    """
    __tablename__ = "battle_mains"
    
    # 1. 식별자 및 시간
    battle_date = Column(DateTime, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 2. 게임 개요
    tier = Column(String)
    wave = Column(Integer)
    game_time = Column(String)
    real_time = Column(String)
    
    # 3. 주요 재화 (BigInt)
    coin_earned = Column(BigInteger)       # 총 코인
    coins_per_hour = Column(BigInteger)    # [New] 시간당 코인 (CPH)
    cells_earned = Column(Integer)         # 셀
    reroll_shards_earned = Column(Integer) # 리롤 파편

    # 4. 핵심 전투 요약
    killer = Column(String)
    damage_dealt = Column(String)
    damage_taken = Column(String)

    # 5. 메모
    notes = Column(Text, nullable=True)

    # 관계 설정 (1:1)
    detail = relationship("BattleDetail", back_populates="main", uselist=False, cascade="all, delete-orphan")

class BattleDetail(Base):
    """
    [상세 테이블]
    - JSON 데이터 저장소
    """
    __tablename__ = "battle_details"
    
    battle_date = Column(DateTime, ForeignKey("battle_mains.battle_date"), primary_key=True)
    
    combat_json = Column(JSONB)
    utility_json = Column(JSONB)
    enemy_json = Column(JSONB)
    bot_json = Column(JSONB)
    
    main = relationship("BattleMain", back_populates="detail")