// front/src/types/report.ts

export interface BattleMain {
  battle_date: string;
  created_at: string;
  tier: string;
  wave: number;
  game_time: string;
  real_time: string;
  
  coin_earned: number;
  coins_per_hour: number;
  cells_earned: number;
  reroll_shards_earned: number;
  
  killer: string;
  damage_dealt: string;
  damage_taken: string;
  notes?: string;
  
  // [변경] 객체 배열 대신 단순 문자열 배열 사용
  top_damages: string[];
  
  // 비율 데이터
  death_wave_ratio?: string;
  spotlight_ratio?: string;
  golden_bot_ratio?: string;
}

export interface BattleDetail {
  battle_date: string;
  combat_json: Record<string, any>;
  utility_json: Record<string, any>;
  enemy_json: Record<string, any>;
  bot_json: Record<string, any>;
}

export interface FullReport {
  main: BattleMain;
  detail: BattleDetail;
}

export interface MonthlySummary {
  month_key: string;    // "2023-12"
  count: number;
  total_coins: number;
  total_cells: number;
  total_shards: number;
}

export interface HistoryViewResponse {
  recent_reports: BattleMain[];          // 최근 7일치 상세
  monthly_summaries: MonthlySummary[];   // 그 이전 월별 요약
}