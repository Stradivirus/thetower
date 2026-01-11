# back/crud/max_wave.py
from sqlalchemy.orm import Session
import models # [수정] 상대경로(..) 제거

def get_all_tier_records(db: Session):
    return db.query(models.TierRecord).order_by(models.TierRecord.tier.asc()).all()

def update_tier_record(db: Session, tier: int, wave: int):
    record = db.query(models.TierRecord).filter(models.TierRecord.tier == tier).first()

    if record:
        if wave > record.max_wave:
            record.max_wave = wave
            db.commit()
            db.refresh(record)
            return record
    else:
        new_record = models.TierRecord(tier=tier, max_wave=wave)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record