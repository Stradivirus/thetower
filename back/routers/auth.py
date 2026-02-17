"""
파일명: thetower/back/routers/auth.py
용도: 사용자 인증(회원가입, 로그인) API 라우터
기능: 회원가입 시 유효성 검사, 로그인 시 JWT 토큰 발급
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import database, schemas, crud, auth
import slack

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register(
    user: schemas.UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """
    신규 사용자 등록(회원가입) API
    - 아이디/비밀번호 최소 길이(4자) 검증
    - 아이디 중복 확인
    - 비밀번호 해싱 후 DB 저장
    """
    if len(user.username) < 4:
        raise HTTPException(status_code=400, detail="아이디는 4자 이상이어야 합니다.")
    if len(user.password) < 4:
        raise HTTPException(status_code=400, detail="비밀번호는 4자 이상이어야 합니다.")

    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = crud.create_user(db=db, user=user, hashed_password=hashed_pw)

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """
    사용자 로그인 API
    - 아이디 및 비밀번호 검증
    - 성공 시 JWT 액세스 토큰 발급
    """
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 잘못되었습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}