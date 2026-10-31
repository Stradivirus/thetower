"""
파일명: thetower/back_mysql/database.py
용도: SQLAlchemy를 활용한 MySQL (Oracle MySQL HeatWave / MySQL 8.4) 데이터베이스 연결 설정 및 세션 관리
특징: 메인(Primary) 서버와 리플리카(Replica) 서버를 분리하여 읽기/쓰기 부하 분산 적용
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드 (상위 폴더 포함 자동 탐색)
load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER") or os.getenv("POSTGRES_USER", "thetower")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD") or os.getenv("POSTGRES_PASSWORD", "")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB") or os.getenv("POSTGRES_DB", "thetower_report")

encoded_user = quote_plus(MYSQL_USER)
encoded_password = quote_plus(MYSQL_PASSWORD)

# --- 1. 메인 서버 (쓰기 + 리스트 조회용) ---
# Jenkins 환경변수(MYSQL_HOST) 및 MYSQL_SERVER 모두 지원, 미지정 시 로컬 WSL MySQL(127.0.0.1) 사용
MYSQL_SERVER = os.getenv("MYSQL_HOST") or os.getenv("MYSQL_SERVER", "127.0.0.1")
DATABASE_URL = f"mysql+aiomysql://{encoded_user}:{encoded_password}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=3,
    max_overflow=9,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

# --- 2. 리플리카 서버 (상세 내역 조회용) ---
MYSQL_SERVER_READ = os.getenv("MYSQL_HOST_READ") or os.getenv("MYSQL_SERVER_READ") or MYSQL_SERVER
DATABASE_URL_READ = f"mysql+aiomysql://{encoded_user}:{encoded_password}@{MYSQL_SERVER_READ}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

engine_read = create_async_engine(
    DATABASE_URL_READ,
    pool_size=2,
    max_overflow=5,
    pool_recycle=3600,
    pool_pre_ping=True
)
SessionLocalRead = async_sessionmaker(autocommit=False, autoflush=False, bind=engine_read, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    """
    메인 DB(Primary) 비동기 세션을 생성하고 반환합니다.
    주로 데이터 생성, 수정, 삭제 및 고성능이 필요한 목록 조회에 사용됩니다.
    """
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

async def get_db_replica():
    """
    리플리카 DB(Replica) 비동기 세션을 생성하고 반환합니다.
    주로 BattleDetail과 같이 데이터가 크고 무거운 상세 조회 작업에 사용됩니다.
    """
    async with SessionLocalRead() as db:
        try:
            yield db
        finally:
            await db.close()
