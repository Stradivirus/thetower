import { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange, TrendingUp, TrendingDown } from 'lucide-react';
import { getWeeklyTrends } from '../../api/reports';
import type { WeeklyStatsResponse, WeeklyTrendResponse } from '../../api/reports';
import { formatNumber } from '../../utils/format';

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

  // [수정 1] 데이터 가공 시 선형 회귀(Linear Regression)로 추세선 계산
  const chartData = useMemo(() => {
    let rawData: any[] = [];
    if (viewMode === 'daily' && dailyData) {
      rawData = dailyData.daily_stats;
    } else if (viewMode === 'weekly' && weeklyData) {
      rawData = weeklyData.weekly_stats;
    }

    // 1. 기본 데이터 매핑
    const mappedData = rawData.map(d => ({
      ...d,
      displayDate: viewMode === 'daily' 
        ? d.date.substring(5).replace('-', '/') 
        : `${d.week_start_date.substring(5).replace('-', '/')}~`,
      currentGrowth: resourceType === 'coin' ? d.coin_growth : d.cell_growth,
      amount: resourceType === 'coin' ? d.total_coins : d.total_cells
    }));

    // 2. 추세선(Trend Line) 계산 (최소자승법)
    const n = mappedData.length;
    if (n > 1) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      mappedData.forEach((d, i) => {
        const x = i;          // X축: 인덱스 (0, 1, 2...)
        const y = d.amount;   // Y축: 획득량
        
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      });

      // 기울기(slope)와 절편(intercept) 공식
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return mappedData.map((d, i) => ({
        ...d,
        trendValue: slope * i + intercept // y = ax + b
      }));
    }

    return mappedData;
  }, [viewMode, dailyData, weeklyData, resourceType]);

  const summary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, avgGrowth: 0, dailyAvg: 0 };
    
    const total = chartData.reduce((acc, cur) => acc + cur.amount, 0);
    const growthSum = chartData.reduce((acc, cur) => acc + cur.currentGrowth, 0);
    const avgGrowth = growthSum / chartData.length;
    const dailyAvg = total / chartData.length;

    return { total, avgGrowth, dailyAvg };
  }, [chartData]);

  const COLORS = {
    coinBar: '#fbbf24',
    cellBar: '#22d3ee',
    increase: '#ef4444',
    decrease: '#3b82f6',
    trend: '#94a3b8', // 추세선 색상 (Slate-400)
  };

  const isCoin = resourceType === 'coin';
  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;

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
      <div className="flex items-center justify-between px-2 mt-4 border-t border-slate-800/50 pt-3 text-xs">
        {/* Left */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentBarColor }}></div>
          <span className="text-slate-300 font-bold">
            {isCoin ? "Coins Earned" : "Cells Earned"}
          </span>
          {/* Legend에 추세선 설명 추가 (선택 사항) */}
          <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 ml-2"></div>
          <span className="text-slate-400 font-medium">Trend</span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-4 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Total:</span>
            <span className={`font-mono font-bold text-sm ${isCoin ? 'text-yellow-500' : 'text-cyan-500'}`}>
              {formatNumber(summary.total)}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{viewMode === 'daily' ? 'Daily Avg:' : 'Weekly Avg:'}</span>
            <span className={`font-mono font-bold text-sm ${isCoin ? 'text-yellow-500' : 'text-cyan-500'}`}>
              {formatNumber(summary.dailyAvg)}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Avg Growth:</span>
            <span className={`font-mono font-bold text-sm flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon size={12} />
              {Math.abs(summary.avgGrowth).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-bold">Growth %</span>
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
          </div>
        </div>
      </div>
    );
  };

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
              formatter={(value: any, name: string) => {
                if (name === 'Growth %') {
                  const num = Number(value);
                  const color = num > 0 ? COLORS.increase : (num < 0 ? COLORS.decrease : '#94a3b8');
                  return [<span style={{ color }}>{value}%</span>, 'Growth Rate'];
                }
                if (name === 'Trend') {
                  return [formatNumber(value), 'Trend'];
                }
                return [formatNumber(value), isCoin ? 'Coins' : 'Cells'];
              }}
            />
            <Legend content={renderCustomLegend} />
            
            {/* 막대 그래프 */}
            <Bar yAxisId="left" dataKey="amount" name={isCoin ? "Coins Earned" : "Cells Earned"} barSize={viewMode === 'daily' ? 24 : 36} radius={[6, 6, 0, 0]} fill={currentBarColor} fillOpacity={0.8} />
            
            {/* [수정 2] 추세선 (Trend Line) 추가 */}
            <Line 
              yAxisId="left"
              type="linear"
              dataKey="trendValue" 
              name="Trend" 
              stroke={COLORS.trend} 
              strokeDasharray="5 5" 
              strokeOpacity={0.5} 
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />
            <Line yAxisId="right" type="monotone" dataKey="currentGrowth" name="Growth %" stroke="url(#splitColor)" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#64748b' }} activeDot={{ r: 6 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}