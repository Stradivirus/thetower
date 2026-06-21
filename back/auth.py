"""
파일명: thetower/back/auth.py
용도: JWT 기반 인증 처리 및 비밀번호 해싱 설정 (비동기 리팩토링)
기능: 토큰 생성, 비밀번호 검증, 현재 사용자 식별 미들웨어
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv

import crud
from database import get_db

# 환경 변수 로드
load_dotenv()

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "secret_key_fallback")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# 비밀번호 해싱 설정 (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 스키마 설정 (로그인 엔드포인트 지정)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    """평문 비밀번호와 해싱된 비밀번호를 비교하여 일치 여부 반환"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """비밀번호를 Bcrypt 알고리즘으로 해싱"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    JWT 액세스 토큰 생성
    :param data: 토큰에 포함할 페이로드 데이터
    :param expires_delta: 토큰 만료 시간 (기본 15분)
    :return: 인코딩된 JWT 토큰
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
):
    """
    액세스 토큰을 검증하여 현재 로그인한 사용자 객체를 반환하는 의존성 함수
    :param token: 요청 헤더에서 추출된 JWT 토큰
    :param db: DB 세션
    :return: models.User 객체
    :raises HTTPException: 인증 실패 시 401 에러 발생
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명을 검증할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 토큰 디코딩 및 검증
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # DB에서 사용자 조회 (비동기 await 추가 및 AsyncSession 적용)
    user = await crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user