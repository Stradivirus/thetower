from sqlalchemy.orm import Session, joinedload
from models import BattleMain, BattleDetail, User, UserProgress, UserModules
from datetime import datetime, timedelta, timezone
import schemas

# 간단한 인메모리 캐시 저장소
_stats_cache = {}
CACHE_EXPIRE_MINUTES = 10

# [Safety] 안전한 파싱 함수
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
    
    keys_to_remove = [k for k in _stats_cache.keys() if str(k).startswith(str(user_id))]
    for k in keys_to_remove:
        del _stats_cache[k]
        
    return battle_main

def get_cutoff_date():
    now = datetime.now(timezone.utc)
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight - timedelta(days=2)

def get_recent_reports(db: Session, user_id: int):
    cutoff_date = get_cutoff_date()
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

# 1. 일간 통계 (어제 기준 최근 7일)
def get_weekly_stats(db: Session, user_id: int):
    cache_key = f"{user_id}_daily"
    
    if cache_key in _stats_cache:
        cache_entry = _stats_cache[cache_key]
        if (datetime.now() - cache_entry["timestamp"]) < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_entry["data"]

    # 오늘 자정 (UTC)
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    # 8일치 데이터 로드 (D-1 ~ D-8)
    fetch_start_date = yesterday - timedelta(days=7)
    
    reports = db.query(BattleMain)\
                .filter(BattleMain.owner_id == user_id)\
                .filter(BattleMain.battle_date >= fetch_start_date)\
                .filter(BattleMain.battle_date < now_utc)\
                .order_by(BattleMain.battle_date.asc())\
                .all()

    daily_map = {}
    for r in reports:
        date_key = r.battle_date.strftime("%Y-%m-%d")
        if date_key not in daily_map:
            daily_map[date_key] = {"coins": 0, "cells": 0}
        
        daily_map[date_key]["coins"] += (r.coin_earned or 0)
        daily_map[date_key]["cells"] += (r.cells_earned or 0)

    daily_stats = []
    
    # 실제 보여줄 날짜: D-1 ~ D-7 (7일)
    display_start_date = yesterday - timedelta(days=6)
    
    target_dates = []
    for i in range(7):
        d = display_start_date + timedelta(days=i)
        target_dates.append(d.strftime("%Y-%m-%d"))

    for date_str in target_dates:
        curr_data = daily_map.get(date_str, {"coins": 0, "cells": 0})
        
        prev_date_obj = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)
        prev_date_str = prev_date_obj.strftime("%Y-%m-%d")
        prev_data = daily_map.get(prev_date_str, {"coins": 0, "cells": 0})
        
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

    result = {"daily_stats": daily_stats}
    _stats_cache[cache_key] = {"timestamp": datetime.now(), "data": result}
    return result

# 2. 주간 트렌드 (최근 8주 Rolling - 어제 기준 7일씩 묶음) [Updated]
def get_weekly_trends(db: Session, user_id: int):
    cache_key = f"{user_id}_weekly"
    
    if cache_key in _stats_cache:
        cache_entry = _stats_cache[cache_key]
        if (datetime.now() - cache_entry["timestamp"]) < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_entry["data"]

    # 기준일: 어제
    now_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    yesterday = now_utc - timedelta(days=1)
    
    # [Rolling Week Logic]
    # Bucket 0: [어제-6일 ~ 어제] (7일간)
    # Bucket 1: [어제-13일 ~ 어제-7일]
    # ...
    # 보여줄 8주치 + 비교용 1주 = 총 9주(63일) 데이터 필요
    fetch_start_date = yesterday - timedelta(days=63)
    
    # 오늘 데이터 제외
    reports = db.query(BattleMain)\
                .filter(BattleMain.owner_id == user_id)\
                .filter(BattleMain.battle_date >= fetch_start_date)\
                .filter(BattleMain.battle_date < now_utc)\
                .order_by(BattleMain.battle_date.asc())\
                .all()

    weekly_map = {}
    
    # 리포트 그룹화 (Rolling)
    for r in reports:
        # 어제 날짜와의 차이를 구함
        diff_days = (yesterday - r.battle_date.replace(hour=0,minute=0,second=0,microsecond=0)).days
        
        # 미래 데이터 방어
        if diff_days < 0: continue
        
        # 주차 인덱스 계산 (0: 최신주, 1: 1주전...)
        week_idx = diff_days // 7
        
        # 해당 주차의 종료일(End Date)과 시작일(Start Date) 계산
        # End Date = Yesterday - (week_idx * 7)
        # Start Date = End Date - 6
        end_date = yesterday - timedelta(days=week_idx * 7)
        start_date = end_date - timedelta(days=6)
        
        # 키는 '시작일'로 저장 (프론트엔드 표기를 위해)
        key = start_date.strftime("%Y-%m-%d")
        
        if key not in weekly_map:
            weekly_map[key] = {"coins": 0, "cells": 0}
            
        weekly_map[key]["coins"] += (r.coin_earned or 0)
        weekly_map[key]["cells"] += (r.cells_earned or 0)

    trend_stats = []
    
    # 8주치 타겟 생성 (과거 -> 최신)
    # i=0 (7주전) ... i=7 (이번주)
    target_weeks = []
    for i in range(8):
        # week_idx = 7 - i
        week_idx = 7 - i
        end_date = yesterday - timedelta(days=week_idx * 7)
        start_date = end_date - timedelta(days=6)
        target_weeks.append(start_date.strftime("%Y-%m-%d"))

    for week_str in target_weeks:
        curr_data = weekly_map.get(week_str, {"coins": 0, "cells": 0})
        
        # 전주 시작일 (7일 전)
        prev_date_obj = datetime.strptime(week_str, "%Y-%m-%d") - timedelta(days=7)
        prev_week_str = prev_date_obj.strftime("%Y-%m-%d")
        prev_data = weekly_map.get(prev_week_str, {"coins": 0, "cells": 0})
        
        coin_growth = 0.0
        if prev_data["coins"] > 0:
            coin_growth = (curr_data["coins"] - prev_data["coins"]) / prev_data["coins"] * 100
            
        cell_growth = 0.0
        if prev_data["cells"] > 0:
            cell_growth = (curr_data["cells"] - prev_data["cells"]) / prev_data["cells"] * 100
            
        trend_stats.append({
            "week_start_date": week_str,
            "total_coins": curr_data["coins"],
            "total_cells": curr_data["cells"],
            "coin_growth": round(coin_growth, 1),
            "cell_growth": round(cell_growth, 1)
        })

    result = {"weekly_stats": trend_stats}
    _stats_cache[cache_key] = {"timestamp": datetime.now(), "data": result}
    return result