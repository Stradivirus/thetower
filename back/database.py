"""
파일명: thetower/back/database.py
용도: SQLAlchemy를 활용한 MySQL (Oracle MySQL HeatWave / MySQL 8.4) 데이터베이스 연결 설정 및 세션 관리
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드 (상위 폴더 포함 자동 탐색)
load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "thetower")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "thetower")

encoded_user = quote_plus(MYSQL_USER)
encoded_password = quote_plus(MYSQL_PASSWORD)

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

Base = declarative_base()

async def get_db():
    """
    비동기 DB 세션을 생성하고 반환합니다.
    """
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
