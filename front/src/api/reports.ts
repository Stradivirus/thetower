import type { BattleMain, FullReport } from '../types/report';
import { API_BASE_URL } from '../utils/apiConfig'; // [New] 중앙 설정 임포트

const REPORTS_URL = `${API_BASE_URL}/reports`; // 리포트 엔드포인트

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
  
  const response = await fetch(`${REPORTS_URL}/`, { // [Modified]
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

export const getReports = async (): Promise<BattleMain[]> => {
  const response = await fetch(`${REPORTS_URL}/`, { // [Modified]
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  const response = await fetch(`${REPORTS_URL}/${battleDate}`, { // [Modified]
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};