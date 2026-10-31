"""
파일명: thetower/back_mysql/migrate_pg_to_mysql.py
용도: 기존 PostgreSQL DB의 전체 데이터를 MySQL (로컬 또는 OCI MySQL HeatWave)로 이관하는 스크립트
실행 방법:
  cd /home/work/thetower/back_mysql
  python3 migrate_pg_to_mysql.py
"""
import asyncio
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import models
from database import engine as mysql_engine, SessionLocal as MySQLSessionLocal, Base

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "thetower")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "127.0.0.1")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "thetower_report")

PG_URL = (
    f"postgresql+asyncpg://{quote_plus(POSTGRES_USER)}:{quote_plus(POSTGRES_PASSWORD)}"
    f"@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

pg_engine = create_async_engine(PG_URL, pool_pre_ping=True)
PGSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=pg_engine, class_=AsyncSession, expire_on_commit=False)

# 외래키(FK) 의존성 순서에 맞춘 이관 대상 모델 목록
ORDERED_MODELS = [
    models.User,
    models.UserProgress,
    models.UserModules,
    models.TierRecord,
    models.BattleMain,
    models.BattleDetail,
    models.BattleMainV2,
    models.BattleDetailV2,
    models.MonthlySummary,
]

async def migrate_all(batch_size: int = 500):
    print("🚀 [1/3] MySQL 테이블 스키마 생성 확인 중...")
    async with mysql_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("📦 [2/3] PostgreSQL -> MySQL 데이터 이관 시작...")
    async with PGSessionLocal() as pg_db, MySQLSessionLocal() as my_db:
        for model_cls in ORDERED_MODELS:
            table_name = model_cls.__tablename__
            stmt = select(model_cls)
            result = await pg_db.execute(stmt)
            rows = result.scalars().all()

            total = len(rows)
            if total == 0:
                print(f"  - {table_name}: 0건 (스킵)")
                continue

            cols = [c.key for c in model_cls.__table__.columns]
            for i in range(0, total, batch_size):
                batch = rows[i:i + batch_size]
                for row in batch:
                    data = {col: getattr(row, col) for col in cols}
                    await my_db.merge(model_cls(**data))
                await my_db.commit()

            print(f"  ✅ {table_name}: {total:,}건 이관 완료")

        # users 테이블 AUTO_INCREMENT 시퀀스 보정
        await my_db.execute(text("ANALYZE TABLE users"))

    print("🎉 [3/3] 모든 데이터 이관이 완료되었습니다!")
    await pg_engine.dispose()
    await mysql_engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_all())
