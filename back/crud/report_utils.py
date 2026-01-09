# back/crud/report_utils.py
from .utils import parse_game_number_safe 

def row_to_report_dict(row):
    """DB row를 BattleMainResponse 호환 딕셔너리로 변환"""
    
    def format_ratio(val):
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
        
        "top_damages": getattr(row, "top_damages", []), 
        
        "death_wave_ratio": format_ratio(getattr(row, "death_wave_ratio", None)),
        "spotlight_ratio": format_ratio(getattr(row, "spotlight_ratio", None)),
        "golden_bot_ratio": format_ratio(getattr(row, "golden_bot_ratio", None)),
    }