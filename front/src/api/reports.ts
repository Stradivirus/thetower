import type { BattleMain, FullReport, HistoryViewResponse } from '../types/report';
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const REPORTS_URL = `${API_BASE_URL}/reports`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

// --- 기존 통계 타입들 ---
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
// ----------------------

export const createReport = async (reportText: string, notes: string): Promise<BattleMain> => {
  const formData = new FormData();
  formData.append('report_text', reportText);
  if (notes) formData.append('notes', notes);
  
  const response = await fetchWithAuth(`${REPORTS_URL}/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create report');
  }
  return response.json();
};

// [New] 기록실 뷰 데이터 조회 (최근 7일 + 월별 요약)
export const getHistoryView = async (): Promise<HistoryViewResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/view`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch history view');
  return response.json();
};

// [New] 특정 월의 상세 기록 조회 (Lazy Loading)
export const getReportsByMonth = async (monthKey: string): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/month/${monthKey}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch monthly reports');
  return response.json();
};

// 일간 통계 조회
export const getWeeklyStats = async (): Promise<WeeklyStatsResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/weekly-stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch weekly stats');
  return response.json();
};

// 주간 트렌드 조회
export const getWeeklyTrends = async (): Promise<WeeklyTrendResponse> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/weekly-trends`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch weekly trends');
  return response.json();
};

export const getRecentReports = async (): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/recent`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch recent reports');
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};

export const deleteReport = async (battleDate: string): Promise<void> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete report');
  }
};