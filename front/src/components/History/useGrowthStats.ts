import { useState, useEffect, useMemo } from 'react';
import { getWeeklyTrends, getMonthlyTrends } from '../../api/reports';
import type { WeeklyStatsResponse, WeeklyTrendResponse, MonthlyTrendResponse } from '../../api/reports';

export function useGrowthStats(dailyData: WeeklyStatsResponse | null, dailyLoading: boolean) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [resourceType, setResourceType] = useState<'coin' | 'cell'>('coin');
  
  const [weeklyData, setWeeklyData] = useState<WeeklyTrendResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrendResponse | null>(null);
  
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // 1. 데이터 페칭
  useEffect(() => {
    if (viewMode === 'weekly' && !weeklyData) {
      const fetchWeekly = async () => {
        setWeeklyLoading(true);
        try {
          const res = await getWeeklyTrends();
          setWeeklyData(res);
        } catch (err) {
          console.error(err);
        } finally {
          setWeeklyLoading(false);
        }
      };
      fetchWeekly();
    }
    if (viewMode === 'monthly' && !monthlyData) {
      const fetchMonthly = async () => {
        setMonthlyLoading(true);
        try {
          const res = await getMonthlyTrends();
          setMonthlyData(res);
        } catch (err) {
          console.error(err);
        } finally {
          setMonthlyLoading(false);
        }
      };
      fetchMonthly();
    }
  }, [viewMode, weeklyData, monthlyData]);

  const isLoading = viewMode === 'daily' ? dailyLoading 
                  : viewMode === 'weekly' ? weeklyLoading 
                  : monthlyLoading;

  // 2. 데이터 가공 (필터링 및 슬라이싱)
  const rawData: any[] = useMemo(() => {
    let sourceData: any[] = [];

    if (viewMode === 'daily' && dailyData) sourceData = dailyData.daily_stats;
    else if (viewMode === 'weekly' && weeklyData) sourceData = weeklyData.weekly_stats;
    else if (viewMode === 'monthly' && monthlyData) sourceData = monthlyData.monthly_stats;

    if (sourceData.length === 0) return [];

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let dateFiltered = sourceData;
    if (viewMode === 'daily') {
      dateFiltered = sourceData.filter(d => d.date < todayStr);
    } else if (viewMode === 'weekly') {
      dateFiltered = sourceData.filter(d => d.week_start_date < todayStr);
    }

    if (dateFiltered.length === 0) return [];

    // 0 데이터 제거
    const firstIndex = dateFiltered.findIndex(d => {
      const val = resourceType === 'coin' ? d.total_coins : d.total_cells;
      return val > 0;
    });

    const validData = firstIndex === -1 ? dateFiltered : dateFiltered.slice(firstIndex);
    const limit = viewMode === 'daily' ? 7 : (viewMode === 'weekly' ? 8 : 6);

    return validData.slice(-limit);
  }, [viewMode, dailyData, weeklyData, monthlyData, resourceType]);

  // 3. 추세선 계산 (Trend Line)
  const trendInfo = useMemo(() => {
    let dataForTrend = rawData;
    // 월간 모드일 때는 '이번 달(맨 마지막)'을 추세선 계산에서 제외
    if (viewMode === 'monthly' && rawData.length > 1) {
        dataForTrend = rawData.slice(0, -1); 
    }

    const n = dataForTrend.length;
    if (n <= 1) return { slope: 0, intercept: 0 };

    const points = dataForTrend.map((d, i) => ({
      x: i,
      y: resourceType === 'coin' ? d.total_coins : d.total_cells
    }));

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }, [rawData, resourceType, viewMode]);

  // 4. 차트 데이터 매핑
  const chartData = useMemo(() => {
    return rawData.map((d, i) => {
      let displayDate = '';
      if (viewMode === 'daily') displayDate = d.date.substring(5).replace('-', '/');
      else if (viewMode === 'weekly') displayDate = `${d.week_start_date.substring(5).replace('-', '/')}~`;
      else if (viewMode === 'monthly') displayDate = d.month;

      const amount = resourceType === 'coin' ? d.total_coins : d.total_cells;
      const currentGrowth = resourceType === 'coin' ? d.coin_growth : d.cell_growth;
      
      let trendValue: number | null = trendInfo.slope * i + trendInfo.intercept;
      const isLastMonthly = (viewMode === 'monthly' && i === rawData.length - 1);
      
      if (isLastMonthly) trendValue = null; 

      return {
        ...d,
        displayDate,
        currentGrowth: isLastMonthly ? null : currentGrowth, // [수정] 마지막 달 성장률 선 끊기
        amount,
        trendValue,
        isCurrent: d.is_current,
        isLastMonthly
      };
    });
  }, [rawData, viewMode, resourceType, trendInfo]);

  // 5. 통계 요약 (Summary)
  const summary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avgGrowth: 0, dailyAvg: 0 };
    
    const dataToSummarize = (viewMode === 'monthly' && chartData.length > 1) 
                          ? chartData.slice(0, -1) 
                          : chartData;

    const total = dataToSummarize.reduce((acc, cur) => acc + cur.amount, 0);
    const growthSum = dataToSummarize.reduce((acc, cur) => acc + (cur.currentGrowth || 0), 0);
    const len = dataToSummarize.length || 1;
    
    const avgGrowth = growthSum / len;
    const dailyAvg = total / len;

    return { total, avgGrowth, dailyAvg };
  }, [chartData, viewMode]);

  // 6. 그라데이션 오프셋 계산
  const gradientOffset = useMemo(() => {
    if (chartData.length === 0) return 0;
    const validData = chartData.filter(d => d.currentGrowth !== null);
    if (validData.length === 0) return 0;

    const dataMax = Math.max(...validData.map((i) => i.currentGrowth));
    const dataMin = Math.min(...validData.map((i) => i.currentGrowth));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [chartData]);

  return {
    viewMode, setViewMode,
    resourceType, setResourceType,
    chartData,
    summary,
    isLoading,
    gradientOffset
  };
}