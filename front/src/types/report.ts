/**
 * 파일명: thetower/front/src/types/report.ts
 * 용도: 전투 기록(Battle Report) 및 통계 관련 공통 타입 정의
 * 기능: BattleMain, BattleDetail, FullReport 등 API 응답 스키마와 호환되는 타입 제공
 */

/** 
 * 전투 기록의 메인(요약) 정보 인터페이스
 */
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
  
  total_enemies?: number; // 추가: 전체 적 처치 수
  
  // 상위 딜러 리스트 (문자열 배열)
  top_damages: string[];
  
  // 주요 킬 소스별 비율 (%)
  death_wave_ratio?: string;
  spotlight_ratio?: string;
  golden_bot_ratio?: string;
}

/** 
 * 전투 기록의 상세 JSON 데이터 인터페이스
 */
export interface BattleDetail {
  battle_date: string;
  combat_json: Record<string, any>;
  utility_json: Record<string, any>;
  enemy_json: Record<string, any>;
  bot_json: Record<string, any>;
}

/** 
 * 메인 정보와 상세 정보를 포함한 전체 리포트 인터페이스
 */
export interface FullReport {
  main: BattleMain;
  detail: BattleDetail;
}

/**
 * V2 신규 지표 인터페이스
 */
export interface BattleMainV2 {
  battle_date: string;
  cells_per_hour?: number;
  best_coins_per_minute?: number;
  max_wave_skip?: number;
  best_skip_coins?: number;
  best_skip_cells?: number;
  max_smart_missile_stack?: number;
  max_golden_combo?: number;
  best_golden_combo_coins?: number;
  max_inner_mine_charge?: number;
}

/**
 * V2 상세 JSON 데이터 인터페이스
 */
export interface BattleDetailV2 {
  damage_json: Record<string, any>;
  utility_json: Record<string, any>;
  stats_json: Record<string, any>;
  enemy_json: Record<string, any>;
  coin_json: Record<string, any>;
  currency_json: Record<string, any>;
  kill_source_json: Record<string, any>;
}

/**
 * V2 통합 리포트 인터페이스
 */
export interface FullReportV2 {
  main: BattleMain;
  v2_main?: BattleMainV2;
  detail?: BattleDetail;
  v2_detail?: BattleDetailV2;
}

/** 
 * 월별 집계 요약 정보 인터페이스
 */
export interface MonthlySummary {
  month_key: string;    // "YYYY-MM"
  count: number;        // 게임 수
  total_coins: number;  // 총 코인
  total_cells: number;  // 총 셀
  total_shards: number; // 총 파편
}

/** 
 * 기록실 뷰 응답 인터페이스
 */
export interface HistoryViewResponse {
  recent_reports: BattleMain[];          // 최근 7일치 상세 기록
  monthly_summaries: MonthlySummary[];   // 그 이전 데이터들의 월별 요약
}
