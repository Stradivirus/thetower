// front/src/components/History/WeeklyStatsChart.tsx
import { useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { WeeklyStatsResponse } from '../../api/reports';
import { formatNumber } from '../../utils/format';
import { useGrowthStats } from './useGrowthStats'; 

interface Props {
  data: WeeklyStatsResponse | null;
  loading: boolean;
}

export default function WeeklyStatsChart({ data, loading }: Props) {
  const { 
    viewMode, setViewMode,
    resourceType, setResourceType,
    chartData,
    summary,
    isLoading,
    gradientOffset
  } = useGrowthStats(data, loading);

  const isCoin = resourceType === 'coin';

  // [설정] 색상 팔레트
  const COLORS = {
    coinBar: '#fbbf24', // Amber-400
    cellBar: '#22d3ee', // Cyan-400
    increase: '#ef4444',
    decrease: '#3b82f6',
    trendUp: '#4ade80',
    trendDown: '#3b82f6',
    trendFlat: '#94a3b8'
  };

  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;
  
  const currentTrendColor = useMemo(() => {
    if (summary.avgGrowth >= 1.0) return COLORS.trendUp;
    if (summary.avgGrowth <= -1.0) return COLORS.trendDown;
    return COLORS.trendFlat;
  }, [summary.avgGrowth]);

  // 로딩 상태
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
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentBarColor }}></div>
             
             {/* 범례: 동적 색상 적용 */}
             <span className="font-bold" style={{ color: currentBarColor }}>
               {isCoin ? "Coins Earned" : "Cells Earned"}
             </span>
             
             <div className="w-4 h-0.5 border-t-2 border-dashed ml-2" style={{ borderColor: currentTrendColor }}></div>
             <span style={{ color: currentTrendColor }} className="font-medium">Trend</span>
           </div>
           <div className="md:hidden flex items-center gap-2">
              <span className="text-slate-300 font-bold">Growth %</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
              </div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 bg-slate-950/50 p-3 md:px-3 md:py-1.5 rounded-xl md:rounded-full border border-slate-800 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start gap-1.5">
            <span className="text-slate-500">Total:</span>
            {/* 하단 수치: 동적 색상 적용 */}
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>
              {formatNumber(summary.total)}
            </span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">
                {viewMode === 'daily' ? 'Daily Avg:' : (viewMode === 'weekly' ? 'Weekly Avg:' : 'Monthly Avg:')}
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>
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
    // [Modified] relative 추가 (모바일 버튼 배치를 위해)
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-8 animate-fade-in shadow-xl text-slate-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        <div className="flex flex-col w-full md:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
                <h3 className="text-slate-300 text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-slate-400" /> 성장 분석
                </h3>
            </div>
            <div className="block mt-1">
               <span className="text-[11px] text-slate-500 font-medium">
                 * {viewMode === 'monthly' ? '최근 6개월 데이터 (진행 중 포함)' : '오늘 제외'}
               </span>
            </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
           {/* [Modified] 모바일: 우상단 절대 좌표(Top-Right), 데스크톱: 일반 배치(Static) */}
           <div className="absolute top-4 right-4 md:static md:inset-auto flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex-shrink-0">
              <button onClick={() => setResourceType('coin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isCoin ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <CircleDollarSign size={14} /> Coins
              </button>
              <button onClick={() => setResourceType('cell')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isCoin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <Zap size={14} /> Cells
              </button>
           </div>

           {/* 기간 선택 버튼 (모바일에서는 제목 아래에 남음) */}
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
                <stop offset={gradientOffset} stopColor={COLORS.increase} stopOpacity={1} />
                <stop offset={gradientOffset} stopColor={COLORS.decrease} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="displayDate" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} tickFormatter={(val) => formatNumber(val)} axisLine={false} tickLine={false} width={50} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }} 
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
              formatter={(value: any, name: string, props: any) => {
                if (viewMode === 'monthly' && props.payload.isCurrent) {
                    if (name === 'Trend') return [null, null];
                    return [
                        <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{formatNumber(value)} (진행 중)</span>, 
                        <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{isCoin ? 'Coins' : 'Cells'}</span>
                    ];
                }
                
                if (name === 'Growth %') {
                  const num = Number(value);
                  const color = num > 0 ? COLORS.increase : (num < 0 ? COLORS.decrease : '#94a3b8');
                  return [<span style={{ color }}>{value}%</span>, 'Growth Rate'];
                }
                
                if (name === 'Trend') {
                  return [<span style={{ color: currentTrendColor }}>{formatNumber(value)}</span>, 'Trend'];
                }
                
                return [
                    <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{formatNumber(value)}</span>, 
                    <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{isCoin ? 'Coins' : 'Cells'}</span>
                ];
              }}
            />
            
            <Legend content={renderCustomLegend} />
            
            <Bar yAxisId="left" dataKey="amount" name={isCoin ? "Coins Earned" : "Cells Earned"} barSize={viewMode === 'daily' ? 24 : 36} radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={currentBarColor} 
                        fillOpacity={(viewMode === 'monthly' && entry.isLastMonthly) ? 0.3 : 0.8}
                        stroke={(viewMode === 'monthly' && entry.isLastMonthly) ? currentBarColor : 'none'}
                        strokeDasharray={(viewMode === 'monthly' && entry.isLastMonthly) ? "4 4" : "0"}
                        strokeWidth={1}
                    />
                ))}
            </Bar>
            
            <Line 
              yAxisId="left" type="linear" dataKey="trendValue" name="Trend" 
              stroke={currentTrendColor} strokeDasharray="5 5" strokeOpacity={0.8} strokeWidth={2}
              dot={false} activeDot={false} isAnimationActive={false} connectNulls={false}
            />

            <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />
            <Line 
                yAxisId="right" type="monotone" dataKey="currentGrowth" name="Growth %" 
                stroke="url(#splitColor)" strokeWidth={3} connectNulls={false}
                dot={(props: any) => {
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