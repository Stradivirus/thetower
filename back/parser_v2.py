"""
파일명: thetower/back/parser_v2.py
용도: data2 포맷 전투 리포트 텍스트 파싱 엔진
기능: V2 섹션 구조 파싱, BattleMainV2 / BattleDetailV2 데이터 생성
"""
from mappings import (
    V2_LINE_THRESHOLD,
    SECTION_MAP_V2,
    DAMAGE_JSON_SECTIONS,
    STATS_JSON_SECTIONS,
    EXCLUDE_TOP_DAMAGE,
)
from parser import parse_number, parse_date


def is_v2(text: str) -> bool:
    """
    줄 수를 기준으로 V2 포맷 여부 판별
    V2_LINE_THRESHOLD(100줄) 초과 시 V2로 판단
    """
    lines = [l for l in text.strip().split('\n') if l.strip()]
    return len(lines) > V2_LINE_THRESHOLD


def _get_val_insensitive(section_dict: dict, *keys: str, default: str = '0') -> str:
    """
    딕셔너리에서 여러 키 후보를 대소문자 구분 없이 검색하여 반환
    """
    if not section_dict:
        return default
        
    # 1. 원본 키들로 먼저 확인
    for key in keys:
        if key in section_dict:
            return section_dict[key]
            
    # 2. 소문자로 변환하여 대소문자 무관 검색
    lowered_dict = {k.lower(): v for k, v in section_dict.items()}
    for key in keys:
        if key.lower() in lowered_dict:
            return lowered_dict[key.lower()]
            
    return default


def parse_battle_report_v2(text: str) -> dict:
    """
    V2 포맷 리포트 텍스트를 파싱하여 반환
    """
    clean_text = text.replace('\r\n', '\n').replace('\r', '\n')
    lines = clean_text.split('\n')

    # 섹션별 raw 데이터 수집
    sections = {
        'report': {},
        'records': {},
        'damage': {},
        'damage_taken': {},
        'bonus_hp': {},
        'hp_regen': {},
        'damage_block': {},
        'utility': {},
        'stats': {},
        'enemy_hits': {},
        'kill_effects': {},
        'enemy': {},
        'coin': {},
        'cash': {},
        'currency': {},
        'kill_source': {},
    }

    current_section = 'report'

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # V2 섹션 헤더 감지
        if line in SECTION_MAP_V2:
            current_section = SECTION_MAP_V2[line]
            continue

        # Key-Value 파싱 (탭 구분자 우선)
        key, val = None, None
        if '\t' in line:
            parts = line.split('\t')
            key = parts[0].strip()
            val = parts[-1].strip()
        else:
            parts = line.rsplit(' ', 1)
            if len(parts) == 2:
                key, val = parts[0].strip(), parts[1].strip()

        if key and val is not None:
            sections[current_section][key] = val

    # ── BattleMain 데이터 구성 ──
    repo = sections['report']
    cur = sections['currency']
    kle = sections['kill_effects']

    battle_date = parse_date(_get_val_insensitive(repo, '전투 날짜', 'Battle Date', default=''))

    main_data = {
        'battle_date': battle_date,
        'tier': _get_val_insensitive(repo, '티어', 'Tier', default='T1'),
        'wave': int(_get_val_insensitive(repo, '웨이브', 'Wave', default='0').replace(',', '')),
        'game_time': _get_val_insensitive(repo, '게임 시간', 'Game Time', default=''),
        'real_time': _get_val_insensitive(repo, '실시간', 'Real Time', default=''),
        'coin_earned': parse_number(_get_val_insensitive(repo, '코인 획득', 'Coins Earned', 'Coins earned')),
        'coins_per_hour': parse_number(_get_val_insensitive(repo, '시간당 코인', 'Coins Per Hour', 'Coins per hour')),
        'cells_earned': parse_number(_get_val_insensitive(cur, '획득한 셀', 'Cells Earned', default=_get_val_insensitive(repo, '획득한 셀', 'Cells Earned'))),
        'reroll_shards_earned': parse_number(_get_val_insensitive(cur, '다시 뽑기 파편 획득함', 'Reroll Shards Earned', default=_get_val_insensitive(repo, '다시 뽑기 파편 획득함', 'Reroll Shards Earned'))),
        'killer': _get_val_insensitive(repo, '처치자', 'Killed By', default=''),

        # V2는 대미지 섹션이 분리됨
        'damage_dealt': _get_val_insensitive(sections['damage'], '입힌 대미지', 'Damage Dealt', 'Damage dealt'),
        'damage_taken': _get_val_insensitive(sections['damage_taken'], '타워', 'Tower', default='0'),

        # V2 적 합계
        'total_enemies': parse_number(_get_val_insensitive(sections['enemy'], '적 합계', 'Total Enemies', default='0')),

        # V2 효과 활성 상태에서 처치
        'death_wave_kills': parse_number(_get_val_insensitive(kle, '죽음의 파동', 'Death Wave', default='0')),
        'spotlight_kills': parse_number(_get_val_insensitive(kle, '스포트라이트', 'Spotlight', default='0')),
        'golden_bot_kills': parse_number(_get_val_insensitive(kle, '황금 봇', 'Golden Bot', default='0')),

        # top_damages: V2 대미지 섹션 기준으로 계산
        'top_damages': _calculate_top_damages_v2(sections['damage']),
    }

    # ── BattleMainV2 데이터 구성 ──
    rec = sections['records']

    main_v2_data = {
        'battle_date': battle_date,
        'cells_per_hour': parse_number(_get_val_insensitive(repo, '시간당 셀', 'Cells Per Hour', 'Cells per hour')),
        'best_coins_per_minute': parse_number(_get_val_insensitive(rec, '분당 최고 코인 수', 'Best Coins Per Minute', 'Highest Coins / Minute')),
        'max_wave_skip': parse_number(_get_val_insensitive(rec, '최대 웨이브 건너뛰기', 'Max Wave Skip', 'Largest Wave Skip')),
        'best_skip_coins': parse_number(_get_val_insensitive(rec, '웨이브 스킵에서 얻은 대부분의 코인', 'Most Coins From Wave Skip')),
        'best_skip_cells': parse_number(_get_val_insensitive(rec, '웨이브 스킵에서 나온 대부분의 세포', 'Most Cells From Wave Skip')),
        'max_smart_missile_stack': parse_number(_get_val_insensitive(rec, '최대 스마트 미사일 중첩', 'Max Smart Missile Stack', 'Largest Smart Missile Stack')),
        'max_golden_combo': parse_number(_get_val_insensitive(rec, '최대 골든 콤보', 'Max Golden Combo', 'Largest Golden Combo')),
        'best_golden_combo_coins': parse_number(_get_val_insensitive(rec, '골든 콤보에서 얻는 대부분의 코인', 'Most Coins From Golden Combo')),
        'max_inner_mine_charge': parse_number(_get_val_insensitive(rec, '최대 내부 지뢰 충전', 'Max Inner Mine Charge', 'Largest Inner Landmine Charge')),
    }

    # ── BattleDetailV2 데이터 구성 ──
    # damage_json: 대미지 관련 섹션 통합
    damage_json = {}
    for sec_key in DAMAGE_JSON_SECTIONS:
        if sections[sec_key]:
            damage_json[sec_key] = sections[sec_key]

    # stats_json: 수치 관련 섹션 통합
    stats_json = {}
    for sec_key in STATS_JSON_SECTIONS:
        if sections[sec_key]:
            stats_json[sec_key] = sections[sec_key]

    detail_v2_data = {
        'battle_date': battle_date,
        'damage_json': damage_json,
        'utility_json': sections['utility'],
        'stats_json': stats_json,
        'enemy_json': sections['enemy'],
        'coin_json': sections['coin'],      # cash 섹션은 저장 안 함
        'currency_json': sections['currency'],
        'kill_source_json': sections['kill_source'],
    }

    return {
        'main': main_data,
        'main_v2': main_v2_data,
        'detail_v2': detail_v2_data,
    }


def _calculate_top_damages_v2(damage_section: dict) -> list:
    """
    V2 대미지 섹션에서 top_damages 계산
    오브, 블랙홀, 가시 등 제외 키워드를 필터링하고 상위 3개 추출
    """
    candidates = []
    for key, val in damage_section.items():
        # mappings.py의 공통 제외 목록에 포함되어 있는지 확인 (대소문자 무시 부분 일치 포함)
        is_excluded = any(ex.lower() in key.lower() for ex in EXCLUDE_TOP_DAMAGE)
        if is_excluded:
            continue

        raw_val = parse_number(str(val))
        if raw_val > 0:
            candidates.append({'name': key, 'raw': raw_val})

    # 대미지량 기준 내림차순 정렬 후 상위 3개 반환
    candidates.sort(key=lambda x: x['raw'], reverse=True)
    return [item['name'] for item in candidates[:3]]