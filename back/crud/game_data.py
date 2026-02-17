"""
파일명: thetower/back/crud/game_data.py
용도: 사용자의 게임 진행 데이터(Progress) 및 모듈(Modules) 관리 로직
기능: 진행도 및 모듈 정보 조회/업데이트, SQLAlchemy JSON 변경 감지 처리
"""
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from models import UserProgress, UserModules

def get_user_progress(db: Session, user_id: int):
    """특정 사용자의 게임 진행도(카드, UW 등) 정보를 조회합니다."""
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

def update_user_progress(db: Session, user_id: int, progress_data: dict):
    """
    사용자의 게임 진행도 정보를 업데이트하거나 생성합니다.
    JSON 데이터의 내부 변경사항을 SQLAlchemy가 감지할 수 있도록 flag_modified를 사용합니다.
    """
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
    """특정 사용자의 모듈 인벤토리 및 장착 정보를 조회합니다."""
    return db.query(UserModules).filter(UserModules.user_id == user_id).first()

def update_user_modules(db: Session, user_id: int, inventory_data: dict, equipped_data: dict):
    """
    사용자의 모듈 정보를 업데이트하거나 생성합니다.
    인벤토리와 장착 정보가 포함된 JSON 데이터를 처리하며, 변경 감지 플래그를 설정합니다.
    """
    db_modules = get_user_modules(db, user_id)
    if db_modules:
        db_modules.inventory_json = inventory_data
        db_modules.equipped_json = equipped_data
        
        # SQLAlchemy에게 JSON 내용물이 변경되었음을 명시적으로 알림
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