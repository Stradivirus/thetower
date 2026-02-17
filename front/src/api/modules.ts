/**
 * 파일명: thetower/front/src/api/modules.ts
 * 용도: 모듈(장비) 인벤토리 및 장착 데이터 관련 API 호출 함수 정의
 * 기능: 서버로부터 모듈 데이터를 불러오거나 업데이트
 */
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const MODULES_URL = `${API_BASE_URL}/modules`;

/** 
 * 인증 헤더를 생성합니다. 
 */
const getAuthHeaders = (contentType: boolean = false) => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/** 
 * 모듈 데이터 인터페이스
 */
export interface ModulesData {
  inventory_json: Record<string, any>; // 보유 중인 모듈 목록
  equipped_json: Record<string, any>;  // 장착 중인 모듈 정보
}

/** 
 * 사용자의 모듈 데이터를 서버에서 불러옵니다.
 */
export const fetchModules = async (): Promise<ModulesData> => {
  const response = await fetchWithAuth(`${MODULES_URL}/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('모듈 데이터 불러오기 실패');
  }

  return response.json();
};

/** 
 * 사용자의 모듈 데이터를 서버에 저장합니다.
 */
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