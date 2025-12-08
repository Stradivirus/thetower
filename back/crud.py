from sqlalchemy.orm import Session, joinedload
from models import BattleMain, BattleDetail, User, UserProgress, UserModules
from datetime import datetime, timedelta, timezone
import schemas

# --- User ---
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Progress ---
def get_user_progress(db: Session, user_id: int):
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

def update_user_progress(db: Session, user_id: int, progress_data: dict):
    db_progress = get_user_progress(db, user_id)
    if db_progress:
        db_progress.progress_json = progress_data
    else:
        db_progress = UserProgress(user_id=user_id, progress_json=progress_data)
        db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress

# --- Modules ---
def get_user_modules(db: Session, user_id: int):
    return db.query(UserModules).filter(UserModules.user_id == user_id).first()

def update_user_modules(db: Session, user_id: int, inventory_data: dict, equipped_data: dict):
    db_modules = get_user_modules(db, user_id)
    if db_modules:
        db_modules.inventory_json = inventory_data
        db_modules.equipped_json = equipped_data
    else:
        db_modules = UserModules(
            user_id=user_id, 
            inventory_json=inventory_data, 
            equipped_json=equipped_data
        )
        db.add(db_modules)
    
    db.commit()
    db.refresh(db_modules)
    return db_modules

# --- Report ---
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
    return battle_main

def get_cutoff_date():
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=2)

# [Modified] joinedload 추가
def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .filter(BattleMain.battle_date >= cutoff_date)\
             .order_by(BattleMain.battle_date.desc())\
             .all()

# [Modified] joinedload 추가
def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    cutoff_date = get_cutoff_date()
    
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .filter(BattleMain.battle_date < cutoff_date)\
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