// 파일 경로 수정: '../types/report'가 아닌, 실제 타입 파일의 경로와 이름 (report.ts)을 가리키도록 명확하게 수정
import type { BattleReport, FullReport, CombatStats, UtilityStats, EnemyStats, BotGuardianStats } from '../types/report';

const API_BASE_URL = 'http://localhost:8000/api';

export const createReport = async (reportText: string): Promise<BattleReport> => {
  // FormData를 사용해서 report_text 파라미터로 전송
  const formData = new FormData();
  formData.append('report_text', reportText);
  
  const response = await fetch(`${API_BASE_URL}/reports/`, {
    method: 'POST',
    body: formData,  // JSON이 아니라 FormData 전송
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Failed to create report:', errorData);
    if (errorData.detail) {
      console.error('Validation errors:', errorData.detail);
    }
    throw new Error('Failed to create report');
  }
  
  return response.json();
};

export const getReports = async (): Promise<BattleReport[]> => {
  const response = await fetch(`${API_BASE_URL}/reports/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  
  return response.json();
};

export const getFullReport = async (battleDate: string): Promise<FullReport> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }
  
  return response.json();
};

export const getCombatStats = async (battleDate: string): Promise<CombatStats> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}/combat`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch combat stats');
  }
  
  return response.json();
};

export const getUtilityStats = async (battleDate: string): Promise<UtilityStats> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}/utility`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch utility stats');
  }
  
  return response.json();
};

export const getEnemyStats = async (battleDate: string): Promise<EnemyStats> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}/enemy`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch enemy stats');
  }
  
  return response.json();
};

export const getBotGuardianStats = async (battleDate: string): Promise<BotGuardianStats> => {
  const response = await fetch(`${API_BASE_URL}/reports/${battleDate}/bot`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch bot/guardian stats');
  }
  
  return response.json();
};