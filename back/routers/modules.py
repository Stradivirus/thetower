from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, get_db_read
import schemas, crud
from models import User
from auth import get_current_user

router = APIRouter(prefix="/api/modules", tags=["modules"])

@router.get("/", response_model=schemas.UserModulesResponse)
def get_my_modules(
    db: Session = Depends(get_db_read),
    current_user: User = Depends(get_current_user)
):
    modules = crud.get_user_modules(db, current_user.id)
    if not modules:
        return {"inventory_json": {}, "equipped_json": {}}
    return modules

@router.post("/", response_model=schemas.UserModulesResponse)
def save_my_modules(
    data: schemas.UserModulesBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.update_user_modules(
        db, 
        current_user.id, 
        data.inventory_json, 
        data.equipped_json
    )