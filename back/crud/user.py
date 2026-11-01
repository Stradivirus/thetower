"""
파일명: thetower/back/crud/user.py
용도: 사용자(User) 계정 관리 CRUD 로직 (비동기 리팩토링)
기능: 사용자 조회, 신규 계정 생성
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import User
import schemas

async def get_user_by_username(db: AsyncSession, username: str):
    """사용자 이름을 기준으로 특정 사용자를 조회합니다."""
    stmt = select(User).filter(User.username == username)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate, hashed_password: str):
    """새로운 사용자 계정을 생성합니다."""
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    """전체 사용자 목록을 페이징하여 조회합니다."""
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()