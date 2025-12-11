from sqlalchemy.orm import Session, joinedload
from models import BattleMain, BattleDetail
from datetime import datetime, timedelta, timezone
from .utils import _stats_cache

def create_battle_record(db: Session, parsed_data: dict, user_id: int, notes: str = None):
    main_data = parsed_data['main']
    detail_data = parsed_data['detail']
    
    if notes:
        main_data['notes'] = notes

    battle_main = BattleMain(**main_data, owner_id=user_id)
    battle_detail = BattleDetail(
        battle_date=battle_main.battle_date,
        **detail_data
    )
    
    db.merge(battle_main)
    db.merge(battle_detail)
    db.commit()
    
    keys_to_remove = [k for k in _stats_cache.keys() if str(k).startswith(str(user_id))]
    for k in keys_to_remove:
        del _stats_cache[k]
        
    return battle_main

def count_reports(db: Session) -> int:
    return db.query(BattleMain).count()

def get_cutoff_date():
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=7)

def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .filter(BattleMain.battle_date >= cutoff_date_naive)\
             .order_by(BattleMain.battle_date.desc())\
             .all()

def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .order_by(BattleMain.battle_date.desc())\
             .offset(skip).limit(limit).all()

def get_full_report(db: Session, battle_date: datetime, user_id: int):
    main = db.query(BattleMain).options(joinedload(BattleMain.detail)).filter(
        BattleMain.battle_date == battle_date,
        BattleMain.owner_id == user_id
    ).first()
    
    if not main:
        return None
        
    return {
        "main": main,
        "detail": main.detail
    }

# [New] 기록 삭제 함수
def delete_battle_record(db: Session, battle_date: datetime, user_id: int) -> bool:
    record = db.query(BattleMain).filter(
        BattleMain.battle_date == battle_date,
        BattleMain.owner_id == user_id
    ).first()

    if record:
        db.delete(record)
        db.commit()
        
        # 삭제 후 관련 캐시 초기화
        keys_to_remove = [k for k in _stats_cache.keys() if str(k).startswith(str(user_id))]
        for k in keys_to_remove:
            del _stats_cache[k]
            
        return True
    return False