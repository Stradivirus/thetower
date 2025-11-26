// [Updated] 백엔드 2-Table 구조에 맞춘 타입 정의

export interface BattleMain {
  battle_date: string;
  created_at: string;
  tier: string;
  wave: number;
  game_time: string;
  real_time: string;
  coin_earned: number;         // 숫자형 (계산용)
  cells_earned: number;
  reroll_shards_earned: number;
  killer: string;
  damage_dealt: string;
  damage_taken: string;
  notes?: string;              // 메모 기능
}

export interface BattleDetail {
  battle_date: string;
  combat_json: Record<string, string>;   // JSON 데이터
  utility_json: Record<string, string>;
  enemy_json: Record<string, string>;
  bot_json: Record<string, string>;
}

export interface FullReport {
  main: BattleMain;
  detail: BattleDetail;
}