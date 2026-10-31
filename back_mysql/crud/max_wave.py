"""
파일명: thetower/back/crud/max_wave.py
용도: 티어별 최고 웨이브 기록(TierRecord) 관리 로직 (비동기 리팩토링)
기능: 모든 티어 기록 조회, 새로운 기록 갱신 및 저장
"""
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import models

async def get_all_tier_records(db: AsyncSession):
    """전체 티어별 최고 웨이브 기록을 티어 순서대로 조회합니다."""
    stmt = select(models.TierRecord).order_by(models.TierRecord.tier.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_tier_record(db: AsyncSession, tier: int, wave: int, commit: bool = True):
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
            if commit:
                await db.commit()
                await db.refresh(record)
            return record
    else:
        # 해당 티어의 기록이 없는 경우 새로 생성
        new_record = models.TierRecord(tier=tier, max_wave=wave)
        db.add(new_record)
        if commit:
            await db.commit()
            await db.refresh(new_record)
        return new_record

async def recalculate_tier_record(db: AsyncSession, tier_str: str, removed_wave: int = 0, commit: bool = False):
    """
    전투 기록이 삭제되거나 덮어쓰기된 후, 해당 티어의 최고 웨이브 기록(TierRecord)을 재계산합니다.
    삭제된 기록의 웨이브가 현재 최고 기록 이상일 때만 실제 남은 기록들 중 최대값으로 갱신합니다.
    """
    match = re.search(r'\d+', str(tier_str or ''))
    if not match:
        return
    tier_val = int(match.group())
    if tier_val <= 0:
        return

    stmt = select(models.TierRecord).filter(models.TierRecord.tier == tier_val)
    result = await db.execute(stmt)
    record = result.scalars().first()
    if not record:
        return

    # 삭제된 웨이브가 현재 최고 기록보다 작다면 최고 기록에 영향이 없으므로 스킵
    if removed_wave > 0 and removed_wave < record.max_wave:
        return

    tier_candidates = list({str(tier_str), str(tier_val), f"{tier_val}+", f"T{tier_val}"})
    max_stmt = select(func.max(models.BattleMain.wave)).filter(
        models.BattleMain.tier.in_(tier_candidates)
    )
    max_res = await db.execute(max_stmt)
    new_max_wave = int(max_res.scalar() or 0)

    if new_max_wave > 0:
        record.max_wave = new_max_wave
    else:
        await db.delete(record)

    if commit:
        await db.commit()
