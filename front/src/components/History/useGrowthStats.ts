import { useState, useEffect, useMemo } from 'react';
import { getWeeklyStats, getWeeklyTrends, getMonthlyTrends } from '../../api/reports';
import type { WeeklyStatsResponse, WeeklyTrendResponse, MonthlyTrendResponse } from '../../api/reports';

// 백엔드 데이터 타입 (공통 필드 정의)
interface BaseStat {
  total_coins: number;
  total_cells: number;
  coin_growth: number;
  cell_growth: number;
  [key: string]: any; // date, week_start_date, month 등의 날짜 필드
}

export function useGrowthStats() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [resourceType, setResourceType] = useState<'coin' | 'cell'>('coin');
  
  // 기간 제한 상태
  const [dailyLimit, setDailyLimit] = useState<number>(7);
  const [weeklyLimit, setWeeklyLimit] = useState<number>(8);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(6);
  
  const [dailyData, setDailyData] = useState<WeeklyStatsResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyTrendResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrendResponse | null>(null);
  
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // 1. 데이터 페칭 로직 (Limit이 바뀔 때마다 재호출)
  useEffect(() => {
    if (viewMode === 'daily') {
        const fetchDaily = async () => {
            setDailyLoading(true);
            try {
                const res = await getWeeklyStats(dailyLimit);
                setDailyData(res);
            } catch (err) { console.error(err); } finally { setDailyLoading(false); }
        };
        fetchDaily();
    }
  }, [viewMode, dailyLimit]);

  useEffect(() => {
    if (viewMode === 'weekly') {
      const fetchWeekly = async () => {
        setWeeklyLoading(true);
        try {
          const res = await getWeeklyTrends(weeklyLimit);
          setWeeklyData(res);
        } catch (err) { console.error(err); } finally { setWeeklyLoading(false); }
      };
      fetchWeekly();
    }
  }, [viewMode, weeklyLimit]);

  useEffect(() => {
    if (viewMode === 'monthly') {
      const fetchMonthly = async () => {
        setMonthlyLoading(true);
        try {
          const res = await getMonthlyTrends(monthlyLimit);
          setMonthlyData(res);
        } catch (err) { console.error(err); } finally { setMonthlyLoading(false); }
      };
      fetchMonthly();
    }
  }, [viewMode, monthlyLimit]);

  const isLoading = viewMode === 'daily' ? dailyLoading 
                  : viewMode === 'weekly' ? weeklyLoading 
                  : monthlyLoading;

  // 2. 가공되지 않은 순수 데이터 선택
  const rawData: BaseStat[] = useMemo(() => {
    let sourceData: any[] = [];
    if (viewMode === 'daily' && dailyData) sourceData = dailyData.daily_stats;
    else if (viewMode === 'weekly' && weeklyData) sourceData = weeklyData.weekly_stats;
    else if (viewMode === 'monthly' && monthlyData) sourceData = monthlyData.monthly_stats;

    if (!sourceData || sourceData.length === 0) return [];

    // [수정] 앞부분의 연속된 0 데이터를 제거합니다. (계정 시작 전 기간 등)
    // 단, 데이터가 있는 시점 이후의 중간 0(미플레이일)은 유지합니다.
    const firstActiveIndex = sourceData.findIndex(d => 
      (d.total_coins || 0) > 0 || (d.total_cells || 0) > 0
    );

    // 데이터가 아예 없으면 빈 배열, 있으면 첫 데이터부터 끝까지 사용
    const validData = firstActiveIndex === -1 ? [] : sourceData.slice(firstActiveIndex);

    // 요청한 limit만큼 최신 데이터부터 잘라서 반환
    const limit = viewMode === 'daily' ? dailyLimit 
                : (viewMode === 'weekly' ? weeklyLimit 
                : monthlyLimit);

    return validData.slice(-limit);
  }, [viewMode, dailyData, weeklyData, monthlyData, dailyLimit, weeklyLimit, monthlyLimit]);

  // 3. 추세선 계산 (Linear Regression)
  const trendInfo = useMemo(() => {
    let dataForTrend = rawData;
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
      sumX += p.x; sumY += p.y;
      sumXY += p.x * p.y; sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }, [rawData, resourceType, viewMode]);

  // 4. 차트용 최종 데이터 매핑
  const chartData = useMemo(() => {
    return rawData.map((d, i) => {
      let displayDate = '';
      if (viewMode === 'daily') displayDate = d.date.substring(5).replace('-', '/');
      else if (viewMode === 'weekly') displayDate = `${d.week_start_date.substring(5).replace('-', '/')}~`;
      else if (viewMode === 'monthly') displayDate = d.month;

      const amount = resourceType === 'coin' ? d.total_coins : d.total_cells;
      const currentGrowth = resourceType === 'coin' ? d.coin_growth : d.cell_growth;
      
      let trendValue: number | null = Math.max(0, trendInfo.slope * i + trendInfo.intercept);
      const isLastMonthly = (viewMode === 'monthly' && i === rawData.length - 1);
      if (isLastMonthly) trendValue = null; 

      return {
        ...d,
        displayDate,
        currentGrowth: isLastMonthly ? null : currentGrowth, 
        amount,
        trendValue,
        isLastMonthly
      };
    });
  }, [rawData, viewMode, resourceType, trendInfo]);

  // 5. 통계 요약
  const summary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avgGrowth: 0, dailyAvg: 0 };
    const dataToSummarize = (viewMode === 'monthly' && chartData.length > 1) ? chartData.slice(0, -1) : chartData;
    const total = dataToSummarize.reduce((acc, cur) => acc + cur.amount, 0);
    const growthSum = dataToSummarize.reduce((acc, cur) => acc + (cur.currentGrowth || 0), 0);
    const len = dataToSummarize.length || 1;
    return { total, avgGrowth: growthSum / len, dailyAvg: total / len };
  }, [chartData, viewMode]);

  // 6. UI 오프셋
  const gradientOffset = useMemo(() => {
    const validData = chartData.filter(d => d.currentGrowth !== null);
    if (validData.length === 0) return 0;
    const dataMax = Math.max(...validData.map((i) => i.currentGrowth as number));
    const dataMin = Math.min(...validData.map((i) => i.currentGrowth as number));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [chartData]);

  return {
    viewMode, setViewMode,
    resourceType, setResourceType,
    dailyLimit, setDailyLimit,
    weeklyLimit, setWeeklyLimit,
    monthlyLimit, setMonthlyLimit,
    chartData, summary, isLoading, gradientOffset
  };
}
