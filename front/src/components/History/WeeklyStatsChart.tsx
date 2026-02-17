/**
 * 파일명: thetower/front/src/components/History/WeeklyStatsChart.tsx
 * 용도: 사용자의 성장 지표(코인, 셀)를 차트로 시각화
 * 기능: 일간/주간/월간 뷰 전환, 자원 종류 전환, 성장률 및 추세선 표시, Recharts 라이브러리 활용
 */
import { useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { WeeklyStatsResponse } from '../../api/reports';
import { formatNumber } from '../../utils/format';
import { useGrowthStats } from './useGrowthStats'; 
import { T } from '../../locales'; 

interface Props {
  data: WeeklyStatsResponse | null; // 서버에서 받은 통계 데이터
  loading: boolean;                 // 로딩 상태
}

export default function WeeklyStatsChart({ data, loading }: Props) {
  // 성장 통계 계산 및 상태 관리를 위한 커스텀 훅 사용
  const { 
    viewMode, setViewMode,
    resourceType, setResourceType,
    chartData,
    summary,
    isLoading,
    gradientOffset
  } = useGrowthStats(data, loading);

  const Text = T.history.CHART;
  const isCoin = resourceType === 'coin';

  // 차트 색상 테마 정의
  const COLORS = {
    coinBar: '#fbbf24',
    cellBar: '#22d3ee',
    increase: '#ef4444',
    decrease: '#3b82f6',
    trendUp: '#4ade80',
    trendDown: '#3b82f6',
    trendFlat: '#94a3b8'
  };

  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;
  
  // 현재 성과에 따른 추세선 색상 결정
  const currentTrendColor = useMemo(() => {
    if (summary.avgGrowth >= 1.0) return COLORS.trendUp;
    if (summary.avgGrowth <= -1.0) return COLORS.trendDown;
    return COLORS.trendFlat;
  }, [summary.avgGrowth]);

  if (isLoading && chartData.length === 0) {
    return (
      <div className="h-[380px] bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-8 animate-pulse">
        <RefreshCw className="animate-spin mr-2" size={20} /> {Text.LOADING}
      </div>
    );
  }

  /** 
   * 차트 하단 범례(Legend) 커스텀 렌더링
   * - 총합, 평균, 성장률 등의 요약 정보를 함께 표시
   */
  const renderCustomLegend = () => {
    const isPositive = summary.avgGrowth >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-400' : 'text-blue-400';

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between px-2 mt-4 border-t border-slate-800/50 pt-3 text-xs gap-3 md:gap-0">
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentBarColor }}></div>
             
             <span className="font-bold" style={{ color: currentBarColor }}>
               {isCoin ? Text.LEGEND_COIN : Text.LEGEND_CELL}
             </span>
             
             <div className="w-4 h-0.5 border-t-2 border-dashed ml-2" style={{ borderColor: currentTrendColor }}></div>
             <span style={{ color: currentTrendColor }} className="font-medium">{Text.LEGEND_TREND}</span>
           </div>
           <div className="md:hidden flex items-center gap-2">
              <span className="text-slate-300 font-bold">{Text.LEGEND_GROWTH}</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
              </div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 bg-slate-950/50 p-3 md:px-3 md:py-1.5 rounded-xl md:rounded-full border border-slate-800 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start gap-1.5">
            <span className="text-slate-500">{Text.LABEL_TOTAL}</span>
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>
              {formatNumber(summary.total)}
            </span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">
                {viewMode === 'daily' ? Text.LABEL_AVG_DAILY : (viewMode === 'weekly' ? Text.LABEL_AVG_WEEKLY : Text.LABEL_AVG_MONTHLY)}
            </span>
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>
              {formatNumber(summary.dailyAvg)}
            </span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">{Text.LABEL_AVG_GROWTH}</span>
            <span className={`font-mono font-bold text-sm flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon size={12} />
              {Math.abs(summary.avgGrowth).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-slate-300 font-bold">{Text.LEGEND_GROWTH}</span>
          <div className="w-8 h-0.5 bg-gradient-to-r from-red-500 to-blue-500 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border-2 border-slate-500"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-8 animate-fade-in shadow-xl text-slate-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        {/* 타이틀 및 서브텍스트 */}
        <div className="flex flex-col w-full md:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto">
                <h3 className="text-slate-300 text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-slate-400" /> {Text.TITLE}
                </h3>
            </div>
            <div className="block mt-1">
               <span className="text-[11px] text-slate-500 font-medium">
                 {viewMode === 'monthly' ? Text.SUB_MONTHLY : Text.SUB_DEFAULT}
               </span>
            </div>
        </div>
        
        {/* 컨트롤러: 리소스 전환 및 기간 전환 */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
           <div className="absolute top-4 right-4 md:static md:inset-auto flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 flex-shrink-0">
              <button onClick={() => setResourceType('coin')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isCoin ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <CircleDollarSign size={14} /> Coins
              </button>
              <button onClick={() => setResourceType('cell')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isCoin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                <Zap size={14} /> Cells
              </button>
           </div>

           <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 h-fit flex-shrink-0">
             <button onClick={() => setViewMode('daily')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'daily' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarDays size={14} /> {Text.TAB_DAILY}
             </button>
             <button onClick={() => setViewMode('weekly')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <CalendarRange size={14} /> {Text.TAB_WEEKLY}
             </button>
             <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'monthly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
               <Calendar size={14} /> {Text.TAB_MONTHLY}
             </button>
          </div>
        </div>
      </div>

      {/* 차트 렌더링 영역 */}
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
            
            <YAxis 
                yAxisId="left" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                tickFormatter={(val) => val <= 0 ? '0' : formatNumber(val)} 
                axisLine={false} 
                tickLine={false} 
                width={50}
                domain={[0, 'auto']} 
            />
            
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }} 
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
              itemSorter={(item) => (item.name === 'Growth %' ? 1 : -1)} 
              formatter={(value: any, name: string, props: any) => {
                if (viewMode === 'monthly' && props.payload.isCurrent) {
                    return [
                        <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{formatNumber(value)} {Text.SUFFIX_ONGOING}</span>, 
                        <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{isCoin ? 'Coins' : 'Cells'}</span>
                    ];
                }
                
                if (name === 'Growth %') {
                  const num = Number(value);
                  const color = num > 0 ? COLORS.increase : (num < 0 ? COLORS.decrease : '#94a3b8');
                  return [<span style={{ color }}>{value}%</span>, Text.LEGEND_GROWTH];
                }
                
                return [
                    <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{formatNumber(value)}</span>, 
                    <span style={{ color: currentBarColor, fontWeight: 'bold' }}>{isCoin ? 'Coins' : 'Cells'}</span>
                ];
              }}
            />
            
            <Legend content={renderCustomLegend} />
            
            {/* 막대 차트 (자원량) */}
            <Bar yAxisId="left" dataKey="amount" name={isCoin ? Text.LEGEND_COIN : Text.LEGEND_CELL} barSize={viewMode === 'daily' ? 24 : 36} radius={[6, 6, 0, 0]}>
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
            
            {/* 선 차트 (선형 추세선) */}
            <Line 
              yAxisId="left" type="linear" dataKey="trendValue" name="Trend" 
              stroke={currentTrendColor} strokeDasharray="5 5" strokeOpacity={0.8} strokeWidth={2}
              dot={false} activeDot={false} isAnimationActive={false} connectNulls={false}
              tooltipType="none" 
            />

            {/* 선 차트 (성장률) */}
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