// [Updated] 백엔드 스키마 변경 반영
export interface BattleMain {
  battle_date: string;
  created_at: string;
  tier: string;
  wave: number;
  game_time: string;
  real_time: string;
  
  coin_earned: number;
  coins_per_hour: number; // [New] 시간당 코인
  cells_earned: number;
  reroll_shards_earned: number;
  
  killer: string;
  damage_dealt: string;
  damage_taken: string;
  notes?: string;
}

export interface BattleDetail {
  battle_date: string;
  combat_json: Record<string, string>;
  utility_json: Record<string, string>;
  enemy_json: Record<string, string>;
  bot_json: Record<string, string>;
}

export interface FullReport {
  main: BattleMain;
  detail: BattleDetail;
}