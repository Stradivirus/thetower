import type { BattleMain, FullReport } from '../types/report';
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig'; // [Modified]

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
  
  // [Modified] fetchWithAuth 사용
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

export const getReports = async (): Promise<BattleMain[]> => {
  // [Modified] fetchWithAuth 사용
  const response = await fetchWithAuth(`${REPORTS_URL}/`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  // [Modified] fetchWithAuth 사용
  const response = await fetchWithAuth(`${REPORTS_URL}/${battleDate}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};