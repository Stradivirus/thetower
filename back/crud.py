from sqlalchemy.orm import Session, joinedload
from models import BattleMain, BattleDetail, User, UserProgress, UserModules
from datetime import datetime, timedelta, timezone
import schemas

# [New] 간단한 인메모리 캐시 저장소
# 구조: { user_id: { "timestamp": datetime, "data": result_dict } }
_stats_cache = {}
CACHE_EXPIRE_MINUTES = 10  # 캐시 유효 시간 (10분)

# [Safety] models.py에 파싱 함수가 없거나 임포트 실패를 대비해 안전하게 재정의
def parse_game_number_safe(value_str: str) -> float:
    if not value_str: return 0.0
    clean_str = str(value_str).strip().replace(',', '')
    multipliers = {
        'q': 10**15, 'Q': 10**18, 's': 10**21, 'S': 10**24,
        'o': 10**27, 'O': 10**27, 'n': 10**30, 'N': 10**30,
        'd': 10**33, 'D': 10**33, 'U': 10**36,
        't': 10**12, 'T': 10**12, 'b': 10**9, 'B': 10**9, 
        'm': 10**6, 'M': 10**6, 'k': 10**3, 'K': 10**3
    }
    multiplier = 1.0
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = float(mult)
            clean_str = clean_str[:-len(suffix)]
            break
    try:
        return float(clean_str) * multiplier
    except:
        return 0.0

# --- User ---
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Progress ---
def get_user_progress(db: Session, user_id: int):
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

def update_user_progress(db: Session, user_id: int, progress_data: dict):
    db_progress = get_user_progress(db, user_id)
    if db_progress:
        db_progress.progress_json = progress_data
    else:
        db_progress = UserProgress(user_id=user_id, progress_json=progress_data)
        db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    return db_progress

# --- Modules ---
def get_user_modules(db: Session, user_id: int):
    return db.query(UserModules).filter(UserModules.user_id == user_id).first()

def update_user_modules(db: Session, user_id: int, inventory_data: dict, equipped_data: dict):
    db_modules = get_user_modules(db, user_id)
    if db_modules:
        db_modules.inventory_json = inventory_data
        db_modules.equipped_json = equipped_data
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

# --- Report ---
def create_battle_record(db: Session, parsed_data: dict, user_id: int, notes: str = None):
    main_data = parsed_data['main']
    detail_data = parsed_data['detail']
    
    if notes:
        main_data['notes'] = notes

    battle_main = BattleMain(**main_data, owner_id=user_id)
    battle_detail = BattleDetail(
        battle_date=battle_main.battle_date,
        **detail_data
    )
    
    db.merge(battle_main)
    db.merge(battle_detail)
    db.commit()
    
    # [Cache Invalidation] 데이터가 변경되었으므로 해당 유저의 통계 캐시 삭제
    if user_id in _stats_cache:
        del _stats_cache[user_id]
        
    return battle_main

def get_cutoff_date():
    # 현재 UTC 시간 기준
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=2)

def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
    # DB에 저장된 날짜가 Naive(시간대 없음)일 수 있으므로 비교를 위해 tzinfo 제거
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .filter(BattleMain.battle_date >= cutoff_date_naive)\
             .order_by(BattleMain.battle_date.desc())\
             .all()

def get_history_reports(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    cutoff_date = get_cutoff_date()
    cutoff_date_naive = cutoff_date.replace(tzinfo=None)
    
    return db.query(BattleMain)\
             .options(joinedload(BattleMain.detail))\
             .filter(BattleMain.owner_id == user_id)\
             .filter(BattleMain.battle_date < cutoff_date_naive)\
             .order_by(BattleMain.battle_date.desc())\
             .offset(skip).limit(limit).all()

def get_full_report(db: Session, battle_date: datetime, user_id: int):
    main = db.query(BattleMain).options(joinedload(BattleMain.detail)).filter(
        BattleMain.battle_date == battle_date,
        BattleMain.owner_id == user_id
    ).first()
    
    if not main:
        return None
        
    return {
        "main": main,
        "detail": main.detail
    }

# [Modified] 주간 통계 데이터 집계 (최근 7일) - 딜 미터기 제거 & 캐싱 & 날짜 에러 수정
def get_weekly_stats(db: Session, user_id: int):
    # 1. 캐시 확인
    if user_id in _stats_cache:
        cache_entry = _stats_cache[user_id]
        elapsed = datetime.now() - cache_entry["timestamp"]
        # 유효 시간(10분)이 지나지 않았다면 캐시된 데이터 즉시 반환
        if elapsed < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_entry["data"]

    # --- 계산 로직 시작 ---
    
    # [Fix] 500 에러 원인 해결: UTC Aware -> Naive 변환
    # DB에 저장된 날짜 포맷과 비교하기 위해 tzinfo를 제거합니다.
    base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    
    # 7일 전 (오늘 포함 7일 데이터)
    cutoff_date = base_date - timedelta(days=6)
    # 증감률 계산을 위해 하루 더 전 데이터도 필요 (-1일)
    fetch_start_date = cutoff_date - timedelta(days=1)
    
    reports = db.query(BattleMain)\
                .options(joinedload(BattleMain.detail))\
                .filter(BattleMain.owner_id == user_id)\
                .filter(BattleMain.battle_date >= fetch_start_date)\
                .order_by(BattleMain.battle_date.asc())\
                .all()

    # 2. 일별 데이터 그룹화
    daily_map = {}
    for r in reports:
        date_key = r.battle_date.strftime("%Y-%m-%d")
        if date_key not in daily_map:
            daily_map[date_key] = {"coins": 0, "cells": 0}
        
        # [Safety] 값이 None일 경우 0으로 처리하여 TypeError 방지
        daily_map[date_key]["coins"] += (r.coin_earned or 0)
        daily_map[date_key]["cells"] += (r.cells_earned or 0)

    # 3. 날짜순 정렬 및 증감률 계산
    daily_stats = []
    
    # 실제로 반환해야 할 날짜 리스트 생성 (cutoff_date 부터 7일간)
    target_dates = []
    for i in range(7):
        d = cutoff_date + timedelta(days=i)
        target_dates.append(d.strftime("%Y-%m-%d"))

    for date_str in target_dates:
        curr_data = daily_map.get(date_str, {"coins": 0, "cells": 0})
        
        # 전일 날짜 계산
        prev_date_obj = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)
        prev_date_str = prev_date_obj.strftime("%Y-%m-%d")
        prev_data = daily_map.get(prev_date_str, {"coins": 0, "cells": 0})
        
        # 증감률 계산 (0 나누기 방지)
        coin_growth = 0.0
        if prev_data["coins"] > 0:
            coin_growth = (curr_data["coins"] - prev_data["coins"]) / prev_data["coins"] * 100
            
        cell_growth = 0.0
        if prev_data["cells"] > 0:
            cell_growth = (curr_data["cells"] - prev_data["cells"]) / prev_data["cells"] * 100
        
        daily_stats.append({
            "date": date_str,
            "total_coins": curr_data["coins"],
            "total_cells": curr_data["cells"],
            "coin_growth": round(coin_growth, 1),
            "cell_growth": round(cell_growth, 1)
        })

    # --- 계산 로직 끝 ---

    result = {"daily_stats": daily_stats}

    # 4. 계산 결과를 캐시에 저장 (현재 시간과 함께)
    _stats_cache[user_id] = {
        "timestamp": datetime.now(),
        "data": result
    }

    return result