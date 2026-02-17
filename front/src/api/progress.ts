/**
 * 파일명: thetower/front/src/api/progress.ts
 * 용도: 게임 진행도(카드, UW 등) 관련 API 호출 함수 정의
 * 기능: 서버로부터 진행도 데이터를 불러오거나 업데이트
 */
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

const PROGRESS_URL = `${API_BASE_URL}/progress`;

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
 * 사용자의 게임 진행 상황을 서버에서 불러옵니다.
 */
export const fetchProgress = async (): Promise<Record<string, any>> => {
  const response = await fetchWithAuth(`${PROGRESS_URL}/`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('진행 상황 불러오기 실패');
  }
  
  const data = await response.json();
  return data.progress_json || {};
};

/** 
 * 사용자의 게임 진행 상황을 서버에 저장합니다.
 */
export const saveProgress = async (progress: Record<string, any>): Promise<void> => {
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