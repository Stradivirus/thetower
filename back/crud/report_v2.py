"""
파일명: thetower/back/crud/report_v2.py
용도: V2 포맷 전투 기록 저장 로직 (비동기 리팩토링)
기능: BattleMainV2, BattleDetailV2 생성/업데이트
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import BattleMainV2, BattleDetailV2

async def get_v2_report(db: AsyncSession, battle_date, user_id: int):
    """
    V2 전투 기록의 추가 데이터(BattleMainV2, BattleDetailV2)를 조회합니다.
    V1 기록이거나 V2 데이터가 없으면 None 을 반환합니다.
    """
    stmt_main = select(BattleMainV2).filter(
        BattleMainV2.battle_date == battle_date,
        BattleMainV2.owner_id == user_id
    )
    result_main = await db.execute(stmt_main)
    v2_main = result_main.scalars().first()

    stmt_detail = select(BattleDetailV2).filter(
        BattleDetailV2.battle_date == battle_date,
        BattleDetailV2.owner_id == user_id
    )
    result_detail = await db.execute(stmt_detail)
    v2_detail = result_detail.scalars().first()

    return v2_main, v2_detail

async def create_battle_record_v2(db: AsyncSession, parsed_data: dict, user_id: int):
    """
    V2 파싱 데이터를 BattleMainV2, BattleDetailV2에 저장
    - BattleMain은 기존 create_battle_record()에서 이미 저장된 상태
    - 이 함수는 V2 전용 추가 데이터만 저장
    """
    main_v2_data = parsed_data['main_v2']
    detail_v2_data = parsed_data['detail_v2']
    battle_date = main_v2_data['battle_date']

    try:
        # BattleMainV2 저장 (merge로 중복 처리)
        main_v2 = BattleMainV2(
            battle_date=battle_date,
            owner_id=user_id,
            cells_per_hour=main_v2_data.get('cells_per_hour'),
            max_wave_skip=main_v2_data.get('max_wave_skip'),
            best_skip_coins=main_v2_data.get('best_skip_coins'),
            best_skip_cells=main_v2_data.get('best_skip_cells'),
            max_smart_missile_stack=main_v2_data.get('max_smart_missile_stack'),
            max_golden_combo=main_v2_data.get('max_golden_combo'),
            best_golden_combo_coins=main_v2_data.get('best_golden_combo_coins'),
            max_inner_mine_charge=main_v2_data.get('max_inner_mine_charge'),
        )
        await db.merge(main_v2)

        # BattleDetailV2 저장 (있으면 업데이트, 없으면 생성)
        stmt_existing = select(BattleDetailV2).filter(
            BattleDetailV2.battle_date == battle_date,
            BattleDetailV2.owner_id == user_id
        )
        result_existing = await db.execute(stmt_existing)
        existing = result_existing.scalars().first()

        if existing:
            existing.damage_json = detail_v2_data.get('damage_json', {})
            existing.utility_json = detail_v2_data.get('utility_json', {})
            existing.stats_json = detail_v2_data.get('stats_json', {})
            existing.enemy_json = detail_v2_data.get('enemy_json', {})
            existing.coin_json = detail_v2_data.get('coin_json', {})
            existing.currency_json = detail_v2_data.get('currency_json', {})
            existing.kill_source_json = detail_v2_data.get('kill_source_json', {})
        else:
            detail_v2 = BattleDetailV2(
                battle_date=battle_date,
                owner_id=user_id,
                damage_json=detail_v2_data.get('damage_json', {}),
                utility_json=detail_v2_data.get('utility_json', {}),
                stats_json=detail_v2_data.get('stats_json', {}),
                enemy_json=detail_v2_data.get('enemy_json', {}),
                coin_json=detail_v2_data.get('coin_json', {}),
                currency_json=detail_v2_data.get('currency_json', {}),
                kill_source_json=detail_v2_data.get('kill_source_json', {}),
            )
            db.add(detail_v2)

        await db.commit()
        return main_v2

    except Exception as e:
        await db.rollback()
        print(f"❌ [V2 Save Error] 트랜잭션 롤백됨: {e}")
        return None