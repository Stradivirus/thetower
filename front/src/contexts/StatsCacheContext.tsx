/**
 * 파일명: thetower/front/src/contexts/StatsCacheContext.tsx
 * 용도: 통계 및 요약 정보 API 응답 캐싱을 위한 전역 컨텍스트
 * 기능: 일간/주간/월간 통계 API 응답 임시 저장(Cache), 신규 업로드 시 캐시 파괴(Invalidation)
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { getGlobalMaxWaves, type TierRecord } from '../api/stats';
import { getWeeklyStats, getWeeklyTrends, getMonthlyTrends } from '../api/reports';

interface StatsCacheContextType {
  getGlobalMaxWavesCached: () => Promise<TierRecord[]>;
  getWeeklyStatsCached: () => Promise<any>;
  getWeeklyTrendsCached: () => Promise<any>;
  getMonthlyTrendsCached: () => Promise<any>;
  invalidateStatsCache: () => void;
}

const StatsCacheContext = createContext<StatsCacheContextType | undefined>(undefined);

export const StatsCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalMaxWaves, setGlobalMaxWaves] = useState<TierRecord[] | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<any | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any | null>(null);

  const getGlobalMaxWavesCached = useCallback(async () => {
    if (globalMaxWaves) return globalMaxWaves;
    const data = await getGlobalMaxWaves();
    setGlobalMaxWaves(data);
    return data;
  }, [globalMaxWaves]);

  const getWeeklyStatsCached = useCallback(async () => {
    if (weeklyStats) return weeklyStats;
    const data = await getWeeklyStats();
    setWeeklyStats(data);
    return data;
  }, [weeklyStats]);

  const getWeeklyTrendsCached = useCallback(async () => {
    if (weeklyTrends) return weeklyTrends;
    const data = await getWeeklyTrends();
    setWeeklyTrends(data);
    return data;
  }, [weeklyTrends]);

  const getMonthlyTrendsCached = useCallback(async () => {
    if (monthlyTrends) return monthlyTrends;
    const data = await getMonthlyTrends();
    setMonthlyTrends(data);
    return data;
  }, [monthlyTrends]);

  const invalidateStatsCache = useCallback(() => {
    setGlobalMaxWaves(null);
    setWeeklyStats(null);
    setWeeklyTrends(null);
    setMonthlyTrends(null);
    console.log("[StatsCache] 🗑️ 전역 통계 캐시가 무효화되었습니다.");
  }, []);

  return (
    <StatsCacheContext.Provider value={{
      getGlobalMaxWavesCached,
      getWeeklyStatsCached,
      getWeeklyTrendsCached,
      getMonthlyTrendsCached,
      invalidateStatsCache
    }}>
      {children}
    </StatsCacheContext.Provider>
  );
};

export const useStatsCache = () => {
  const context = useContext(StatsCacheContext);
  if (!context) {
    throw new Error('useStatsCache must be used within a StatsCacheProvider');
  }
  return context;
};
