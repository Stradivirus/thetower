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
    if len(user.username) < 4:
        raise HTTPException(status_code=400, detail="아이디는 4자 이상이어야 합니다.")
    if len(user.password) < 4:
        raise HTTPException(status_code=400, detail="비밀번호는 4자 이상이어야 합니다.")

    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = crud.create_user(db=db, user=user, hashed_password=hashed_pw)

    try:
        total_count = crud.count_users(db)
        if total_count % 10 == 0:
            msg = f"🚀 [축] {total_count}번째 사용자가 가입했습니다!"
            background_tasks.add_task(slack.send_slack_notification, msg)
    except Exception as e:
        print(f"Notification Check Error: {e}")

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
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