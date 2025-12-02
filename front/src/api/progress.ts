import { API_BASE_URL } from '../utils/apiConfig';

const PROGRESS_URL = `${API_BASE_URL}/progress`; // '/api/progress'

const getAuthHeaders = (contentType: boolean = false) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// 진행 상황 불러오기
export const fetchProgress = async (): Promise<Record<string, any>> => {
  const response = await fetch(`${PROGRESS_URL}/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('진행 상황 불러오기 실패');
  }
  
  const data = await response.json();
  return data.progress_json || {};
};

// 진행 상황 저장하기
export const saveProgress = async (progress: Record<string, any>): Promise<void> => {
  const response = await fetch(`${PROGRESS_URL}/`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ progress_json: progress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '진행 상황 저장 실패');
  }
  // 성공 시 body를 반환하지 않으므로 void
};