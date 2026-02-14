# back/parser.py
import re
from datetime import datetime
from sqlalchemy.orm import Session
from crud import max_wave as max_wave_crud
from mappings import SECTION_MAP, KEY_MAP, EXCLUDE_TOP_DAMAGE

def parse_number(value_str: str):
    if not value_str: return 0
    if isinstance(value_str, (int, float)): return int(value_str)
    
    # $, X, x 제거 및 공백 제거
    clean_str = str(value_str).strip().replace('$', '').replace('X', '').replace('x', '')
    
    # The Tower 게임 특성상 대소문자 suffix가 섞여 있으므로 매핑 테이블 활용
    multipliers = {
        'ac': 10**42, 'ab': 10**39, 'aa': 10**36,
        'D': 10**33, 'd': 10**33, 'N': 10**30, 'n': 10**30, 'O': 10**27, 'o': 10**27,
        'S': 10**24, 's': 10**21, 'Q': 10**18, 'q': 10**15,
        'T': 10**12, 't': 10**12, 'B': 10**9, 'b': 10**9, 'M': 10**6, 'm': 10**6, 'K': 10**3, 'k': 10**3
    }
    
    multiplier = 1
    # 긴 suffix부터 매칭 (예: 'ac'가 'c'보다 먼저 매칭되도록)
    sorted_suffixes = sorted(multipliers.keys(), key=len, reverse=True)
    
    for suffix in sorted_suffixes:
        if clean_str.endswith(suffix):
            multiplier = multipliers[suffix]
            clean_str = clean_str[:-len(suffix)]
            break
            
    try:
        return int(float(clean_str.replace(',', '')) * multiplier)
    except ValueError:
        return 0

def parse_date(date_str: str) -> datetime:
    """한글 및 영문 날짜 포맷을 모두 처리"""
    if not date_str:
        return datetime.now()

    # 1. 한글 포맷 시도: "2월 10, 2026 14:08"
    try:
        match = re.match(r'(\d+)월\s+(\d+),\s+(\d+)\s+(\d+):(\d+)', date_str)
        if match:
            month, day, year, hour, minute = match.groups()
            return datetime(int(year), int(month), int(day), int(hour), int(minute))
    except:
        pass

    # 2. 영문 포맷 시도: "Feb 10, 2026 13:12"
    try:
        # 영문 월 이름을 숫자로 매핑
        months = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        }
        match = re.match(r'([A-Za-z]+)\s+(\d+),\s+(\d+)\s+(\d+):(\d+)', date_str)
        if match:
            month_str, day, year, hour, minute = match.groups()
            month = months.get(month_str[:3], 1) # 앞 3글자만 비교
            return datetime(int(year), month, int(day), int(hour), int(minute))
    except:
        pass
        
    return datetime.now()

def calculate_top_damages(combat_json: dict):
    if not combat_json: return []
    
    top_damages = []
    
    for key, val in combat_json.items():
        # 한글(" 대미지") 또는 영어(" Damage" / " damage") 확인
        is_damage_key = key.endswith(" 대미지") or key.lower().endswith(" damage")
        
        # 예외: "전자 손상"은 데미지 항목임
        if not is_damage_key and key != "전자 손상" and key != "Electrons Damage":
            continue

        # " 대미지" 또는 " Damage" 제거
        clean_name = re.sub(r'( 대미지| Damage| damage)$', '', key, flags=re.IGNORECASE)
        
        # 제외 목록 확인
        if clean_name in EXCLUDE_TOP_DAMAGE:
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
    
    # 4개 섹션 + Report 데이터 임시 저장소
    sections = {'report': {}, 'combat': {}, 'utility': {}, 'enemy': {}, 'bot': {}}
    current_section = 'report'

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 1. 섹션 헤더 감지 (Mapping 사용)
        if line in SECTION_MAP:
            current_section = SECTION_MAP[line]
            continue
            
        key, val = None, None
        
        # 2. Key-Value 파싱
        if '\t' in line:
            parts = line.split('\t')
            key, val = parts[0].strip(), parts[-1].strip()
        else:
            # Report 섹션의 상단 정보 처리 (날짜, 시간 등)
            if current_section == 'report':
                # KEY_MAP에 있는 Date 관련 키워드로 시작하는지 확인
                for map_key, std_key in KEY_MAP.items():
                    if std_key in ['battle_date', 'game_time', 'real_time', 'coins_per_hour']:
                        if line.startswith(map_key):
                            key = map_key
                            val = line.replace(map_key, "", 1).strip()
                            break
            # 일반적인 공백 구분 처리
            if not key:
                parts = line.rsplit(' ', 1)
                if len(parts) == 2: key, val = parts[0].strip(), parts[1].strip()
        
        if key and val:
            # 원본 키 그대로 저장 (JSON 디테일용)
            sections[current_section][key] = val
            
            # 매핑된 표준 키가 있다면 추가 저장 (Main DB 저장용 편의성)
            if key in KEY_MAP:
                std_key = KEY_MAP[key]
                sections[current_section][f"_std_{std_key}"] = val

    # 편의 변수
    repo = sections['report']
    comb = sections['combat']
    enemy = sections['enemy']
    bot = sections['bot']
    
    # 표준화된 값 가져오기 헬퍼
    def get_std(section_dict, std_key, default='0'):
        return section_dict.get(f"_std_{std_key}", default)

    # 날짜 파싱
    date_str = get_std(repo, 'battle_date', '')
    battle_date = parse_date(date_str)

    main_data = {
        'battle_date': battle_date,
        'tier': get_std(repo, 'tier', 'T1'),
        'wave': int(get_std(repo, 'wave', '0').replace(',', '')),
        'game_time': get_std(repo, 'game_time', ''),
        'real_time': get_std(repo, 'real_time', ''),
        
        'coin_earned': parse_number(get_std(repo, 'coin_earned')),
        'coins_per_hour': parse_number(get_std(repo, 'coins_per_hour')),
        'cells_earned': parse_number(get_std(repo, 'cells_earned')),
        'reroll_shards_earned': parse_number(get_std(repo, 'reroll_shards_earned')),
        
        'killer': get_std(repo, 'killer', ''),
        'damage_dealt': get_std(comb, 'damage_dealt', '0'),
        'damage_taken': get_std(comb, 'damage_taken', '0'),
        
        'total_enemies': parse_number(get_std(enemy, 'total_enemies')),
        
        'death_wave_kills': parse_number(get_std(comb, 'death_wave_kills')),
        'spotlight_kills': parse_number(get_std(enemy, 'spotlight_kills')),
        'golden_bot_kills': parse_number(get_std(bot, 'golden_bot_kills')),
        
        'top_damages': calculate_top_damages(comb) 
    }
    
    detail_data = {
        'combat_json': sections['combat'],
        'utility_json': sections['utility'],
        'enemy_json': sections['enemy'],
        'bot_json': sections['bot'],
    }

    return {'main': main_data, 'detail': detail_data}

def update_server_max_wave(db: Session, main_data: dict):
    try:
        tier_str = str(main_data.get('tier', '1'))
        tier_val = int(re.search(r'\d+', tier_str).group()) if re.search(r'\d+', tier_str) else 1
        wave_val = int(main_data.get('wave', 0))

        if tier_val > 0 and wave_val > 0:
            max_wave_crud.update_tier_record(db, tier=tier_val, wave=wave_val)
    except Exception as e:
        print(f"Global Max Wave Update Failed: {e}")