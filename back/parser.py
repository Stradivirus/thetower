import re
from datetime import datetime

def parse_number(value_str: str):
    """
    '5.42B', '1.2T', '500' 등을 실제 숫자(int)로 변환
    """
    if not value_str:
        return 0
    
    # 공백 제거, 대문자, $와 x 제거
    value_str = value_str.strip().upper().replace('$', '').replace('X', '')
    
    multiplier = 1
    
    if value_str.endswith('K'):
        multiplier = 1_000
        value_str = value_str[:-1]
    elif value_str.endswith('M'):
        multiplier = 1_000_000
        value_str = value_str[:-1]
    elif value_str.endswith('B'):
        multiplier = 1_000_000_000
        value_str = value_str[:-1]
    elif value_str.endswith('T'):
        multiplier = 1_000_000_000_000
        value_str = value_str[:-1]
    elif value_str.endswith('Q'): 
        multiplier = 1_000_000_000_000_000
        value_str = value_str[:-1]
    # 소문자 q, s 등 게임 특유 단위 처리 (필요시 추가)
    elif value_str.endswith('S'): # septillion 등 게임 후반 단위 고려
        multiplier = 1_000_000_000_000_000_000_000
        value_str = value_str[:-1]

    try:
        return int(float(value_str.replace(',', '')) * multiplier)
    except ValueError:
        return 0

def parse_battle_report(text: str) -> dict:
    # 1. 텍스트 전처리
    clean_text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = clean_text.split('\n')
    
    # 2. 데이터를 담을 임시 저장소 (섹션별)
    sections = {
        'report': {},   # 전투 보고 (메인)
        'combat': {},   # 전투
        'utility': {},  # 유틸리티
        'enemy': {},    # 적 파괴
        'bot': {},      # 봇 + 가디언 (합쳐서 저장)
    }
    
    # 현재 어떤 섹션을 읽고 있는지 추적 (기본값: report)
    current_section = 'report' 
    
    # 섹션 헤더 매핑 (한글 제목 -> 저장소 키)
    section_map = {
        '전투 보고': 'report',
        '전투': 'combat',
        '유틸리티': 'utility',
        '적 파괴': 'enemy',
        '봇': 'bot',
        '가디언': 'bot' # 가디언도 bot 섹션에 합침 (DB 구조상)
    }

    print("--- [Section Parser] 시작 ---")

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # 1) 섹션 헤더인지 확인 (정확히 일치하는 경우)
        if line in section_map:
            current_section = section_map[line]
            print(f"👉 섹션 변경: [{line}] -> {current_section}")
            continue
            
        # 2) 데이터 파싱 (Key-Value 분리)
        key = None
        val = None
        
        if '\t' in line:
            parts = line.split('\t')
            key = parts[0].strip()
            val = parts[-1].strip()
        else:
            # 예외 처리: 날짜/시간 등 공백이 포함된 값
            if current_section == 'report' and line.startswith("전투 날짜"):
                key = "전투 날짜"
                val = line.replace("전투 날짜", "", 1).strip()
            elif current_section == 'report' and ("게임 시간" in line or "실시간" in line):
                 if line.startswith("게임 시간"):
                    key = "게임 시간"
                    val = line.replace("게임 시간", "", 1).strip()
                 elif line.startswith("실시간"):
                    key = "실시간"
                    val = line.replace("실시간", "", 1).strip()
            else:
                # 일반적인 경우: 뒤에서 첫 공백 기준 분리
                parts = line.rsplit(' ', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
        
        # 3) 현재 섹션 저장소에 데이터 넣기
        if key and val:
            sections[current_section][key] = val

    # 3. 최종 데이터 조립 (DB 스키마에 맞게 매핑)
    
    # [Main Data] - '전투 보고' 섹션 + 일부 '전투' 섹션 데이터
    repo = sections['report']
    comb = sections['combat']
    
    # 날짜 파싱
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
        'cells_earned': parse_number(repo.get('획득한 셀', '0')),
        'reroll_shards_earned': parse_number(repo.get('다시 뽑기 파편 획득함', '0')),
        
        'killer': repo.get('처치자', ''),
        'damage_dealt': comb.get('입힌 대미지', '0'), # 전투 섹션에서 가져옴
        'damage_taken': comb.get('받은 대미지', '0'), # 전투 섹션에서 가져옴
    }

    # [Detail Data] - 각 섹션 딕셔너리를 그대로 JSON으로 활용
    # (필요 없는 메인 데이터 중복 제거는 선택사항)
    
    detail_data = {
        'combat_json': sections['combat'],
        'utility_json': sections['utility'],
        'enemy_json': sections['enemy'],
        'bot_json': sections['bot'],
    }

    return {'main': main_data, 'detail': detail_data}