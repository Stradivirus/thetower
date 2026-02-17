"""
파일명: thetower/back/crud/user.py
용도: 사용자(User) 계정 관리 CRUD 로직
기능: 사용자 조회, 신규 계정 생성
"""
from sqlalchemy.orm import Session
from models import User
import schemas

def get_user_by_username(db: Session, username: str):
    """사용자 이름을 기준으로 특정 사용자를 조회합니다."""
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    """새로운 사용자 계정을 생성합니다."""
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """전체 사용자 목록을 페이징하여 조회합니다."""
    return db.query(User).offset(skip).limit(limit).all()