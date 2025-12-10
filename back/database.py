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

# 1. 메인 서버 (쓰기용) - 성능 좀 더 줌 (기본값의 2배)
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER")
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(
    DATABASE_URL,
    pool_size=10,        # [수정] 20 -> 10 (적당히 여유 있음)
    max_overflow=20,     # [수정] 40 -> 20
    pool_recycle=3600,   # 1시간마다 물갈이
    pool_pre_ping=True   # [필수] 연결 끊김 방지
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. 리플리카 서버 (읽기용) - 기본값 수준으로 가볍게
POSTGRES_SERVER_READ = os.getenv("POSTGRES_SERVER_READ")
if not POSTGRES_SERVER_READ:
    POSTGRES_SERVER_READ = POSTGRES_SERVER

DATABASE_URL_READ = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER_READ}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine_read = create_engine(
    DATABASE_URL_READ,
    pool_size=5,         # [수정] 20 -> 5 (기본값과 동일)
    max_overflow=10,     # [수정] 40 -> 10 (기본값과 동일)
    pool_recycle=3600,
    pool_pre_ping=True   # 숫자는 작아도 이 기능 때문에 설정 필수!
)
SessionLocalRead = sessionmaker(autocommit=False, autoflush=False, bind=engine_read)

Base = declarative_base()

# ... (아래는 기존과 동일)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_read():
    db = SessionLocalRead()
    try:
        yield db
    finally:
        db.close()