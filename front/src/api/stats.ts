// front/src/api/stats.ts
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

export interface TierRecord {
  tier: number;
  max_wave: number;
}

export const getGlobalMaxWaves = async (): Promise<TierRecord[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/max-waves`);
  
  if (response.ok) {
    return await response.json();
  }
  
  // 에러 발생 시 빈 배열 반환 혹은 에러 던지기
  console.error("Failed to fetch max waves status:", response.status);
  return [];
};