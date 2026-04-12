# back/parser.py
"""
파일명: thetower/back/parser.py
용도: 게임 전투 리포트 텍스트 파싱 엔진
기능: 숫자 단위 변환, 날짜 파싱, 섹션별 데이터 추출 및 표준화
"""
import re
from datetime import datetime
from mappings import (
    KEY_MAP,
    SECTION_MAP,
    EXCLUDE_TOP_DAMAGE,
    V2_LINE_THRESHOLD,
    SECTION_MAP_V2,
    KEY_MAP_V2_REPORT,
    KEY_MAP_V2_RECORDS,
    DAMAGE_JSON_SECTIONS,
    STATS_JSON_SECTIONS,
)

def parse_number(value_str: str):
    """
    게임 특유의 숫자 단위(K, M, B, T 등)를 정수형으로 변환
    :param value_str: 변환할 문자열 (예: '1.5M', '23.4B')
    :return: 변환된 정수값
    """
    if not value_str: return 0
    if isinstance(value_str, (int, float)): return int(value_str)
    
    # 기호 및 공백 제거
    clean_str = str(value_str).strip().replace('$', '').replace('X', '').replace('x', '')
    
    # 단위 매핑 (대소문자 구분 없음)
    multipliers = {
        'az': 10**111, 'ay': 10**108, 'ax': 10**105, 'aw': 10**102, 'av': 10**99, 'au': 10**96, 'at': 10**93, 'as': 10**90, 'ar': 10**87, 'aq': 10**84, 'ap': 10**81, 'ao': 10**78, 'an': 10**75, 'am': 10**72, 'al': 10**69, 'ak': 10**66, 'aj': 10**63, 'ai': 10**60, 'ah': 10**57, 'ag': 10**54, 'af': 10**51, 'ae': 10**48, 'ad': 10**45,
        'ac': 10**42, 'ab': 10**39, 'aa': 10**36,
        'D': 10**33, 'd': 10**33, 'N': 10**30, 'n': 10**30, 'O': 10**27, 'o': 10**27,
        'S': 10**24, 's': 10**21, 'Q': 10**18, 'q': 10**15,
        'T': 10**12, 't': 10**12, 'B': 10**9, 'b': 10**9, 'M': 10**6, 'm': 10**6, 'K': 10**3, 'k': 10**3
    }
    
    multiplier = 1
    # 긴 접미사부터 매칭 시도
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
    """
    한글 및 영문 날짜 포맷을 datetime 객체로 변환
    :param date_str: 날짜 문자열
    :return: datetime 객체 (실패 시 현재 시간 반환)
    """
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
        months = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        }
        match = re.match(r'([A-Za-z]+)\s+(\d+),\s+(\d+)\s+(\d+):(\d+)', date_str)
        if match:
            month_str, day, year, hour, minute = match.groups()
            month = months.get(month_str[:3], 1)
            return datetime(int(year), month, int(day), int(hour), int(minute))
    except:
        pass
        
    return datetime.now()

def calculate_top_damages(combat_json: dict):
    """
    전투 섹션 데이터를 분석하여 가장 많은 대미지를 입힌 항목 TOP 3 추출
    :param combat_json: 전투 섹션 딕셔너리
    :return: 대미지 순위 리스트 (이름만 포함)
    """
    if not combat_json: return []
    
    top_damages = []
    
    for key, val in combat_json.items():
        # 대미지 항목 여부 확인
        is_damage_key = key.endswith(" 대미지") or key.lower().endswith(" damage")
        if not is_damage_key and key != "전자 손상" and key != "Electrons Damage":
            continue

        # 이름 정규화 및 제외 목록 확인
        clean_name = re.sub(r'( 대미지| Damage| damage)$', '', key, flags=re.IGNORECASE)
        if clean_name in EXCLUDE_TOP_DAMAGE:
            continue
        
        raw_val = parse_number(str(val))
        top_damages.append({"name": clean_name, "raw": raw_val})
    
    # 대미지량 기준 내림차순 정렬 후 상위 3개 반환
    top_damages.sort(key=lambda x: x['raw'], reverse=True)
    return [item['name'] for item in top_damages[:3]]

def parse_battle_report(text: str) -> dict:
    """
    전체 리포트 텍스트를 파싱하여 메인(Main) 및 상세(Detail) 데이터 딕셔너리로 반환
    :param text: 사용자가 입력한 전체 리포트 텍스트
    :return: {'main': {...}, 'detail': {...}} 구조의 딕셔너리
    """
    clean_text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = clean_text.split('\n')
    
    sections = {'report': {}, 'combat': {}, 'utility': {}, 'enemy': {}, 'bot': {}}
    current_section = 'report'

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 섹션 헤더 변경 감지
        if line in SECTION_MAP:
            current_section = SECTION_MAP[line]
            continue
            
        key, val = None, None
        
        # Key-Value 파싱 로직
        if '\t' in line:
            parts = line.split('\t')
            key, val = parts[0].strip(), parts[-1].strip()
        else:
            if current_section == 'report':
                for map_key, std_key in KEY_MAP.items():
                    if std_key in ['battle_date', 'game_time', 'real_time', 'coins_per_hour']:
                        if line.startswith(map_key):
                            key = map_key
                            val = line.replace(map_key, "", 1).strip()
                            break
            if not key:
                parts = line.rsplit(' ', 1)
                if len(parts) == 2: key, val = parts[0].strip(), parts[1].strip()
        
        if key and val:
            sections[current_section][key] = val
            if key in KEY_MAP:
                std_key = KEY_MAP[key]
                sections[current_section][f"_std_{std_key}"] = val

    repo, comb, enemy, bot = sections['report'], sections['combat'], sections['enemy'], sections['bot']
    
    def get_std(section_dict, std_key, default='0'):
        return section_dict.get(f"_std_{std_key}", default)

    battle_date = parse_date(get_std(repo, 'battle_date', ''))

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

