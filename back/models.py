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

"""
기존 models.py 하단에 추가할 V2 모델
BattleMain, BattleDetail 등 기존 모델은 그대로 유지
"""

class BattleMainV2(Base):
    """
    data2 포맷 전용 추가 통계 테이블
    - BattleMain과 1:1 관계 (battle_date + owner_id FK)
    - '기록' 섹션 데이터 및 시간당 셀 등 신규 컬럼 저장
    """
    __tablename__ = "battle_mains_v2"

    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )

    # 전투 보고 섹션 신규
    cells_per_hour = Column(BigInteger, nullable=True)          # 시간당 셀

    # 기록 섹션
    best_coins_per_minute = Column(BigInteger, nullable=True)   # 분당 최고 코인 수
    max_wave_skip = Column(Integer, nullable=True)              # 최대 웨이브 건너뛰기
    best_skip_coins = Column(BigInteger, nullable=True)         # 웨이브 스킵에서 얻은 대부분의 코인
    best_skip_cells = Column(Integer, nullable=True)            # 웨이브 스킵에서 나온 대부분의 세포
    max_smart_missile_stack = Column(Integer, nullable=True)    # 최대 스마트 미사일 중첩
    max_golden_combo = Column(Integer, nullable=True)           # 최대 골든 콤보
    best_golden_combo_coins = Column(BigInteger, nullable=True) # 골든 콤보에서 얻는 대부분의 코인
    max_inner_mine_charge = Column(Integer, nullable=True)      # 최대 내부 지뢰 충전

    main = relationship(
        "BattleMain",
        foreign_keys=[battle_date, owner_id],
        primaryjoin="and_(BattleMainV2.battle_date==BattleMain.battle_date, BattleMainV2.owner_id==BattleMain.owner_id)",
        backref="v2_main"
    )


class BattleDetailV2(Base):
    """
    data2 포맷 전용 상세 JSON 테이블
    - BattleMain과 1:1 관계 (battle_date + owner_id FK)
    - 섹션별 JSON 저장
    """
    __tablename__ = "battle_details_v2"

    battle_date = Column(DateTime, primary_key=True)
    owner_id = Column(Integer, primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['battle_date', 'owner_id'],
            ['battle_mains.battle_date', 'battle_mains.owner_id'],
            ondelete='CASCADE'
        ),
    )

    # 대미지 + 받은 대미지 + 보너스 체력 + 대미지 차단 통합
    damage_json = Column(JSONB, default={})

    # 유틸리티 (기존 대비 항목 추가됨)
    utility_json = Column(JSONB, default={})

    # 수치 + 적 타격 수 + 효과 활성 상태에서 처치
    stats_json = Column(JSONB, default={})

    # 적 합계
    enemy_json = Column(JSONB, default={})

    # 코인 출처별 세분화 (캐시 제외)
    coin_json = Column(JSONB, default={})

    # 화폐 (셀, 보석, 파편류 등)
    currency_json = Column(JSONB, default={})

    # 다음으로 파괴한 적
    kill_source_json = Column(JSONB, default={})

    main = relationship(
        "BattleMain",
        foreign_keys=[battle_date, owner_id],
        primaryjoin="and_(BattleDetailV2.battle_date==BattleMain.battle_date, BattleDetailV2.owner_id==BattleMain.owner_id)",
        backref="v2_detail"
    )