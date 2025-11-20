from pydantic import BaseModel
from datetime import datetime

class BattleReportBase(BaseModel):
    battle_date: datetime
    game_time: str
    real_time: str
    tier: str
    wave: str
    killer: str
    coin_earned: str
    coin_per_hour: str
    cash_earned: str
    profit_earned: str
    gem_block_tap: str
    cells_earned: str
    reroll_shards_earned: str

class BattleReportCreate(BattleReportBase):
    pass

class BattleReportResponse(BattleReportBase):
    created_at: datetime
    
    class Config:
        from_attributes = True

class CombatStatsBase(BaseModel):
    battle_date: datetime
    damage_dealt: str
    damage_taken: str
    barrier_damage_taken: str
    berserker_damage_taken: str
    berserker_damage_multiplier: str
    death_resistance: str
    lifesteal: str
    projectile_damage: str
    projectile_count: str
    thorn_damage: str
    orb_damage: str
    orb_hits: str
    mine_damage: str
    mines_created: str
    armor_shred_damage: str
    death_ray_damage: str
    smart_missile_damage: str
    inner_mine_damage: str
    chain_lightning_damage: str
    death_wave_damage: str
    death_wave_tagged: str
    swamp_damage: str
    black_hole_damage: str

class CombatStatsResponse(CombatStatsBase):
    class Config:
        from_attributes = True

class UtilityStatsBase(BaseModel):
    battle_date: datetime
    waves_skipped: str
    recovery_packages: str
    free_attack_upgrades: str
    free_defense_upgrades: str
    free_utility_upgrades: str
    death_wave_health: str
    death_wave_coins: str
    golden_tower_cash: str
    golden_tower_coins: str
    black_hole_coins: str
    spotlight_coins: str
    orb_coins: str
    coin_upgrade_coins: str
    coin_bonus_coins: str

class UtilityStatsResponse(UtilityStatsBase):
    class Config:
        from_attributes = True

class EnemyStatsBase(BaseModel):
    battle_date: datetime
    total_enemies: str
    basic: str
    swift: str
    tanking: str
    ranged: str
    boss: str
    guardian: str
    total_elite: str
    vampire: str
    beam: str
    scatter: str
    saboteur: str
    commander: str
    discount: str
    destroyed_by_orb: str
    destroyed_by_thorn: str
    destroyed_by_death_ray: str
    destroyed_by_mine: str
    destroyed_in_spotlight: str

class EnemyStatsResponse(EnemyStatsBase):
    class Config:
        from_attributes = True

class BotGuardianStatsBase(BaseModel):
    battle_date: datetime
    flame_bot_damage: str
    thunder_bot_stuns: str
    golden_bot_coins: str
    destroyed_by_golden_bot: str
    guardian_damage: str
    guardian_summoned_enemies: str
    guardian_stolen_coins: str
    guardian_returned_coins: str
    gems: str
    medals: str
    reroll_shards: str
    cannon_shards: str
    armor_shards: str
    generator_shards: str
    core_shards: str
    common_modules: str
    rare_modules: str

class BotGuardianStatsResponse(BotGuardianStatsBase):
    class Config:
        from_attributes = True

class FullReportResponse(BaseModel):
    battle_report: BattleReportResponse
    combat_stats: CombatStatsResponse
    utility_stats: UtilityStatsResponse
    enemy_stats: EnemyStatsResponse
    bot_guardian_stats: BotGuardianStatsResponse