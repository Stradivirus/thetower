from datetime import datetime

def parse_battle_report(text: str) -> dict:
    """전투 보고서 텍스트를 파싱하여 딕셔너리로 변환"""
    lines = text.strip().split('\n')
    data = {}
    
    # 각 줄을 탭으로 분리하여 키-값 매핑
    for line in lines:
        parts = line.split('\t')
        if len(parts) == 2:
            key = parts[0].strip()
            value = parts[1].strip()
            data[key] = value
    
    # 한국어 월 이름을 숫자로 변환
    month_map = {
        '1월': '01', '2월': '02', '3월': '03', '4월': '04',
        '5월': '05', '6월': '06', '7월': '07', '8월': '08',
        '9월': '09', '10월': '10', '11월': '11', '12월': '12'
    }
    
    # 날짜 파싱
    battle_date_str = data.get('전투 날짜', '')
    try:
        # "11월 20, 2025 17:36" 형식 파싱
        import re
        match = re.match(r'(\d+월)\s+(\d+),\s+(\d+)\s+(\d+):(\d+)', battle_date_str)
        if match:
            month_kr, day, year, hour, minute = match.groups()
            month = month_map.get(month_kr, '01')
            battle_date = datetime(int(year), int(month), int(day), int(hour), int(minute))
        else:
            battle_date = datetime.now()
    except Exception as e:
        print(f"날짜 파싱 오류: {e}")
        battle_date = datetime.now()
    
    # BattleReport
    battle_report = {
        'battle_date': battle_date,
        'game_time': data.get('게임 시간', ''),
        'real_time': data.get('실시간', ''),
        'tier': data.get('티어', ''),
        'wave': data.get('웨이브', ''),
        'killer': data.get('처치자', ''),
        'coin_earned': data.get('코인 획득', ''),
        'coin_per_hour': data.get('시간당 코인', ''),
        'cash_earned': data.get('캐시 획득', ''),
        'profit_earned': data.get('이익 획득', ''),
        'gem_block_tap': data.get('보석 블록 탭', ''),
        'cells_earned': data.get('획득한 셀', ''),
        'reroll_shards_earned': data.get('다시 뽑기 파편 획득함', ''),
    }
    
    # CombatStats
    combat_stats = {
        'battle_date': battle_date,
        'damage_dealt': data.get('입힌 대미지', ''),
        'damage_taken': data.get('받은 대미지', ''),
        'barrier_damage_taken': data.get('장벽이 받은 대미지', ''),
        'berserker_damage_taken': data.get('광전사 효과 동안 받은 대미지', ''),
        'berserker_damage_multiplier': data.get('광전사 효과로 획득한 대미지', ''),
        'death_resistance': data.get('죽음 저항', ''),
        'lifesteal': data.get('생명력 흡수', ''),
        'projectile_damage': data.get('투사체 대미지', ''),
        'projectile_count': data.get('투사체 수', ''),
        'thorn_damage': data.get('가시 대미지', ''),
        'orb_damage': data.get('오브 대미지', ''),
        'orb_hits': data.get('오브에 맞은 적', ''),
        'mine_damage': data.get('지뢰 대미지', ''),
        'mines_created': data.get('생성된 지뢰', ''),
        'armor_shred_damage': data.get('방어구 가르기 대미지', ''),
        'death_ray_damage': data.get('죽음의 광선 대미지', ''),
        'smart_missile_damage': data.get('스마트 미사일 대미지', ''),
        'inner_mine_damage': data.get('내부 지뢰 대미지', ''),
        'chain_lightning_damage': data.get('연쇄 번개 대미지', ''),
        'death_wave_damage': data.get('죽음의 파동 대미지', ''),
        'death_wave_tagged': data.get('Deathwave로 태그됨', ''),
        'swamp_damage': data.get('늪 대미지', ''),
        'black_hole_damage': data.get('블랙홀 대미지', ''),
    }
    
    # UtilityStats
    utility_stats = {
        'battle_date': battle_date,
        'waves_skipped': data.get('건너뛴 웨이브', ''),
        'recovery_packages': data.get('회복 패키지', ''),
        'free_attack_upgrades': data.get('무료 공격 업그레이드', ''),
        'free_defense_upgrades': data.get('무료 방어 업그레이드', ''),
        'free_utility_upgrades': data.get('무료 유틸리티 업그레이드', ''),
        'death_wave_health': data.get('죽음의 파동으로 획득한 체력', ''),
        'death_wave_coins': data.get('죽음의 파동으로 획득한 코인', ''),
        'golden_tower_cash': data.get('황금 타워로 획득한 캐시', ''),
        'golden_tower_coins': data.get('황금 타워로 획득한 코인', ''),
        'black_hole_coins': data.get('블랙홀로 획득한 코인', ''),
        'spotlight_coins': data.get('스포트라이트로 획득한 코인', ''),
        'orb_coins': data.get('오브로 획득한 코인', ''),
        'coin_upgrade_coins': data.get('코인 업그레이드로 얻은 코인', ''),
        'coin_bonus_coins': data.get('코인 보너스의 코인', ''),
    }
    
    # EnemyStats
    enemy_stats = {
        'battle_date': battle_date,
        'total_enemies': data.get('적 합계', ''),
        'basic': data.get('기본', ''),
        'swift': data.get('신속', ''),
        'tanking': data.get('탱킹', ''),
        'ranged': data.get('원거리', ''),
        'boss': data.get('보스', ''),
        'guardian': data.get('수호자', ''),
        'total_elite': data.get('총 엘리트', ''),
        'vampire': data.get('뱀파이어', ''),
        'beam': data.get('광선', ''),
        'scatter': data.get('스캐터', ''),
        'saboteur': data.get('방해 공작원', ''),
        'commander': data.get('사령관', ''),
        'discount': data.get('에누리', ''),
        'destroyed_by_orb': data.get('오브에 의해 파괴', ''),
        'destroyed_by_thorn': data.get('가시로 파괴함', ''),
        'destroyed_by_death_ray': data.get('죽음의 광선으로 파괴함', ''),
        'destroyed_by_mine': data.get('지뢰로 파괴함', ''),
        'destroyed_in_spotlight': data.get('스포트라이트 속에서 파괴됨', ''),
    }
    
    # BotGuardianStats
    bot_guardian_stats = {
        'battle_date': battle_date,
        'flame_bot_damage': data.get('화염 봇 대미지', ''),
        'thunder_bot_stuns': data.get('천둥 봇 기절', ''),
        'golden_bot_coins': data.get('황금 봇 코인 획득', ''),
        'destroyed_by_golden_bot': data.get('골든봇에서 파괴됨', ''),
        'guardian_damage': data.get('대미지', ''),
        'guardian_summoned_enemies': data.get('소환된 적들', ''),
        'guardian_stolen_coins': data.get('가디언이 훔친 코인', ''),
        'guardian_returned_coins': data.get('가져온 동전', ''),
        'gems': data.get('보석', ''),
        'medals': data.get('메달', ''),
        'reroll_shards': data.get('샤드 재롤', ''),
        'cannon_shards': data.get('대포 파편', ''),
        'armor_shards': data.get('갑옷 파편', ''),
        'generator_shards': data.get('발전기 파편', ''),
        'core_shards': data.get('코어 샤드', ''),
        'common_modules': data.get('공통 모듈', ''),
        'rare_modules': data.get('희귀 모듈', ''),
    }
    
    return {
        'battle_report': battle_report,
        'combat_stats': combat_stats,
        'utility_stats': utility_stats,
        'enemy_stats': enemy_stats,
        'bot_guardian_stats': bot_guardian_stats,
    }