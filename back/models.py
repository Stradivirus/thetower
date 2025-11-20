from sqlalchemy import Column, String, Integer, DateTime
from database import Base
from datetime import datetime

class BattleReport(Base):
    __tablename__ = "battle_reports"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    game_time = Column(String)
    real_time = Column(String)
    tier = Column(String)
    wave = Column(String)
    killer = Column(String)
    coin_earned = Column(String)
    coin_per_hour = Column(String)
    cash_earned = Column(String)
    profit_earned = Column(String)
    gem_block_tap = Column(String)
    cells_earned = Column(String)
    reroll_shards_earned = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class CombatStats(Base):
    __tablename__ = "combat_stats"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    damage_dealt = Column(String)
    damage_taken = Column(String)
    barrier_damage_taken = Column(String)
    berserker_damage_taken = Column(String)
    berserker_damage_multiplier = Column(String)
    death_resistance = Column(String)
    lifesteal = Column(String)
    projectile_damage = Column(String)
    projectile_count = Column(String)
    thorn_damage = Column(String)
    orb_damage = Column(String)
    orb_hits = Column(String)
    mine_damage = Column(String)
    mines_created = Column(String)
    armor_shred_damage = Column(String)
    death_ray_damage = Column(String)
    smart_missile_damage = Column(String)
    inner_mine_damage = Column(String)
    chain_lightning_damage = Column(String)
    death_wave_damage = Column(String)
    death_wave_tagged = Column(String)
    swamp_damage = Column(String)
    black_hole_damage = Column(String)

class UtilityStats(Base):
    __tablename__ = "utility_stats"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    waves_skipped = Column(String)
    recovery_packages = Column(String)
    free_attack_upgrades = Column(String)
    free_defense_upgrades = Column(String)
    free_utility_upgrades = Column(String)
    death_wave_health = Column(String)
    death_wave_coins = Column(String)
    golden_tower_cash = Column(String)
    golden_tower_coins = Column(String)
    black_hole_coins = Column(String)
    spotlight_coins = Column(String)
    orb_coins = Column(String)
    coin_upgrade_coins = Column(String)
    coin_bonus_coins = Column(String)

class EnemyStats(Base):
    __tablename__ = "enemy_stats"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    total_enemies = Column(String)
    basic = Column(String)
    swift = Column(String)
    tanking = Column(String)
    ranged = Column(String)
    boss = Column(String)
    guardian = Column(String)
    total_elite = Column(String)
    vampire = Column(String)
    beam = Column(String)
    scatter = Column(String)
    saboteur = Column(String)
    commander = Column(String)
    discount = Column(String)
    destroyed_by_orb = Column(String)
    destroyed_by_thorn = Column(String)
    destroyed_by_death_ray = Column(String)
    destroyed_by_mine = Column(String)
    destroyed_in_spotlight = Column(String)

class BotGuardianStats(Base):
    __tablename__ = "bot_guardian_stats"
    
    battle_date = Column(DateTime, primary_key=True, index=True)
    flame_bot_damage = Column(String)
    thunder_bot_stuns = Column(String)
    golden_bot_coins = Column(String)
    destroyed_by_golden_bot = Column(String)
    guardian_damage = Column(String)
    guardian_summoned_enemies = Column(String)
    guardian_stolen_coins = Column(String)
    guardian_returned_coins = Column(String)
    gems = Column(String)
    medals = Column(String)
    reroll_shards = Column(String)
    cannon_shards = Column(String)
    armor_shards = Column(String)
    generator_shards = Column(String)
    core_shards = Column(String)
    common_modules = Column(String)
    rare_modules = Column(String)