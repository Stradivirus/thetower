/**
 * 파일명: front/src/types/history.ts
 * 용도: 히스토리 페이지 및 관련 컴포넌트에서 사용하는 공통 타입 정의
 * 기능: MonthlyGroup, TournamentFilterMode 등 데이터 구조 및 타입 인터페이스 제공
 */
import type { BattleMain } from './report';

/** 
 * 월별 그룹화된 데이터 인터페이스 
 */
export interface MonthlyGroup {
  monthKey: string;      // "YYYY-MM" 형식의 키 또는 "recent"
  reports: BattleMain[]; // 해당 그룹의 리포트 목록
  summary: {
    count: number;
    total_coins: number;
    total_cells: number;
    total_shards: number;
    avg_coins_per_game: number;
    avg_coins_per_day: number;
  };
}

export type TournamentFilterMode = 'all' | 'include' | 'exclude';
