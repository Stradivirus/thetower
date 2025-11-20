from sqlalchemy.orm import Session
from models import BattleReport, CombatStats, UtilityStats, EnemyStats, BotGuardianStats
from datetime import datetime

def create_full_report(db: Session, parsed_data: dict):
    """전체 보고서를 5개 테이블에 저장"""
    
    # BattleReport
    battle_report = BattleReport(**parsed_data['battle_report'])
    db.add(battle_report)
    
    # CombatStats
    combat_stats = CombatStats(**parsed_data['combat_stats'])
    db.add(combat_stats)
    
    # UtilityStats
    utility_stats = UtilityStats(**parsed_data['utility_stats'])
    db.add(utility_stats)
    
    # EnemyStats
    enemy_stats = EnemyStats(**parsed_data['enemy_stats'])
    db.add(enemy_stats)
    
    # BotGuardianStats
    bot_guardian_stats = BotGuardianStats(**parsed_data['bot_guardian_stats'])
    db.add(bot_guardian_stats)
    
    db.commit()
    db.refresh(battle_report)
    
    return battle_report

def get_battle_reports(db: Session, skip: int = 0, limit: int = 100):
    """전투 보고서 목록 조회"""
    return db.query(BattleReport).order_by(BattleReport.battle_date.desc()).offset(skip).limit(limit).all()

def get_battle_report(db: Session, battle_date: datetime):
    """특정 전투 보고서 조회"""
    return db.query(BattleReport).filter(BattleReport.battle_date == battle_date).first()

def get_combat_stats(db: Session, battle_date: datetime):
    """전투 통계 조회"""
    return db.query(CombatStats).filter(CombatStats.battle_date == battle_date).first()

def get_utility_stats(db: Session, battle_date: datetime):
    """유틸리티 통계 조회"""
    return db.query(UtilityStats).filter(UtilityStats.battle_date == battle_date).first()

def get_enemy_stats(db: Session, battle_date: datetime):
    """적 통계 조회"""
    return db.query(EnemyStats).filter(EnemyStats.battle_date == battle_date).first()

def get_bot_guardian_stats(db: Session, battle_date: datetime):
    """봇/가디언 통계 조회"""
    return db.query(BotGuardianStats).filter(BotGuardianStats.battle_date == battle_date).first()

def get_full_report(db: Session, battle_date: datetime):
    """전체 보고서 조회"""
    battle_report = get_battle_report(db, battle_date)
    if not battle_report:
        return None
    
    return {
        'battle_report': battle_report,
        'combat_stats': get_combat_stats(db, battle_date),
        'utility_stats': get_utility_stats(db, battle_date),
        'enemy_stats': get_enemy_stats(db, battle_date),
        'bot_guardian_stats': get_bot_guardian_stats(db, battle_date),
    }