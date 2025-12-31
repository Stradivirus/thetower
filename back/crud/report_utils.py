# back/crud/report_utils.py
"""
리포트 처리 유틸리티
DB 결과를 딕셔너리로 변환하는 공통 로직
"""

def parse_top_damages(combat_json):
    """combat_json에서 top_damages 리스트 생성"""
    if not combat_json:
        return []
    
    exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
    top_damages = []
    
    for key, val in combat_json.items():
        if key in exclude_keys:
            continue
        
        if isinstance(val, (str, int, float)):
            clean_val = str(val).replace(',', '').replace('x', '').replace('X', '').rstrip('KMBTQqSsOoNnDdU')
            try:
                raw_val = float(clean_val) if clean_val else 0
            except ValueError:
                raw_val = 0
            
            top_damages.append({
                "name": key.replace(" 대미지", ""),
                "value": str(val),
                "raw": raw_val
            })
    
    top_damages.sort(key=lambda x: x['raw'], reverse=True)
    return top_damages

def row_to_report_dict(row):
    """DB row를 BattleMainResponse 호환 딕셔너리로 변환"""
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
        "top_damages": parse_top_damages(row.combat_json),
        "death_wave_ratio": f"{row.death_wave_ratio}%" if row.death_wave_ratio else "-",
        "spotlight_ratio": f"{row.spotlight_ratio}%" if row.spotlight_ratio else "-"
    }