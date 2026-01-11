// front/src/api/stats.ts
import { API_BASE_URL, fetchWithAuth } from '../utils/apiConfig';

export interface TierRecord {
  tier: number;
  max_wave: number;
  my_wave: number; // [추가] 내 최고 기록
}

export const getGlobalMaxWaves = async (): Promise<TierRecord[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/max-waves`);
  
  if (response.ok) {
    return await response.json();
  }
  
  console.error("Failed to fetch max waves status:", response.status);
  return [];
};