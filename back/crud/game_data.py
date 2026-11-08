"""
파일명: thetower/back/crud/game_data.py
용도: 사용자의 게임 진행 데이터(Progress) 및 모듈(Modules) 관리 로직 (비동기 리팩토링)
기능: 진행도 및 모듈 정보 조회/업데이트, SQLAlchemy JSON 변경 감지 처리
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from models import UserProgress, UserModules

def _split_progress_payload(raw_data: dict):
    """
    프론트엔드에서 전달된 통합 progress 딕셔너리를
    base_json, plus_json, unlock_json, card_json, module_json, plan_json 6개로 분리합니다.
    값이 0인 불필요한 항목은 제외하여 JSON 크기를 최소화합니다.
    """
    base_data = {}
    plus_data = {}
    unlock_data = {}
    card_data = {}
    module_data = {}
    plan_data = []

    if not isinstance(raw_data, dict):
        return base_data, plus_data, unlock_data, card_data, module_data, plan_data

    for k, v in raw_data.items():
        if k == "stone_plan":
            plan_data = v if isinstance(v, list) else []
        elif k.startswith("card_"):
            if v:
                card_data[k] = v
        elif (
            k in ("unlocked_weapons", "unlocked_plus_weapons", "bot_synchronicity")
            or k.startswith("bot_plus_")
            or k.startswith("module_unlock_")
        ):
            if isinstance(v, list):
                if len(v) > 0:
                    unlock_data[k] = v
            elif v:
                unlock_data[k] = v
        elif k.startswith("plus_"):
            if v:
                plus_data[k] = v
        elif k.startswith("module_"):
            if v:
                module_data[k] = v
        else:
            if v:
                base_data[k] = v

    return base_data, plus_data, unlock_data, card_data, module_data, plan_data


def merge_progress_columns(db_progress: UserProgress) -> dict:
    """
    DB의 6개 컬럼(base_json, plus_json, unlock_json, card_json, module_json, plan_json)을
    프론트엔드 호환을 위한 단일 딕셔너리로 병합합니다.
    """
    if not db_progress:
        return {}

    merged = {}
    for col in (
        db_progress.base_json,
        db_progress.plus_json,
        db_progress.unlock_json,
        db_progress.card_json,
        db_progress.module_json,
    ):
        if isinstance(col, dict):
            merged.update(col)

    if isinstance(db_progress.plan_json, list) and len(db_progress.plan_json) > 0:
        merged["stone_plan"] = db_progress.plan_json

    return merged


async def get_user_progress(db: AsyncSession, user_id: int):
    """특정 사용자의 게임 진행도(카드, UW 등) 정보를 조회합니다."""
    stmt = select(UserProgress).filter(UserProgress.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_user_progress(db: AsyncSession, user_id: int, progress_data: dict):
    """
    사용자의 게임 진행도 정보를 6개 탭별 컬럼(base_json, plus_json, unlock_json, card_json, module_json, plan_json)으로
    분류하여 업데이트하거나 생성합니다.
    """
    base_data, plus_data, unlock_data, card_data, module_data, plan_data = _split_progress_payload(progress_data)

    db_progress = await get_user_progress(db, user_id)
    if db_progress:
        db_progress.base_json = base_data
        db_progress.plus_json = plus_data
        db_progress.unlock_json = unlock_data
        db_progress.card_json = card_data
        db_progress.module_json = module_data
        db_progress.plan_json = plan_data
        # JSON 데이터 내부 변경사항을 알리기 위해 플래그 설정
        flag_modified(db_progress, "base_json")
        flag_modified(db_progress, "plus_json")
        flag_modified(db_progress, "unlock_json")
        flag_modified(db_progress, "card_json")
        flag_modified(db_progress, "module_json")
        flag_modified(db_progress, "plan_json")
    else:
        db_progress = UserProgress(
            user_id=user_id,
            base_json=base_data,
            plus_json=plus_data,
            unlock_json=unlock_data,
            card_json=card_data,
            module_json=module_data,
            plan_json=plan_data,
        )
        db.add(db_progress)
    await db.commit()
    await db.refresh(db_progress)
    return db_progress

async def get_user_modules(db: AsyncSession, user_id: int):
    """특정 사용자의 모듈 인벤토리 및 장착 정보를 조회합니다."""
    stmt = select(UserModules).filter(UserModules.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_user_modules(db: AsyncSession, user_id: int, inventory_data: dict, equipped_data: dict):
    """
    사용자의 모듈 정보를 업데이트하거나 생성합니다.
    인벤토리와 장착 정보가 포함된 JSON 데이터를 처리하며, 변경 감지 플래그를 설정합니다.
    """
    db_modules = await get_user_modules(db, user_id)
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
    
    await db.commit()
    await db.refresh(db_modules)
    return db_modules