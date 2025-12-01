import type { BattleMain, FullReport } from '../types/report';

const API_BASE_URL = 'http://localhost:8000/api';

export const createReport = async (reportText: string, notes: string): Promise<BattleMain> => {
  const formData = new FormData();
  formData.append('report_text', reportText);
  if (notes) formData.append('notes', notes);
  
  const response = await fetch(`${API_BASE_URL}/reports/`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create report');
  }
  
  return response.json();
};

export const getReports = async (): Promise<BattleMain[]> => {
  const response = await fetch(`${API_BASE_URL}/reports/`);
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}`);
  if (!response.ok) throw new Error('Failed to fetch report detail');
  return response.json();
};