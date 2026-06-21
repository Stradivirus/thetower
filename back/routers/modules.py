"""
파일명: thetower/back/routers/modules.py
용도: 사용자 모듈 데이터(인벤토리 및 장착 정보) 관리 API 라우터 (비동기 리팩토링)
기능: 내 모듈 조회 및 정보 업데이트
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
import schemas, crud
from models import User
from auth import get_current_user

router = APIRouter(prefix="/api/modules", tags=["modules"])

@router.get("/", response_model=schemas.UserModulesResponse)
async def get_my_modules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 모듈 인벤토리 및 장착 상태를 조회합니다."""
    modules = await crud.get_user_modules(db, current_user.id)
    if not modules:
        return {"inventory_json": {}, "equipped_json": {}}
    return modules

@router.post("/", response_model=schemas.UserModulesResponse)
async def save_my_modules(
    data: schemas.UserModulesBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내 모듈 정보를 업데이트(저장)합니다."""
    return await crud.update_user_modules(
        db, 
        current_user.id, 
        data.inventory_json, 
        data.equipped_json
    )