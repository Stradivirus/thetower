from sqlalchemy.orm import Session
from models import BattleMain, BattleDetail
from datetime import datetime

def create_battle_record(db: Session, parsed_data: dict, notes: str = None):
    """
    전투 기록 저장 (Upsert: 있으면 수정, 없으면 생성)
    """
    main_data = parsed_data['main']
    detail_data = parsed_data['detail']
    
    # 메모가 들어왔으면 추가
    if notes:
        main_data['notes'] = notes

    # 1. Main 데이터 객체 생성
    battle_main = BattleMain(**main_data)
    
    # 2. Detail 데이터 객체 생성 (Main의 PK인 battle_date 사용)
    battle_detail = BattleDetail(
        battle_date=battle_main.battle_date,
        **detail_data
    )
    
    # 3. merge를 사용하여 '덮어쓰기' (중복 에러 방지)
    # 기존 데이터가 있으면 업데이트, 없으면 INSERT 됩니다.
    db.merge(battle_main)
    db.merge(battle_detail)
    
    db.commit()
    return battle_main

def get_battle_mains(db: Session, skip: int = 0, limit: int = 100):
    """리스트 조회: Detail 조인 없이 Main만 가져옴 (속도 🚀)"""
    return db.query(BattleMain)\
             .order_by(BattleMain.battle_date.desc())\
             .offset(skip).limit(limit).all()

def get_full_report(db: Session, battle_date: datetime):
    """상세 조회: Main + Detail 한 번에 가져오기"""
    # 사실상 1:1 관계라 Main만 불러도 detail 접근 가능하지만, 명시적으로
    main = db.query(BattleMain).filter(BattleMain.battle_date == battle_date).first()
    if not main:
        return None
        
    return {
        "main": main,
        "detail": main.detail  # 관계 설정 덕분에 자동 로딩됨
    }