import type { BattleMain, FullReport } from '../types/report';
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const REPORTS_URL = `${API_BASE_URL}/reports`;

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

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

// [Deprecated] 기존 전체 조회 (하위 호환성 위해 유지하거나 제거 가능)
export const getReports = async (): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
};

// [New] 최근 3일 데이터 조회 (메인 대시보드용)
export const getRecentReports = async (): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/recent`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch recent reports');
  return response.json();
};

// [New] 과거 데이터 조회 (기록 보관소용)
// limit을 넉넉하게 잡거나, 추후 무한 스크롤 구현 시 파라미터 조절 가능
export const getHistoryReports = async (skip: number = 0, limit: number = 1000): Promise<BattleMain[]> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/history?skip=${skip}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch history reports');
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};