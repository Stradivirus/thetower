from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified # [1] 변경 감지를 위한 필수 임포트
from models import UserProgress, UserModules

def get_user_progress(db: Session, user_id: int):
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

def update_user_progress(db: Session, user_id: int, progress_data: dict):
    db_progress = get_user_progress(db, user_id)
    if db_progress:
        db_progress.progress_json = progress_data
        # JSON 데이터 내부 변경사항을 알리기 위해 플래그 설정
        flag_modified(db_progress, "progress_json")
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
        
        # [2] 핵심 수정사항: SQLAlchemy에게 JSON 내용물이 변경되었음을 강제로 알림
        # 이게 없으면 딕셔너리 내부 값만 바뀌었을 때 commit이 무시될 수 있음
        flag_modified(db_modules, "inventory_json")
        flag_modified(db_modules, "equipped_json")
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