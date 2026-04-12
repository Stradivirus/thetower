/**
 * 파일명: thetower/front/src/api/reports.ts
 * 용도: 전투 기록(Battle Report) 및 통계 관련 API 호출 함수 정의
 * 기능: 리포트 생성, 상세 조회, 목록 페이징, 일간/주간/월간 통계 데이터 페칭
 */
import type { BattleMain, FullReportV2, HistoryViewResponse } from '../types/report';
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const REPORTS_URL = `${API_BASE_URL}/reports`;

// --- 통계 관련 인터페이스 정의 ---
export interface DailyStat {
  date: string;
  total_coins: number;
  total_cells: number;
  coin_growth: number;
  cell_growth: number;
}
export interface WeeklyStatsResponse {
  daily_stats: DailyStat[];
}
export interface WeeklyTrendStat {
  week_start_date: string;
  total_coins: number;
  total_cells: number;
  coin_growth: number;
  cell_growth: number;
}
export interface WeeklyTrendResponse {
  weekly_stats: WeeklyTrendStat[];
}
export interface MonthlyTrendStat {
  month: string;       // 형식: "2024-12"
  total_coins: number;
  total_cells: number;
  coin_growth: number;
  cell_growth: number;
  is_current?: boolean;
}
export interface MonthlyTrendResponse {
  monthly_stats: MonthlyTrendStat[];
}

/**
 * 새로운 전투 기록을 생성(업로드)합니다.
 */
export const createReport = async (reportText: string, notes: string): Promise<BattleMain> => {
  const formData = new FormData();
  formData.append('report_text', reportText);
  if (notes) formData.append('notes', notes);

  const response = await fetchWithAuth(`${REPORTS_URL}/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create report');
  }
  return response.json();
};

/**
 * 기록실 뷰 데이터를 조회합니다 (최근 7일 상세 + 그 이전 월별 요약).
 */
export const getHistoryView = async (): Promise<HistoryViewResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/view`);
  if (!response.ok) throw new Error('Failed to fetch history view');
  return response.json();
};

/**
 * 특정 월의 상세 기록 목록을 조회합니다 (기록실 확장 시 호출).
 */
export const getReportsByMonth = async (monthKey: string): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/month/${monthKey}`);
  if (!response.ok) throw new Error('Failed to fetch monthly reports');
  return response.json();
};

/**
 * 전체 기록 목록을 조회합니다 (검색 및 전체 통계용).
 */
export const getAllReports = async (): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/history?skip=0&limit=10000`);
  if (!response.ok) throw new Error('Failed to fetch all reports');
  return response.json();
};

/**
 * 최근 7일간의 일간 통계 데이터를 조회합니다.
 */
export const getWeeklyStats = async (): Promise<WeeklyStatsResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/weekly-stats`);
  if (!response.ok) throw new Error('Failed to fetch weekly stats');
  return response.json();
};

/**
 * 최근 8주간의 주간 트렌드 데이터를 조회합니다.
 */
export const getWeeklyTrends = async (): Promise<WeeklyTrendResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/weekly-trends`);
  if (!response.ok) throw new Error('Failed to fetch weekly trends');
  return response.json();
};

/**
 * 최근 6개월간의 월간 트렌드 데이터를 조회합니다.
 */
export const getMonthlyTrends = async (): Promise<MonthlyTrendResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/monthly-trends`);
  if (!response.ok) throw new Error('Failed to fetch monthly trends');
  return response.json();
};

/**
 * 대시보드 표시를 위한 최근 기록들을 조회합니다.
 */
export const getRecentReports = async (): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/recent`);
  if (!response.ok) throw new Error('Failed to fetch recent reports');
  return response.json();
};

/**
 * 특정 시점의 상세 리포트 데이터를 조회합니다.
 */
export const getFullReport = async (battleDate: string): Promise<FullReportV2> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`);
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};

/**
 * 특정 전투 기록을 삭제합니다.
 */
export const deleteReport = async (battleDate: string): Promise<void> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete report');
  }
};
