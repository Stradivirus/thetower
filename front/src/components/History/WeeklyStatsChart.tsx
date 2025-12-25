import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange } from 'lucide-react';
import { getWeeklyTrends } from '../../api/reports';
import type { WeeklyStatsResponse, WeeklyTrendResponse } from '../../api/reports';
import GrowthTrendChart from './GrowthTrendChart';

interface Props {
  data: WeeklyStatsResponse | null;
  loading: boolean;
}

export default function WeeklyStatsChart({ data: dailyData, loading: dailyLoading }: Props) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [resourceType, setResourceType] = useState<'coin' | 'cell'>('coin');
  
  const [weeklyData, setWeeklyData] = useState<WeeklyTrendResponse | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

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
  }, [viewMode, weeklyData]);

  const isLoading = viewMode === 'daily' ? dailyLoading : weeklyLoading;

  // 1. 원본 데이터 준비
  const rawData: any[] = useMemo(() => {
    if (viewMode === 'daily' && dailyData) {
      return dailyData.daily_stats;
    } else if (viewMode === 'weekly' && weeklyData) {
      return weeklyData.weekly_stats;
    }
    return [];
  }, [viewMode, dailyData, weeklyData]);

  // 2. 유효 데이터 필터링 및 [최근 N개 제한]
  const effectiveData = useMemo(() => {
    if (rawData.length === 0) return [];

    // 1) 0보다 큰 데이터가 시작되는 지점 찾기 (앞부분 빈 공간 제거)
    const firstIndex = rawData.findIndex(d => {
      const val = resourceType === 'coin' ? d.total_coins : d.total_cells;
      return val > 0;
    });
    
    // 데이터가 없으면 원본 그대로, 있으면 유효한 구간만 자름
    const validData = firstIndex === -1 ? rawData : rawData.slice(firstIndex);

    // 2) 화면 모드에 따라 최대 개수 제한 (일간 7개, 주간 8개)
    const limit = viewMode === 'daily' ? 7 : 8;
    
    // 배열의 뒤에서부터 limit 개수만큼만 가져옴
    return validData.slice(-limit); 
  }, [rawData, resourceType, viewMode]);

  // 3. 추세(Trend) 정보 계산 (effectiveData 기준)
  const trendInfo = useMemo(() => {
    const n = effectiveData.length;
    if (n <= 1) return { slope: 0, intercept: 0 };

    const points = effectiveData.map((d, i) => ({
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
  }, [effectiveData, resourceType]);

  // 4. 차트용 데이터 매핑
  const chartData = useMemo(() => {
    return effectiveData.map((d, i) => {
      const displayDate = viewMode === 'daily' 
        ? d.date.substring(5).replace('-', '/') 
        : `${d.week_start_date.substring(5).replace('-', '/')}~`;
      
      const currentGrowth = resourceType === 'coin' ? d.coin_growth : d.cell_growth;
      const amount = resourceType === 'coin' ? d.total_coins : d.total_cells;
      
      // 추세선 값 계산 (y = ax + b)
      const trendValue = trendInfo.slope * i + trendInfo.intercept;

      return {
        ...d,
        displayDate,
        currentGrowth,
        amount,
        trendValue
      };
    });
  }, [effectiveData, viewMode, resourceType, trendInfo]);

  // 5. 통계 요약 계산
  const summary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avgGrowth: 0, dailyAvg: 0 };
    
    const total = chartData.reduce((acc, cur) => acc + cur.amount, 0);
    const growthSum = chartData.reduce((acc, cur) => acc + cur.currentGrowth, 0);
    const avgGrowth = growthSum / chartData.length;
    const dailyAvg = total / chartData.length;

    return { total, avgGrowth, dailyAvg };
  }, [chartData]);

  const isCoin = resourceType === 'coin';

  if (isLoading && chartData.length === 0) {
    return (
      <div className="h-[380px] bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-8 animate-pulse">
        <RefreshCw className="animate-spin mr-2" size={20} /> 데이터 분석 중...
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 animate-fade-in shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h3 className="text-slate-300 text-lg font-bold flex items-center gap-2">
              <BarChart3 size={20} className="text-slate-400" /> 성장 분석
            </h3>
            <span className="text-[11px] text-slate-500 font-medium ml-7">
              * 오늘을 제외한 {viewMode === 'daily' ? '최근 7일' : '최근 8주'} 데이터 (어제 기준)
            </span>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 h-fit self-start mt-1">
             <button onClick={() => setViewMode('daily')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'daily' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarDays size={14} /> 일간
             </button>
             <button onClick={() => setViewMode('weekly')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarRange size={14} /> 주간
             </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
          <button onClick={() => setResourceType('coin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isCoin ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
            <CircleDollarSign size={14} /> Coins
          </button>
          <button onClick={() => setResourceType('cell')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isCoin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
            <Zap size={14} /> Cells
          </button>
        </div>
      </div>

      {/* 분리된 그래프 컴포넌트 렌더링 */}
      <GrowthTrendChart 
        data={chartData} 
        summary={summary} 
        viewMode={viewMode} 
        resourceType={resourceType} 
      />
    </div>
  );
}