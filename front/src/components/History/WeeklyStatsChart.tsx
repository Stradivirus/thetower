import { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { getWeeklyTrends, getMonthlyTrends } from '../../api/reports';
import type { WeeklyStatsResponse, WeeklyTrendResponse, MonthlyTrendResponse } from '../../api/reports';
import { formatNumber } from '../../utils/format';

interface Props {
  data: WeeklyStatsResponse | null;
  loading: boolean;
}

export default function WeeklyStatsChart({ data: dailyData, loading: dailyLoading }: Props) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [resourceType, setResourceType] = useState<'coin' | 'cell'>('coin');
  
  const [weeklyData, setWeeklyData] = useState<WeeklyTrendResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyTrendResponse | null>(null);
  
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

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

  // 로직 통합: [원본 선택] -> [어제 기준 필터] -> [0 시작점 제거] -> [최근 N개]
  const rawData: any[] = useMemo(() => {
    let sourceData: any[] = [];

    // 1. 소스 데이터 선택
    if (viewMode === 'daily' && dailyData) {
      sourceData = dailyData.daily_stats;
    } else if (viewMode === 'weekly' && weeklyData) {
      sourceData = weeklyData.weekly_stats;
    } else if (viewMode === 'monthly' && monthlyData) {
      sourceData = monthlyData.monthly_stats;
    }

    if (sourceData.length === 0) return [];

    // 2. 오늘 날짜 구하기 (로컬 시간 기준 YYYY-MM-DD)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 3. 필터링
    // 일간/주간: 어제까지 데이터만 사용 (오늘 데이터 제외)
    // 월간: 백엔드에서 이미 처리해서 주므로 전체 사용 (진행 중인 달 포함)
    let dateFiltered = sourceData;
    if (viewMode === 'daily') {
      dateFiltered = sourceData.filter(d => d.date < todayStr);
    } else if (viewMode === 'weekly') {
      dateFiltered = sourceData.filter(d => d.week_start_date < todayStr);
    }

    if (dateFiltered.length === 0) return [];

    // 4. "0 데이터" 앞부분 제거
    const firstIndex = dateFiltered.findIndex(d => {
      const val = resourceType === 'coin' ? d.total_coins : d.total_cells;
      return val > 0;
    });

    const validData = firstIndex === -1 ? dateFiltered : dateFiltered.slice(firstIndex);

    // 5. 최근 N개 자르기 (일간 7, 주간 8, 월간 6)
    const limit = viewMode === 'daily' ? 7 : (viewMode === 'weekly' ? 8 : 6);

    return validData.slice(-limit);
  }, [viewMode, dailyData, weeklyData, monthlyData, resourceType]);

  const trendInfo = useMemo(() => {
    // 월간 모드일 때는 '이번 달(맨 마지막)'을 추세선 계산에서 뺍니다.
    // (진행 중인 데이터가 추세를 망가뜨리지 않게 하기 위함)
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
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }, [rawData, resourceType, viewMode]);

  const chartData = useMemo(() => {
    return rawData.map((d, i) => {
      let displayDate = '';
      if (viewMode === 'daily') displayDate = d.date.substring(5).replace('-', '/');
      else if (viewMode === 'weekly') displayDate = `${d.week_start_date.substring(5).replace('-', '/')}~`;
      else if (viewMode === 'monthly') displayDate = d.month; // "2024-12"

      const amount = resourceType === 'coin' ? d.total_coins : d.total_cells;
      const currentGrowth = resourceType === 'coin' ? d.coin_growth : d.cell_growth;
      
      // 추세선 값 계산
      let trendValue: number | null = trendInfo.slope * i + trendInfo.intercept;
      
      // [월간] 마지막 데이터(진행 중)는 추세선 끊기
      const isLastMonthly = (viewMode === 'monthly' && i === rawData.length - 1);
      if (isLastMonthly) {
          trendValue = null; 
      }

      return {
        ...d,
        displayDate,
        currentGrowth,
        amount,
        trendValue,
        isCurrent: d.is_current, // 백엔드에서 받은 플래그
        isLastMonthly
      };
    });
  }, [rawData, viewMode, resourceType, trendInfo]);

  const summary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avgGrowth: 0, dailyAvg: 0 };
    
    // 월간 통계에서는 '진행 중인 이번 달'을 평균 성장률 계산 등에서 제외
    const dataToSummarize = (viewMode === 'monthly' && chartData.length > 1) 
                          ? chartData.slice(0, -1) 
                          : chartData;

    const total = dataToSummarize.reduce((acc, cur) => acc + cur.amount, 0);
    const growthSum = dataToSummarize.reduce((acc, cur) => acc + cur.currentGrowth, 0);
    const len = dataToSummarize.length || 1;
    
    const avgGrowth = growthSum / len;
    const dailyAvg = total / len;

    return { total, avgGrowth, dailyAvg };
  }, [chartData, viewMode]);

  const COLORS = {
    coinBar: '#fbbf24',
    cellBar: '#22d3ee',
    increase: '#ef4444',
    decrease: '#3b82f6',
    trendUp: '#4ade80',
    trendDown: '#3b82f6',
    trendFlat: '#94a3b8'
  };

  const isCoin = resourceType === 'coin';
  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;
  
  const currentTrendColor = useMemo(() => {
    if (summary.avgGrowth >= 1.0) {
      return COLORS.trendUp;
    } else if (summary.avgGrowth <= -1.0) {
      return COLORS.trendDown;
    }
    return COLORS.trendFlat;
  }, [summary.avgGrowth]);

  const gradientOffset = () => {
    if (chartData.length === 0) return 0;
    const dataMax = Math.max(...chartData.map((i) => i.currentGrowth));
    const dataMin = Math.min(...chartData.map((i) => i.currentGrowth));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  if (isLoading && chartData.length === 0) {
    return (
      <div className="h-[380px] bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-8 animate-pulse">
        <RefreshCw className="animate-spin mr-2" size={20} /> 데이터 분석 중...
      </div>
    );
  }

  const renderCustomLegend = () => {
    const isPositive = summary.avgGrowth >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-400' : 'text-blue-400';

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between px-2 mt-4 border-t border-slate-800/50 pt-3 text-xs gap-3 md:gap-0">
        {/* Left: 범례 */}
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentBarColor }}></div>
             <span className="text-slate-300 font-bold">
               {isCoin ? "Coins Earned" : "Cells Earned"}
             </span>
             <div className="w-4 h-0.5 border-t-2 border-dashed ml-2" style={{ borderColor: currentTrendColor }}></div>
             <span style={{ color: currentTrendColor }} className="font-medium">Trend</span>
           </div>

           {/* 모바일 Growth 범례 */}
           <div className="md:hidden flex items-center gap-2">
              <span className="text-slate-300 font-bold">Growth %</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
              </div>
           </div>
        </div>

        {/* Center: 통계 정보 */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 bg-slate-950/50 p-3 md:px-3 md:py-1.5 rounded-xl md:rounded-full border border-slate-800 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start gap-1.5">
            <span className="text-slate-500">Total:</span>
            <span className={`font-mono font-bold text-sm ${isCoin ? 'text-yellow-500' : 'text-cyan-500'}`}>
              {formatNumber(summary.total)}
            </span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">
                {viewMode === 'daily' ? 'Daily Avg:' : (viewMode === 'weekly' ? 'Weekly Avg:' : 'Monthly Avg:')}
            </span>
            <span className={`font-mono font-bold text-sm ${isCoin ? 'text-yellow-500' : 'text-cyan-500'}`}>
              {formatNumber(summary.dailyAvg)}
            </span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">Avg Growth:</span>
            <span className={`font-mono font-bold text-sm flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon size={12} />
              {Math.abs(summary.avgGrowth).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right: Growth 범례 (데스크톱) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-slate-300 font-bold">Growth %</span>
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-8 animate-fade-in shadow-xl">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        {/* 타이틀 및 설명 */}
        <div className="flex flex-col w-full md:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
                <h3 className="text-slate-300 text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-slate-400" /> 성장 분석
                </h3>
            </div>
            <div className="block mt-1">
               <span className="text-[11px] text-slate-500 font-medium">
                  * {viewMode === 'monthly' ? '최근 6개월 데이터 (진행 중 포함)' : '완료된 데이터 기준'}
               </span>
            </div>
        </div>
        
        {/* 컨트롤 버튼 그룹 */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
           {/* 코인/셀 버튼 */}
           <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex-shrink-0">
              <button onClick={() => setResourceType('coin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isCoin ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <CircleDollarSign size={14} /> Coins
              </button>
              <button onClick={() => setResourceType('cell')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isCoin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <Zap size={14} /> Cells
              </button>
           </div>

           {/* 기간 선택 버튼 (월간 추가됨) */}
           <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 h-fit flex-shrink-0">
             <button onClick={() => setViewMode('daily')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'daily' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarDays size={14} /> 일간
             </button>
             <button onClick={() => setViewMode('weekly')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarRange size={14} /> 주간
             </button>
             <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <Calendar size={14} /> 월간
             </button>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor={COLORS.increase} stopOpacity={1} />
                <stop offset={off} stopColor={COLORS.decrease} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="displayDate" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} tickFormatter={(val) => formatNumber(val)} axisLine={false} tickLine={false} width={50} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
              formatter={(value: any, name: string, props: any) => {
                // [Tooltip] 이번 달 데이터일 경우 표시 변경
                if (viewMode === 'monthly' && props.payload.isCurrent) {
                    if (name === 'Trend') return [null, null]; // 추세선 숨김
                    return [`${formatNumber(value)} (진행 중)`, isCoin ? 'Coins' : 'Cells'];
                }

                if (name === 'Growth %') {
                  const num = Number(value);
                  const color = num > 0 ? COLORS.increase : (num < 0 ? COLORS.decrease : '#94a3b8');
                  return [<span style={{ color }}>{value}%</span>, 'Growth Rate'];
                }
                if (name === 'Trend') {
                  return [<span style={{ color: currentTrendColor }}>{formatNumber(value)}</span>, 'Trend'];
                }
                return [formatNumber(value), isCoin ? 'Coins' : 'Cells'];
              }}
            />
            <Legend content={renderCustomLegend} />
            
            {/* [Bar Chart] Cell을 이용해 마지막 막대(이번 달) 스타일 변경 */}
            <Bar yAxisId="left" dataKey="amount" name={isCoin ? "Coins Earned" : "Cells Earned"} barSize={viewMode === 'daily' ? 24 : 36} radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={currentBarColor} 
                        // 월간이고 마지막 데이터면 투명도 0.3
                        fillOpacity={(viewMode === 'monthly' && entry.isLastMonthly) ? 0.3 : 0.8}
                        // 월간이고 마지막 데이터면 테두리 점선
                        stroke={(viewMode === 'monthly' && entry.isLastMonthly) ? currentBarColor : 'none'}
                        strokeDasharray={(viewMode === 'monthly' && entry.isLastMonthly) ? "4 4" : "0"}
                        strokeWidth={1}
                    />
                ))}
            </Bar>
            
            {/* [Trend Line] connectNulls={false}로 설정하여 중간에 끊기게 함 */}
            <Line 
              yAxisId="left"
              type="linear"
              dataKey="trendValue" 
              name="Trend" 
              stroke={currentTrendColor} 
              strokeDasharray="5 5" 
              strokeOpacity={0.8} 
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* [Growth Line] 마지막 점(진행 중인 달)은 그리지 않음 */}
            <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />
            <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="currentGrowth" 
                name="Growth %" 
                stroke="url(#splitColor)" 
                strokeWidth={3} 
                connectNulls={false}
                dot={(props: any) => {
                    // 월간이고 마지막 점이면 숨김
                    if (viewMode === 'monthly' && props.payload.isLastMonthly) return <></>;
                    return <circle cx={props.cx} cy={props.cy} r={4} fill="#0f172a" stroke="#64748b" strokeWidth={2} />;
                }}
                activeDot={{ r: 6 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}