import re
from datetime import datetime

def parse_number(value_str: str):
    """
    '5.42B', '1.2T', '500' 등을 실제 숫자(int)로 변환
    (딕셔너리 매핑 방식 적용)
    """
    if not value_str:
        return 0
    
    # 공백, $, x 등 불필요한 문자 제거
    clean_str = value_str.strip().replace('$', '').replace('X', '').replace('x', '')
    
    # 단위 매핑 (대소문자 구분 - 게임 특화 단위)
    multipliers = {
        'S': 10**24, 's': 10**21, 'Q': 10**18, 'q': 10**15,
        'T': 10**12, 't': 10**12, 'B': 10**9, 'b': 10**9, 
        'M': 10**6, 'm': 10**6, 'K': 10**3, 'k': 10**3
    }

    multiplier = 1
    
    # 딕셔너리를 순회하며 접미사 체크
    for suffix, mult in multipliers.items():
        if clean_str.endswith(suffix):
            multiplier = mult
            clean_str = clean_str[:-len(suffix)] # 접미사 제거
            break

    try:
        # 쉼표 제거 후 변환
        return int(float(clean_str.replace(',', '')) * multiplier)
    except ValueError:
        return 0

def parse_battle_report(text: str) -> dict:
    # 1. 텍스트 전처리
    clean_text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = clean_text.split('\n')
    
    # 2. 데이터를 담을 임시 저장소
    sections = {
        'report': {},   # 전투 보고
        'combat': {},   # 전투
        'utility': {},  # 유틸리티
        'enemy': {},    # 적 파괴
        'bot': {},      # 봇 + 가디언
    }
    
    current_section = 'report' 
    
    section_map = {
        '전투 보고': 'report',
        '전투': 'combat',
        '유틸리티': 'utility',
        '적 파괴': 'enemy',
        '봇': 'bot',
        '가디언': 'bot'
    }

    print("--- [Section Parser] 시작 ---")

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 1) 섹션 헤더 확인
        if line in section_map:
            current_section = section_map[line]
            continue
            
        # 2) 데이터 파싱 (Key-Value 분리)
        key = None
        val = None
        
        if '\t' in line:
            parts = line.split('\t')
            key = parts[0].strip()
            val = parts[-1].strip()
        else:
            # 예외 처리: 공백이 포함된 키값들
            if current_section == 'report':
                for special_key in ["전투 날짜", "게임 시간", "실시간", "시간당 코인"]:
                    if line.startswith(special_key):
                        key = special_key
                        val = line.replace(special_key, "", 1).strip()
                        break
            
            # 위 예외에 안 걸리면 일반 처리
            if not key:
                parts = line.rsplit(' ', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
        
        if key and val:
            sections[current_section][key] = val

    # 3. 최종 데이터 조립
    repo = sections['report']
    comb = sections['combat']
    
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
    }
    
    detail_data = {
        'combat_json': sections['combat'],
        'utility_json': sections['utility'],
        'enemy_json': sections['enemy'],
        'bot_json': sections['bot'],
    }

    return {'main': main_data, 'detail': detail_data}