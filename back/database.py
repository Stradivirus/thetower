# back/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import random  # [추가] 로드 밸런싱용 랜덤 모듈
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# --- 1. 메인 서버 (쓰기 + 읽기) ---
# 성능: 1 OCPU / 6GB RAM (강함)
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(
    DATABASE_URL,
    pool_size=3,         # [최적화] 워커 2개 기준 안전 설정
    max_overflow=12,     # [최적화] 급할 때 여유분
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- 2. 리플리카 서버 (읽기 전용) ---
# 성능: 1 OCPU / 1GB RAM (약함)
POSTGRES_SERVER_READ = os.getenv("POSTGRES_SERVER_READ")
if not POSTGRES_SERVER_READ:
    POSTGRES_SERVER_READ = POSTGRES_SERVER

DATABASE_URL_READ = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER_READ}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine_read = create_engine(
    DATABASE_URL_READ,
    pool_size=2,         # [최적화] 워커 2개 기준 안전 설정
    max_overflow=8,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocalRead = sessionmaker(autocommit=False, autoflush=False, bind=engine_read)

Base = declarative_base()

# [쓰기용] 무조건 메인 서버 사용
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# [읽기용] 6:4 비율로 분산 (로드 밸런싱)
def get_db_read():
    # 0.6 (60%) 확률로 성능 좋은 '메인 서버' 사용
    if random.random() < 0.6:
        db = SessionLocal()
    # 나머지 40% 확률로 '리플리카 서버' 사용
    else:
        db = SessionLocalRead()
        
    try:
        yield db
    finally:
        db.close()