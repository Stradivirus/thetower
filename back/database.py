"""
파일명: thetower/back/database.py
용도: SQLAlchemy를 활용한 PostgreSQL 데이터베이스 연결 설정 및 세션 관리
특징: 메인(Primary) 서버와 리플리카(Replica) 서버를 분리하여 읽기/쓰기 부하 분산 적용
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# --- 1. 메인 서버 (쓰기 + 리스트 조회용) ---
# 성능: 1 OCPU / 6GB RAM (강함) -> 리스트 뽑는 속도 빠름
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(
    DATABASE_URL,
    pool_size=3,         
    max_overflow=12,     
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- 2. 리플리카 서버 (상세 내역 조회용) ---
# 성능: 1 OCPU / 1GB RAM (약함) -> 무거운 JSON 데이터 전담, 메인 서버 부하 방지
POSTGRES_SERVER_READ = os.getenv("POSTGRES_SERVER_READ")
if not POSTGRES_SERVER_READ:
    POSTGRES_SERVER_READ = POSTGRES_SERVER

DATABASE_URL_READ = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER_READ}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine_read = create_engine(
    DATABASE_URL_READ,
    pool_size=2,         
    max_overflow=8,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocalRead = sessionmaker(autocommit=False, autoflush=False, bind=engine_read)

Base = declarative_base()

def get_db():
    """
    메인 DB(Primary) 세션을 생성하고 반환합니다.
    주로 데이터 생성, 수정, 삭제 및 고성능이 필요한 목록 조회에 사용됩니다.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_replica():
    """
    리플리카 DB(Replica) 세션을 생성하고 반환합니다.
    주로 BattleDetail과 같이 데이터가 크고 무거운 상세 조회 작업에 사용됩니다.
    """
    db = SessionLocalRead()
    try:
        yield db
    finally:
        db.close()