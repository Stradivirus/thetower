"""
파일명: thetower/back/parser_v2.py
용도: data2 포맷 전투 리포트 텍스트 파싱 엔진
기능: V2 섹션 구조 파싱, BattleMainV2 / BattleDetailV2 데이터 생성
"""
from mappings import (
    KEY_MAP,
    SECTION_MAP,
    V2_LINE_THRESHOLD,
    SECTION_MAP_V2,
    KEY_MAP_V2_REPORT,
    KEY_MAP_V2_RECORDS,
    DAMAGE_JSON_SECTIONS,
    STATS_JSON_SECTIONS,
)
from parser import parse_number, parse_date


def is_v2(text: str) -> bool:
    """
    줄 수를 기준으로 V2 포맷 여부 판별
    V2_LINE_THRESHOLD(100줄) 초과 시 V2로 판단
    """
    lines = [l for l in text.strip().split('\n') if l.strip()]
    return len(lines) > V2_LINE_THRESHOLD


def parse_battle_report_v2(text: str) -> dict:
    """
    V2 포맷 리포트 텍스트를 파싱하여 반환
    반환 구조:
    {
        'main': {...},          # 기존 BattleMain 컬럼 데이터 (parser.py와 동일 구조)
        'main_v2': {...},       # BattleMainV2 컬럼 데이터
        'detail_v2': {...}      # BattleDetailV2 JSON 섹션 데이터
    }
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

    # ── BattleMain 데이터 구성 (기존 parser.py와 동일한 키 구조) ──
    repo = sections['report']

    def get_repo(raw_key, default='0'):
        return repo.get(raw_key, default)

    battle_date = parse_date(get_repo('전투 날짜', get_repo('Battle Date', '')))

    main_data = {
        'battle_date': battle_date,
        'tier': get_repo('티어', get_repo('Tier', 'T1')),
        'wave': int(get_repo('웨이브', get_repo('Wave', '0')).replace(',', '')),
        'game_time': get_repo('게임 시간', get_repo('Game Time', '')),
        'real_time': get_repo('실시간', get_repo('Real Time', '')),
        'coin_earned': parse_number(get_repo('코인 획득', get_repo('Coins earned', '0'))),
        'coins_per_hour': parse_number(get_repo('시간당 코인', get_repo('Coins per hour', '0'))),
        'cells_earned': parse_number(
            sections['currency'].get('획득한 셀',
            sections['currency'].get('Cells Earned',
            get_repo('획득한 셀', '0')))
        ),
        'reroll_shards_earned': parse_number(
            sections['currency'].get('다시 뽑기 파편 획득함',
            sections['currency'].get('Reroll Shards Earned',
            get_repo('다시 뽑기 파편 획득함', '0')))
        ),
        'killer': get_repo('처치자', get_repo('Killed By', '')),

        # V2는 대미지 섹션이 분리됨
        'damage_dealt': sections['damage'].get('입힌 대미지', sections['damage'].get('Damage dealt', '0')),
        'damage_taken': sections['damage_taken'].get('타워', '0'),

        # V2 적 합계
        'total_enemies': parse_number(sections['enemy'].get('적 합계', sections['enemy'].get('Total Enemies', '0'))),

        # V2에서는 효과 활성 상태에서 처치 섹션으로 이동
        'death_wave_kills': parse_number(sections['kill_effects'].get('죽음의 파동', sections['kill_effects'].get('Death Wave', '0'))),
        'spotlight_kills': parse_number(sections['kill_effects'].get('스포트라이트', sections['kill_effects'].get('Spotlight', '0'))),
        'golden_bot_kills': parse_number(sections['kill_effects'].get('황금 봇', sections['kill_effects'].get('Golden Bot', '0'))),

        # top_damages: V2 대미지 섹션 기준으로 계산
        'top_damages': _calculate_top_damages_v2(sections['damage']),
    }

    # ── BattleMainV2 데이터 구성 ──
    rec = sections['records']

    def get_rec(raw_key, en_key='', default='0'):
        return rec.get(raw_key, rec.get(en_key, default))

    main_v2_data = {
        'battle_date': battle_date,
        'cells_per_hour': parse_number(get_repo('시간당 셀', get_repo('Cells per hour', '0'))),
        'best_coins_per_minute': parse_number(get_rec('분당 최고 코인 수', 'Best Coins Per Minute')),
        'max_wave_skip': parse_number(get_rec('최대 웨이브 건너뛰기', 'Max Wave Skip')),
        'best_skip_coins': parse_number(get_rec('웨이브 스킵에서 얻은 대부분의 코인', 'Most Coins From Wave Skip')),
        'best_skip_cells': parse_number(get_rec('웨이브 스킵에서 나온 대부분의 세포', 'Most Cells From Wave Skip')),
        'max_smart_missile_stack': parse_number(get_rec('최대 스마트 미사일 중첩', 'Max Smart Missile Stack')),
        'max_golden_combo': parse_number(get_rec('최대 골든 콤보', 'Max Golden Combo')),
        'best_golden_combo_coins': parse_number(get_rec('골든 콤보에서 얻는 대부분의 코인', 'Most Coins From Golden Combo')),
        'max_inner_mine_charge': parse_number(get_rec('최대 내부 지뢰 충전', 'Max Inner Mine Charge')),
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
    V2는 '투사체 대미지' 형태가 아닌 '투사체' 형태로 키가 존재함
    '입힌 대미지'와 숫자가 아닌 항목은 제외
    """
    EXCLUDE_KEYS = {'입힌 대미지', 'Damage dealt'}

    candidates = []
    for key, val in damage_section.items():
        if key in EXCLUDE_KEYS:
            continue
        raw_val = parse_number(str(val))
        if raw_val > 0:
            candidates.append({'name': key, 'raw': raw_val})

    candidates.sort(key=lambda x: x['raw'], reverse=True)
    return [item['name'] for item in candidates[:3]]