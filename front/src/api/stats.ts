/**
 * 파일명: thetower/front/src/api/stats.ts
 * 용도: 최고 기록(Max Waves) 관련 API 호출 함수 정의
 * 기능: 티어별 서버 최고 기록 및 내 최고 기록 조회
 */
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

/** 
 * 티어별 최고 기록 데이터 인터페이스
 */
export interface TierRecord {
  tier: number;
  max_wave: number;
  my_wave: number;
}

/** 
 * 전 서버 티어별 최고 기록과 사용자의 개인 최고 기록 목록을 조회합니다.
 */
export const getGlobalMaxWaves = async (): Promise<TierRecord[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/max-waves`);
  
  if (response.ok) {
    return await response.json();
  }
  
  console.error("Failed to fetch max waves status:", response.status);
  return [];
};