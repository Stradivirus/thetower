from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# 1. 메인 서버 (쓰기용)
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. 리플리카 서버 (읽기용)
POSTGRES_SERVER_READ = os.getenv("POSTGRES_SERVER_READ")
# 만약 환경변수가 없으면 메인 서버를 쓰도록 fallback 처리 (안전장치)
if not POSTGRES_SERVER_READ:
    POSTGRES_SERVER_READ = POSTGRES_SERVER

DATABASE_URL_READ = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER_READ}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine_read = create_engine(DATABASE_URL_READ)
SessionLocalRead = sessionmaker(autocommit=False, autoflush=False, bind=engine_read)

Base = declarative_base()

# 메인 DB 세션 (쓰기/읽기 겸용 - progress, modules 등에서 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 읽기 전용 DB 세션 (reports 조회용)
def get_db_read():
    db = SessionLocalRead()
    try:
        yield db
    finally:
        db.close()