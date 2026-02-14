# back/mappings.py

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
    # English
    "Damage dealt", "Damage Taken", "Damage Taken Wall", "Recovery Packages", 
    "Lifesteal", "Death Defy", "Orb", "Black Hole"
]