import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const MODULES_URL = `${API_BASE_URL}/modules`;

const getAuthHeaders = (contentType: boolean = false) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export interface ModulesData {
  inventory_json: Record<string, any>;
  equipped_json: Record<string, any>;
}

// 모듈 데이터 불러오기
export const fetchModules = async (): Promise<ModulesData> => {
  const response = await fetchWithAuth(`${MODULES_URL}/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('모듈 데이터 불러오기 실패');
  }

  return response.json();
};

// 모듈 데이터 저장하기
export const saveModules = async (data: ModulesData): Promise<void> => {
  const response = await fetchWithAuth(`${MODULES_URL}/`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('모듈 데이터 저장 실패');
  }
};