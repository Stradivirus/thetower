from sqlalchemy import Column, String, Integer, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB  # PostgreSQL 전용 JSON 타입
from database import Base
from datetime import datetime

class BattleMain(Base):
    """
    [메인 테이블] 
    - 리스트 조회용 핵심 데이터
    - 자주 검색/정렬하는 컬럼은 여기에 둡니다.
    """
    __tablename__ = "battle_mains"
    
    # 1. 식별자 및 시간
    battle_date = Column(DateTime, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 2. 게임 개요 (가장 자주 보는 정보)
    tier = Column(String)
    wave = Column(Integer)  # 숫자형으로 변경 (정렬 위해)
    game_time = Column(String)
    real_time = Column(String)
    
    # 3. 주요 재화 (숫자형 BigInt로 변환 저장 -> 합계 계산 가능)
    coin_earned = Column(BigInteger)     # 코인
    cells_earned = Column(Integer)       # 셀
    reroll_shards_earned = Column(Integer) # 리롤 파편

    # 4. 핵심 전투 요약 (Cat 2 일부)
    killer = Column(String)
    damage_dealt = Column(String) # 단위가 너무 다양해서 일단 String 유지 (필요시 변환)
    damage_taken = Column(String)

    # 5. [New] 메모 기능
    notes = Column(Text, nullable=True)  # "모듈 실험 중" 같은 메모

    # 관계 설정 (1:1)
    detail = relationship("BattleDetail", back_populates="main", uselist=False, cascade="all, delete-orphan")

class BattleDetail(Base):
    """
    [상세 테이블]
    - 자주 안 보는 상세 데이터 (JSON 덩어리)
    - 게임 업데이트로 스탯이 추가되어도 DB 구조 변경 불필요
    """
    __tablename__ = "battle_details"
    
    battle_date = Column(DateTime, ForeignKey("battle_mains.battle_date"), primary_key=True)
    
    # 각 카테고리별 데이터를 통째로 JSON으로 저장
    combat_json = Column(JSONB)   # 전투 세부 통계 (투사체, 지뢰 등)
    utility_json = Column(JSONB)  # 유틸리티 통계
    enemy_json = Column(JSONB)    # 적 통계
    bot_json = Column(JSONB)      # 봇/가디언 통계
    
    # 관계 설정
    main = relationship("BattleMain", back_populates="detail")