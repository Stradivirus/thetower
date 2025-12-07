// src/data/module_reroll_data.ts

export const RARITY = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHIC: 4,
  ANCESTRAL: 5,
} as const;

export const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary", "Mythic", "Ancestral"];

export const SUB_MODULE_CHANCES = {
  [RARITY.COMMON]: 46.2,
  [RARITY.RARE]: 40.0,
  [RARITY.EPIC]: 10.0,
  [RARITY.LEGENDARY]: 2.5,
  [RARITY.MYTHIC]: 1.0,
  [RARITY.ANCESTRAL]: 0.3,
};

export const REROLL_COSTS: Record<number, number> = {
  0: 10,
  1: 40,
  2: 160,
  3: 500,
  4: 1000,
  5: 1600,
  6: 2250,
  7: 3000,
};

// ==========================================
// 1. CANNON (Attack)
// ==========================================
export const CANNON_SUB_EFFECTS = [
  { id: "attack_speed", name: "Attack Speed", unit: "", values: [0.3, 0.5, 0.7, 1, 3, 5] },
  { id: "crit_chance", name: "Crit Chance", unit: "%", values: [2, 3, 4, 6, 8, 10] },
  { id: "crit_factor", name: "Crit Factor", unit: "x", values: [2, 4, 6, 8, 12, 15] },
  { id: "attack_range", name: "Attack Range", unit: "m", values: [2, 4, 8, 12, 20, 30] },
  { id: "damage_per_meter", name: "Damage / Meter", unit: "m", values: [0.005, 0.01, 0.025, 0.04, 0.075, 0.15] },
  { id: "multishot_chance", name: "Multishot Chance", unit: "%", values: [null, 3, 5, 7, 10, 13] },
  { id: "multishot_targets", name: "Multishot Targets", unit: "", values: [null, null, 1, 2, 3, 4] },
  { id: "rapid_fire_chance", name: "Rapid Fire Chance", unit: "%", values: [null, 2, 4, 6, 9, 12] },
  { id: "rapid_fire_duration", name: "Rapid Fire Duration", unit: "s", values: [null, 0.4, 0.8, 1.4, 2.5, 3.5] },
  { id: "bounce_shot_chance", name: "Bounce Shot Chance", unit: "%", values: [null, 2, 3, 5, 9, 12] },
  { id: "bounce_shot_targets", name: "Bounce Shot Targets", unit: "", values: [null, null, 1, 2, 3, 4] },
  { id: "bounce_shot_range", name: "Bounce Shot Range", unit: "m", values: [null, 0.5, 0.8, 1.2, 1.8, 2.0] },
  { id: "super_crit_chance", name: "Super Crit Chance", unit: "%", values: [null, null, 3, 5, 7, 10] },
  { id: "super_crit_multi", name: "Super Crit Multi", unit: "x", values: [null, null, 2, 3, 5, 7] },
  { id: "rend_armor_chance", name: "Rend Armor Chance", unit: "%", values: [null, null, null, 2, 5, 8] },
  { id: "rend_armor_multi", name: "Rend Armor Multi", unit: "%", values: [null, null, null, 2, 5, 8] },
  { id: "max_rend_armor_multi", name: "Max Rend Armor Multi", unit: "%", values: [null, null, null, 200, 300, 500] },
];

// ==========================================
// 2. ARMOR (Defense)
// ==========================================
export const ARMOR_SUB_EFFECTS = [
  { id: "health_regen", name: "Health Regen", unit: "%", values: [20, 40, 60, 100, 200, 400] },
  { id: "defense_percent", name: "Defense", unit: "%", values: [1, 2, 3, 5, 6, 8] },
  { id: "defense_absolute", name: "Defense Absolute", unit: "%", values: [15, 25, 40, 100, 500, 1000] },
  { id: "thorns_damage", name: "Thorns Damage", unit: "", values: [null, null, 2, 4, 7, 10] },
  { id: "lifesteal", name: "Lifesteal", unit: "%", values: [null, null, 0.3, 0.5, 1.5, 2.0] },
  { id: "knockback_chance", name: "Knockback Chance", unit: "%", values: [null, null, 2, 4, 6, 9] },
  { id: "knockback_force", name: "Knockback Force", unit: "", values: [null, null, 0.1, 0.4, 0.9, 1.5] },
  { id: "orb_speed", name: "Orb Speed", unit: "", values: [null, null, 1, 1.5, 2, 3] },
  { id: "orbs", name: "Orbs", unit: "", values: [null, null, null, null, 1, 2] },
  { id: "shockwave_size", name: "Shockwave Size", unit: "", values: [null, null, 0.1, 0.3, 0.7, 1] },
  { id: "shockwave_frequency", name: "Shockwave Frequency", unit: "s", values: [null, null, -1, -2, -3, -4] },
  { id: "land_mine_damage", name: "Land Mine Damage", unit: "%", values: [null, 30, 50, 150, 500, 800] },
  { id: "land_mine_chance", name: "Land Mine Chance", unit: "%", values: [null, 1.5, 3, 6, 9, 12] },
  { id: "land_mine_radius", name: "Land Mine Radius", unit: "", values: [null, 0.1, 0.15, 0.3, 0.75, 1] },
  { id: "death_defy", name: "Death Defy", unit: "%", values: [null, null, null, 1.5, 3.5, 5] },
  { id: "wall_health", name: "Wall Health", unit: "%", values: [null, null, 20, 40, 90, 120] },
  { id: "wall_rebuild", name: "Wall Rebuild", unit: "s", values: [null, null, -20, -40, -80, -100] },
];

// ==========================================
// 3. GENERATOR (Utility)
// ==========================================
export const GENERATOR_SUB_EFFECTS = [
  { id: "cash_bonus", name: "Cash Bonus", unit: "x", values: [0.1, 0.2, 0.3, 0.5, 1.2, 2.5] },
  { id: "cash_per_wave", name: "Cash / Wave", unit: "", values: [30, 50, 100, 200, 500, 1000] },
  { id: "coins_kill_bonus", name: "Coins / Kill Bonus", unit: "x", values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] },
  { id: "coins_per_wave", name: "Coins / Wave", unit: "", values: [20, 35, 60, 120, 200, 350] },
  { id: "free_attack_upgrade", name: "Free Attack Upgrade", unit: "%", values: [2, 4, 6, 8, 10, 12] },
  { id: "free_defense_upgrade", name: "Free Defense Upgrade", unit: "%", values: [2, 4, 6, 8, 10, 12] },
  { id: "free_utility_upgrade", name: "Free Utility Upgrade", unit: "%", values: [2, 4, 6, 8, 10, 12] },
  { id: "interest_per_wave", name: "Interest / Wave", unit: "%", values: [null, null, 2, 4, 6, 8] },
  { id: "recovery_amount", name: "Recovery Amount", unit: "%", values: [null, null, 3, 5, 7, 10] },
  { id: "max_recovery", name: "Max Recovery", unit: "x", values: [null, null, 0.4, 0.7, 1.0, 1.5] },
  { id: "package_chance", name: "Package Chance", unit: "%", values: [null, null, 5, 8, 11, 15] },
  { id: "enemy_attack_skip", name: "Enemy Attack Level Skip", unit: "%", values: [null, null, 2, 4, 6, 8] },
  { id: "enemy_health_skip", name: "Enemy Health Level Skip", unit: "%", values: [null, null, 2, 4, 6, 8] },
];

// ==========================================
// 4. CORE (Ultimate Weapons)
// ==========================================
export const CORE_SUB_EFFECTS = [
  // Image 1: GT ~ Smart Missiles
  { id: "gt_bonus", name: "Golden Tower - Bonus", unit: "", values: [null, null, 1, 2, 3, 4] },
  { id: "gt_duration", name: "Golden Tower - Duration", unit: "s", values: [null, null, null, 2, 4, 7] },
  { id: "gt_cooldown", name: "Golden Tower - Cooldown", unit: "s", values: [null, null, null, -5, -8, -12] },
  { id: "bh_size", name: "Black Hole - Size", unit: "m", values: [2, 4, 6, 8, 10, 12] },
  { id: "bh_duration", name: "Black Hole - Duration", unit: "s", values: [null, null, null, 2, 3, 4] },
  { id: "bh_cooldown", name: "Black Hole - Cooldown", unit: "s", values: [null, null, null, -2, -3, -4] },
  { id: "sl_bonus", name: "Spotlight - Bonus", unit: "x", values: [1.2, 2.5, 3.5, 10, 15, 20] },
  { id: "sl_angle", name: "Spotlight - Angle", unit: "°", values: [null, null, 3, 6, 11, 15] },
  { id: "cf_duration", name: "Chrono Field - Duration", unit: "s", values: [null, null, null, 4, 7, 10] },
  { id: "cf_speed_reduction", name: "Chrono Field - Speed Red.", unit: "%", values: [null, null, 3, 8, 11, 15] },
  { id: "cf_cooldown", name: "Chrono Field - Cooldown", unit: "s", values: [null, null, null, -4, -7, -10] },
  { id: "dw_damage", name: "Death Wave - Damage", unit: "x", values: [8, 15, 25, 50, 100, 250] },
  { id: "dw_quantity", name: "Death Wave - Quantity", unit: "", values: [null, null, null, 1, 2, 3] },
  { id: "dw_cooldown", name: "Death Wave - Cooldown", unit: "s", values: [null, null, null, -6, -10, -13] },
  { id: "sm_damage", name: "Smart Missiles - Damage", unit: "x", values: [8, 15, 25, 50, 100, 250] },
  { id: "sm_quantity", name: "Smart Missiles - Quantity", unit: "", values: [null, null, 1, 2, 4, 5] },
  { id: "sm_cooldown", name: "Smart Missiles - Cooldown", unit: "s", values: [null, null, null, -2, -4, -6] },
  
  // Image 2: ILM ~ Chain Lightning
  { id: "ilm_damage", name: "Inner Land Mines - Damage", unit: "x", values: [8, 15, 25, 50, 100, 250] },
  { id: "ilm_quantity", name: "Inner Land Mines - Quantity", unit: "", values: [null, null, null, 1, 2, 3] },
  { id: "ilm_cooldown", name: "Inner Land Mines - Cooldown", unit: "s", values: [null, null, -5, -8, -10, -13] },
  { id: "ps_damage", name: "Poison Swamp - Damage", unit: "x", values: [8, 15, 25, 50, 100, 250] },
  { id: "ps_duration", name: "Poison Swamp - Duration", unit: "s", values: [null, null, null, 2, 5, 10] },
  { id: "ps_cooldown", name: "Poison Swamp - Cooldown", unit: "s", values: [null, -2, -4, -6, -8, -10] },
  { id: "cl_damage", name: "Chain Lightning - Damage", unit: "x", values: [8, 15, 25, 50, 100, 250] },
  { id: "cl_quantity", name: "Chain Lightning - Quantity", unit: "", values: [null, null, 1, 2, 3, 4] },
  { id: "cl_chance", name: "Chain Lightning - Chance", unit: "%", values: [2, 4, 6, 9, 12, 15] },
];

// 통합 매핑 데이터 (RerollPanel에서 사용)
export const MODULE_TYPES: Record<string, typeof CANNON_SUB_EFFECTS> = {
  cannon: CANNON_SUB_EFFECTS,
  armor: ARMOR_SUB_EFFECTS,
  generator: GENERATOR_SUB_EFFECTS,
  core: CORE_SUB_EFFECTS,
};