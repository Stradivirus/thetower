"""
파일명: thetower/back/crud/report_utils.py
용도: 전투 기록 데이터 처리를 위한 유틸리티 함수
기능: DB 로우 데이터를 응답용 딕셔너리로 변환
"""
from .utils import parse_game_number_safe 

def row_to_report_dict(row):
    """
    DB에서 조회된 SQLAlchemy Row 객체를 응답 스키마(BattleMainResponse)와 호환되는 딕셔너리로 변환합니다.
    - 비율 데이터 포맷팅 (숫자 -> 문자열%)
    - 선택적 속성(getattr) 안전하게 처리
    """
    
    def format_ratio(val):
        """숫자형 비율을 백분율 문자열로 변환합니다."""
        return f"{val}%" if val is not None else None

    return {
        "battle_date": row.battle_date,
        "created_at": row.created_at,
        "tier": row.tier,
        "wave": row.wave,
        "game_time": row.game_time,
        "real_time": row.real_time,
        "coin_earned": row.coin_earned,
        "coins_per_hour": row.coins_per_hour,
        "cells_earned": row.cells_earned,
        "reroll_shards_earned": row.reroll_shards_earned,
        "killer": row.killer,
        "damage_dealt": row.damage_dealt,
        "damage_taken": row.damage_taken,
        "notes": row.notes,
        
        # 존재하지 않을 수 있는 컬럼들은 getattr로 기본값 처리
        "top_damages": getattr(row, "top_damages", []), 
        
        "death_wave_ratio": format_ratio(getattr(row, "death_wave_ratio", None)),
        "spotlight_ratio": format_ratio(getattr(row, "spotlight_ratio", None)),
        "golden_bot_ratio": format_ratio(getattr(row, "golden_bot_ratio", None)),
    }