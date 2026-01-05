# back/crud/report_utils.py
from .utils import parse_game_number_safe  # [추가] 단위 계산 함수 임포트

def parse_top_damages(combat_json):
    """combat_json에서 top_damages 리스트 생성"""
    if not combat_json:
        return []
    
    # 제외할 전체 통계 키들
    exclude_keys = ["입힌 대미지", "받은 대미지", "장벽이 받은 대미지", "회복 패키지", "생명력 흡수", "죽음 저항"]
    top_damages = []
    
    for key, val in combat_json.items():
        # 1. 필터링: '~ 대미지'로 끝나는 항목과 '전자 손상'만 포함
        if not key.endswith(" 대미지") and key != "전자 손상":
            continue

        # 2. 제외 목록 확인
        if key in exclude_keys:
            continue
        
        # [핵심 수정] 기존의 단순 문자열 제거 방식 대신, 단위를 계산하는 함수 사용
        raw_val = parse_game_number_safe(str(val))
        
        top_damages.append({
            "name": key.replace(" 대미지", ""),
            "value": str(val),
            "raw": raw_val
        })
    
    # 실제 크기(raw) 기준으로 내림차순 정렬
    top_damages.sort(key=lambda x: x['raw'], reverse=True)
    return top_damages

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
        
        "top_damages": parse_top_damages(row.combat_json) if hasattr(row, 'combat_json') and row.combat_json else [],
        
        "death_wave_ratio": format_ratio(getattr(row, "death_wave_ratio", None)),
        "spotlight_ratio": format_ratio(getattr(row, "spotlight_ratio", None)),
        "golden_bot_ratio": format_ratio(getattr(row, "golden_bot_ratio", None)), # [추가]
    }