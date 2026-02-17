"""
파일명: thetower/back/crud/max_wave.py
용도: 티어별 최고 웨이브 기록(TierRecord) 관리 로직
기능: 모든 티어 기록 조회, 새로운 기록 갱신 및 저장
"""
from sqlalchemy.orm import Session
import models

def get_all_tier_records(db: Session):
    """전체 티어별 최고 웨이브 기록을 티어 순서대로 조회합니다."""
    return db.query(models.TierRecord).order_by(models.TierRecord.tier.asc()).all()

def update_tier_record(db: Session, tier: int, wave: int):
    """
    특정 티어의 최고 웨이브 기록을 업데이트합니다.
    기존 기록보다 높은 웨이브일 경우에만 갱신을 수행합니다.
    """
    record = db.query(models.TierRecord).filter(models.TierRecord.tier == tier).first()

    if record:
        # 기존 기록보다 높은 경우에만 갱신
        if wave > record.max_wave:
            record.max_wave = wave
            db.commit()
            db.refresh(record)
            return record
    else:
        # 해당 티어의 기록이 없는 경우 새로 생성
        new_record = models.TierRecord(tier=tier, max_wave=wave)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record