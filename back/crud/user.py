# back/crud/user.py
from sqlalchemy.orm import Session
from models import User
import schemas

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def get_active_user_count(db: Session) -> int:
    # is_active가 1인 유저만 카운트
    return db.query(User).filter(User.is_active == 1).count()