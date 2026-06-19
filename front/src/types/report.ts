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
  best_coins_per_minute?: number; // 추가: 분당 최고 코인 수
  
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

/** 게임 데이터 값 타입 (게임 내 수치는 항상 문자열 또는 숫자) */
export type GameValue = string | number;

/**
 * damage_json 중첩 구조
 * 파서가 DAMAGE_JSON_SECTIONS 기준으로 묶는 하위 섹션들
 * 인덱스 시그니처 포함 → StatGrid의 Record 타입에 할당 가능
 */
export type DamageJson = {
  [key: string]: Record<string, GameValue> | undefined;
  damage?: Record<string, GameValue>;        // 공격 대미지 (Damage Dealt, 무기별 대미지)
  damage_taken?: Record<string, GameValue>;  // 받은 대미지 (Tower, Wall)
  bonus_hp?: Record<string, GameValue>;      // 보너스 체력 획득
  hp_regen?: Record<string, GameValue>;      // 체력 재생 (Lifesteal, Tower/Wall Regen)
  damage_block?: Record<string, GameValue>;  // 대미지 차단 (Defense %, Absolute 등)
};

/**
 * stats_json 중첩 구조
 * 파서가 STATS_JSON_SECTIONS 기준으로 묶는 하위 섹션들
 * 인덱스 시그니처 포함 → StatGrid의 Record 타입에 할당 가능
 */
export type StatsJson = {
  [key: string]: Record<string, GameValue> | undefined;
  stats?: Record<string, GameValue>;         // 수치/카운트 (Counts 섹션)
  enemy_hits?: Record<string, GameValue>;    // 적 타격 수 (Enemies Hit By)
  kill_effects?: Record<string, GameValue>;  // 효과 활성 상태에서 처치 (Killed With Effect Active)
};

/**
 * V2 상세 JSON 데이터 인터페이스
 */
export interface BattleDetailV2 {
  damage_json: DamageJson;
  utility_json: Record<string, GameValue>;
  stats_json: StatsJson;
  enemy_json: Record<string, GameValue>;
  coin_json: Record<string, GameValue>;
  currency_json: Record<string, GameValue>;
  kill_source_json: Record<string, GameValue>;
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
