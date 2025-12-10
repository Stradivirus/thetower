from sqlalchemy.orm import Session
from models import UserProgress, UserModules

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