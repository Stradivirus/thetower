# back/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
# import random  <-- [제거] 랜덤 로드밸런싱 제거
from dotenv import load_dotenv

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

# [기본] 쓰기 작업 및 BattleMain(리스트) 조회용
# 메인 서버(고성능)를 사용합니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# [수정] BattleDetail(상세) 조회 전용
# 무조건 리플리카 서버(Standby)로 연결합니다.
def get_db_replica():
    db = SessionLocalRead()
    try:
        yield db
    finally:
        db.close()