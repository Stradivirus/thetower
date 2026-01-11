# back/parser.py
import re
from datetime import datetime
from sqlalchemy.orm import Session
from crud import max_wave as max_wave_crud

def parse_number(value_str: str):
    if not value_str: return 0
    if isinstance(value_str, (int, float)): return int(value_str)
    clean_str = str(value_str).strip().replace('$', '').replace('X', '').replace('x', '')
    multipliers = {
        'ac': 10**42, 'ab': 10**39, 'aa': 10**36,
        'D': 10**33, 'd': 10**33, 'N': 10**30, 'n': 10**30, 'O': 10**27, 'o': 10**27,
        'S': 10**24, 's': 10**21, 'Q': 10**18, 'q': 10**15,
        'T': 10**12, 't': 10**12, 'B': 10**9, 'b': 10**9, 'M': 10**6, 'm': 10**6, 'K': 10**3, 'k': 10**3
    }
    multiplier = 1
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = mult
            clean_str = clean_str[:-len(suffix)]
            break
    try:
        return int(float(clean_str.replace(',', '')) * multiplier)
    except ValueError:
        return 0

def calculate_top_damages(combat_json: dict):
    if not combat_json: return []
    
    exclude_names = [
        "입힌", "받은", "장벽이 받은", "회복 패키지", "생명력 흡수", "죽음 저항",
        "오브", "블랙홀"
    ]
    
    top_damages = []
    
    for key, val in combat_json.items():
        if not key.endswith(" 대미지") and key != "전자 손상": 
            continue

        clean_name = key.replace(" 대미지", "")
        
        if clean_name in exclude_names:
            continue
        
        raw_val = parse_number(str(val))
        
        top_damages.append({
            "name": clean_name,
            "raw": raw_val
        })
    
    top_damages.sort(key=lambda x: x['raw'], reverse=True)
    
    return [item['name'] for item in top_damages[:3]]

def parse_battle_report(text: str) -> dict:
    clean_text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = clean_text.split('\n')
    
    sections = {'report': {}, 'combat': {}, 'utility': {}, 'enemy': {}, 'bot': {}}
    current_section = 'report'
    section_map = {'전투 보고': 'report', '전투': 'combat', '유틸리티': 'utility', '적 파괴': 'enemy', '봇': 'bot', '가디언': 'bot'}

    for line in lines:
        line = line.strip()
        if not line: continue
        if line in section_map:
            current_section = section_map[line]
            continue
        key, val = None, None
        if '\t' in line:
            parts = line.split('\t')
            key, val = parts[0].strip(), parts[-1].strip()
        else:
            if current_section == 'report':
                for sk in ["전투 날짜", "게임 시간", "실시간", "시간당 코인"]:
                    if line.startswith(sk):
                        key, val = sk, line.replace(sk, "", 1).strip()
                        break
            if not key:
                parts = line.rsplit(' ', 1)
                if len(parts) == 2: key, val = parts[0].strip(), parts[1].strip()
        if key and val: sections[current_section][key] = val

    repo = sections['report']
    comb = sections['combat']
    enemy = sections['enemy']
    bot = sections['bot']

    date_str = repo.get('전투 날짜', '')
    try:
        match = re.match(r'(\d+)월\s+(\d+),\s+(\d+)\s+(\d+):(\d+)', date_str)
        if match:
            month, day, year, hour, minute = match.groups()
            battle_date = datetime(int(year), int(month), int(day), int(hour), int(minute))
        else:
            battle_date = datetime.now()
    except:
        battle_date = datetime.now()

    main_data = {
        'battle_date': battle_date,
        'tier': repo.get('티어', 'T1'),
        'wave': int(repo.get('웨이브', '0').replace(',', '')),
        'game_time': repo.get('게임 시간', ''),
        'real_time': repo.get('실시간', ''),
        'coin_earned': parse_number(repo.get('코인 획득', '0')),
        'coins_per_hour': parse_number(repo.get('시간당 코인', '0')),
        'cells_earned': parse_number(repo.get('획득한 셀', '0')),
        'reroll_shards_earned': parse_number(repo.get('다시 뽑기 파편 획득함', '0')),
        'killer': repo.get('처치자', ''),
        'damage_dealt': comb.get('입힌 대미지', '0'),
        'damage_taken': comb.get('받은 대미지', '0'),
        'total_enemies': parse_number(enemy.get('적 합계', '0')),
        'death_wave_kills': parse_number(comb.get('데스웨이브에 의해 표시됨', '0')),
        'spotlight_kills': parse_number(enemy.get('스포트라이트로 파괴함', '0')),
        'golden_bot_kills': parse_number(bot.get('황금 봇에서 파괴됨', '0')),
        'top_damages': calculate_top_damages(comb) 
    }
    
    detail_data = {
        'combat_json': sections['combat'],
        'utility_json': sections['utility'],
        'enemy_json': sections['enemy'],
        'bot_json': sections['bot'],
    }

    return {'main': main_data, 'detail': detail_data}

# [추가] 파싱된 데이터를 기반으로 최고 기록을 갱신하는 헬퍼 함수
def update_server_max_wave(db: Session, main_data: dict):
    try:
        tier_str = str(main_data.get('tier', '1'))
        # "T1", "티어 1" 등에서 숫자만 추출
        tier_val = int(re.search(r'\d+', tier_str).group())
        wave_val = int(main_data.get('wave', 0))

        if tier_val > 0 and wave_val > 0:
            max_wave_crud.update_tier_record(db, tier=tier_val, wave=wave_val)
    except Exception as e:
        print(f"Global Max Wave Update Failed: {e}")