import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig'; // [Modified]

const PROGRESS_URL = `${API_BASE_URL}/progress`;

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
  // [Modified] fetchWithAuth 사용
  const response = await fetchWithAuth(`${PROGRESS_URL}/`, {
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
  // [Modified] fetchWithAuth 사용
  const response = await fetchWithAuth(`${PROGRESS_URL}/`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ progress_json: progress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '진행 상황 저장 실패');
  }
};