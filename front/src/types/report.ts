export interface BattleReport {
  battle_date: string;
  game_time: string;
  real_time: string;
  tier: string;
  wave: string;
  killer: string;
  coin_earned: string;
  coin_per_hour: string;
  cash_earned: string;
  profit_earned: string;
  gem_block_tap: string;
  cells_earned: string;
  reroll_shards_earned: string;
  created_at: string;
}

export interface CombatStats {
  battle_date: string;
  damage_dealt: string;
  damage_taken: string;
  barrier_damage_taken: string;
  berserker_damage_taken: string;
  berserker_damage_multiplier: string;
  death_resistance: string;
  lifesteal: string;
  projectile_damage: string;
  projectile_count: string;
  thorn_damage: string;
  orb_damage: string;
  orb_hits: string;
  mine_damage: string;
  mines_created: string;
  armor_shred_damage: string;
  death_ray_damage: string;
  smart_missile_damage: string;
  inner_mine_damage: string;
  chain_lightning_damage: string;
  death_wave_damage: string;
  death_wave_tagged: string;
  swamp_damage: string;
  black_hole_damage: string;
}

export interface UtilityStats {
  battle_date: string;
  waves_skipped: string;
  recovery_packages: string;
  free_attack_upgrades: string;
  free_defense_upgrades: string;
  free_utility_upgrades: string;
  death_wave_health: string;
  death_wave_coins: string;
  golden_tower_cash: string;
  golden_tower_coins: string;
  black_hole_coins: string;
  spotlight_coins: string;
  orb_coins: string;
  coin_upgrade_coins: string;
  coin_bonus_coins: string;
}

export interface EnemyStats {
  battle_date: string;
  total_enemies: string;
  basic: string;
  swift: string;
  tanking: string;
  ranged: string;
  boss: string;
  guardian: string;
  total_elite: string;
  vampire: string;
  beam: string;
  scatter: string;
  saboteur: string;
  commander: string;
  discount: string;
  destroyed_by_orb: string;
  destroyed_by_thorn: string;
  destroyed_by_death_ray: string;
  destroyed_by_mine: string;
  destroyed_in_spotlight: string;
}

export interface BotGuardianStats {
  battle_date: string;
  flame_bot_damage: string;
  thunder_bot_stuns: string;
  golden_bot_coins: string;
  destroyed_by_golden_bot: string;
  guardian_damage: string;
  guardian_summoned_enemies: string;
  guardian_stolen_coins: string;
  guardian_returned_coins: string;
  gems: string;
  medals: string;
  reroll_shards: string;
  cannon_shards: string;
  armor_shards: string;
  generator_shards: string;
  core_shards: string;
  common_modules: string;
  rare_modules: string;
}

export interface FullReport {
  battle_report: BattleReport;
  combat_stats: CombatStats;
  utility_stats: UtilityStats;
  enemy_stats: EnemyStats;
  bot_guardian_stats: BotGuardianStats;
}