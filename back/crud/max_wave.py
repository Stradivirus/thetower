"""
파일명: thetower/back/crud/max_wave.py
용도: 티어별 최고 웨이브 기록(TierRecord) 관리 로직 (비동기 리팩토링)
기능: 모든 티어 기록 조회, 새로운 기록 갱신 및 저장
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import models

async def get_all_tier_records(db: AsyncSession):
    """전체 티어별 최고 웨이브 기록을 티어 순서대로 조회합니다."""
    stmt = select(models.TierRecord).order_by(models.TierRecord.tier.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_tier_record(db: AsyncSession, tier: int, wave: int):
    """
    특정 티어의 최고 웨이브 기록을 업데이트합니다.
    기존 기록보다 높은 웨이브일 경우에만 갱신을 수행합니다.
    """
    stmt = select(models.TierRecord).filter(models.TierRecord.tier == tier)
    result = await db.execute(stmt)
    record = result.scalars().first()

    if record:
        # 기존 기록보다 높은 경우에만 갱신
        if wave > record.max_wave:
            record.max_wave = wave
            await db.commit()
            await db.refresh(record)
            return record
    else:
        # 해당 티어의 기록이 없는 경우 새로 생성
        new_record = models.TierRecord(tier=tier, max_wave=wave)
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        return new_record