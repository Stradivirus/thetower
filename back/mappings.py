"""
파일명: thetower/back/mappings.py
용도: 게임 데이터 파싱을 위한 다국어(한글/영어) 키워드 매핑 테이블
기능: 섹션 헤더 통합, 데이터 키-DB 컬럼 매핑, 제외 키워드 정의
"""

# 1. 섹션(Header) 매핑
SECTION_MAP = {
    # English
    'Battle Report': 'report',
    'Combat': 'combat',
    'Utility': 'utility',
    'Enemies Destroyed': 'enemy',
    'Bots': 'bot',
    'Guardian': 'bot', # 가디언도 봇 섹션 데이터로 취급
    
    # Korean
    '전투 보고': 'report',
    '전투': 'combat',
    '유틸리티': 'utility',
    '적 파괴': 'enemy',
    '봇': 'bot',
    '가디언': 'bot'
}

# 2. 데이터 키(Key) 매핑 -> DB 컬럼명으로 통일
KEY_MAP = {
    # [Report Section]
    # Date/Time
    'Battle Date': 'battle_date',
    '전투 날짜': 'battle_date',
    'Game Time': 'game_time',
    '게임 시간': 'game_time',
    'Real Time': 'real_time',
    '실시간': 'real_time',
    
    # Stats
    'Tier': 'tier',
    '티어': 'tier',
    'Wave': 'wave',
    '웨이브': 'wave',
    'Coins earned': 'coin_earned',
    '코인 획득': 'coin_earned',
    'Coins per hour': 'coins_per_hour',
    '시간당 코인': 'coins_per_hour',
    'Cells Earned': 'cells_earned',
    '획득한 셀': 'cells_earned',
    'Reroll Shards Earned': 'reroll_shards_earned',
    '다시 뽑기 파편 획득함': 'reroll_shards_earned',
    'Killed By': 'killer',
    '처치자': 'killer',

    # [Combat Section]
    'Damage dealt': 'damage_dealt',
    '입힌 대미지': 'damage_dealt',
    'Damage Taken': 'damage_taken',
    '받은 대미지': 'damage_taken',
    
    # [Enemy/Kill Counts]
    # 특정 소스 킬수 매핑 (death_wave, spotlight, golden_bot)
    'Tagged by Deathwave': 'death_wave_kills',
    '데스웨이브에 의해 표시됨': 'death_wave_kills',
    'Destroyed in Spotlight': 'spotlight_kills',
    '스포트라이트로 파괴함': 'spotlight_kills',
    'Destroyed in Golden Bot': 'golden_bot_kills',
    '황금 봇에서 파괴됨': 'golden_bot_kills',
    
    # Total
    'Total Enemies': 'total_enemies',
    '적 합계': 'total_enemies',
}

# 3. Top Damage 계산 시 제외할 키워드 (한글/영어 통합)
EXCLUDE_TOP_DAMAGE = [
    # Korean
    "입힌", "받은", "장벽이 받은", "회복 패키지", "생명력 흡수", "죽음 저항", "오브", "블랙홀",
    "가시", "타워", "죽음의 광선",
    # English
    "Damage dealt", "Damage Taken", "Damage Taken Wall", "Recovery Packages", 
    "Lifesteal", "Death Defy", "Orb", "Black Hole", "Thorns", "Tower", "Death Ray"
]

"""
기존 mappings.py 하단에 추가할 V2 매핑
기존 SECTION_MAP, KEY_MAP, EXCLUDE_TOP_DAMAGE는 그대로 유지
"""

# V2 버전 감지 기준 줄 수 (data2는 100줄 이상)
V2_LINE_THRESHOLD = 100

# V2 섹션 헤더 매핑
SECTION_MAP_V2 = {
    # 전투 보고는 기존과 동일하게 처리
    '전투 보고': 'report',
    'Battle Report': 'report',

    # V2 신규 섹션
    '기록': 'records',
    'Records': 'records',

    '대미지': 'damage',
    'Damage': 'damage',

    '받은 대미지': 'damage_taken',
    'Damage Taken': 'damage_taken',

    '보너스 체력 획득': 'bonus_hp',
    'Bonus Health Gained': 'bonus_hp',

    '체력 재생됨': 'hp_regen',
    'Health Regenerated': 'hp_regen',

    '대미지 차단': 'damage_block',
    'Damage Blocked': 'damage_block',

    '유틸리티': 'utility',
    'Utility': 'utility',

    '수치': 'stats',
    'Stats': 'stats',

    '적 타격 수': 'enemy_hits',
    'Enemy Hits': 'enemy_hits',

    '효과 활성 상태에서 처치': 'kill_effects',
    'Kills While Effect Active': 'kill_effects',

    '적 합계': 'enemy',
    'Enemies Destroyed': 'enemy',

    '코인': 'coin',
    'Coins': 'coin',

    '캐시': 'cash',      # 파싱은 하되 저장 안 함
    'Cash': 'cash',

    '화폐': 'currency',
    'Currency': 'currency',

    '다음으로 파괴한 적:': 'kill_source',
    'Killed By:': 'kill_source',
}

# V2 report 섹션 Key 매핑 -> DB 컬럼명
KEY_MAP_V2_REPORT = {
    # 기존과 동일 (parser에서 기존 KEY_MAP과 함께 사용)
    '시간당 셀': 'cells_per_hour',
    'Cells per hour': 'cells_per_hour',
}

# V2 기록 섹션 Key 매핑 -> DB 컬럼명
KEY_MAP_V2_RECORDS = {
    '분당 최고 코인 수': 'best_coins_per_minute',
    'Best Coins Per Minute': 'best_coins_per_minute',

    '최대 웨이브 건너뛰기': 'max_wave_skip',
    'Max Wave Skip': 'max_wave_skip',

    '웨이브 스킵에서 얻은 대부분의 코인': 'best_skip_coins',
    'Most Coins From Wave Skip': 'best_skip_coins',

    '웨이브 스킵에서 나온 대부분의 세포': 'best_skip_cells',
    'Most Cells From Wave Skip': 'best_skip_cells',

    '최대 스마트 미사일 중첩': 'max_smart_missile_stack',
    'Max Smart Missile Stack': 'max_smart_missile_stack',

    '최대 골든 콤보': 'max_golden_combo',
    'Max Golden Combo': 'max_golden_combo',

    '골든 콤보에서 얻는 대부분의 코인': 'best_golden_combo_coins',
    'Most Coins From Golden Combo': 'best_golden_combo_coins',

    '최대 내부 지뢰 충전': 'max_inner_mine_charge',
    'Max Inner Mine Charge': 'max_inner_mine_charge',
}

# damage_json에 묶일 섹션 목록
DAMAGE_JSON_SECTIONS = ['damage', 'damage_taken', 'bonus_hp', 'hp_regen', 'damage_block']

# stats_json에 묶일 섹션 목록
STATS_JSON_SECTIONS = ['stats', 'enemy_hits', 'kill_effects']