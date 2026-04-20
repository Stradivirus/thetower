/**
 * 파일명: thetower/front/src/components/History/WeeklyStatsChart.tsx
 * 용도: 사용자의 성장 지표(코인, 셀)를 차트로 시각화
 * 기능: 일간/주간/월간 뷰 전환, 자원 종류 전환, 성장률 및 추세선 표시, Recharts 활용
 */
import { useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw, CalendarDays, CalendarRange, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { useGrowthStats } from './useGrowthStats'; 
import { T } from '../../locales'; 

export default function WeeklyStatsChart() {
  const { 
    viewMode, setViewMode,
    resourceType, setResourceType,
    dailyLimit, setDailyLimit,
    weeklyLimit, setWeeklyLimit,
    monthlyLimit, setMonthlyLimit,
    chartData,
    summary,
    isLoading,
    gradientOffset
  } = useGrowthStats();

  const Text = T.history.CHART;
  const isCoin = resourceType === 'coin';

  // 차트 색상 테마
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
  const currentTrendColor = useMemo(() => {
    if (summary.avgGrowth >= 1.0) return COLORS.trendUp;
    if (summary.avgGrowth <= -1.0) return COLORS.trendDown;
    return COLORS.trendFlat;
  }, [summary.avgGrowth]);

  const renderLimitSelector = () => {
    const limits = viewMode === 'daily' ? [7, 10, 14] : (viewMode === 'weekly' ? [8, 12, 16] : [6, 9, 12]);
    const currentLimit = viewMode === 'daily' ? dailyLimit : (viewMode === 'weekly' ? weeklyLimit : monthlyLimit);
    const setLimit = viewMode === 'daily' ? setDailyLimit : (viewMode === 'weekly' ? setWeeklyLimit : setMonthlyLimit);
    const suffix = viewMode === 'daily' ? 'd' : (viewMode === 'weekly' ? 'w' : 'm');

    return (
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full">
        {limits.map(l => (
          <button 
            key={l}
            onClick={() => setLimit(l)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${currentLimit === l ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {viewMode === 'monthly' && l === 12 ? '1y' : `${l}${suffix}`}
          </button>
        ))}
      </div>
    );
  };

  const renderCustomLegend = () => {
    const isPositive = summary.avgGrowth >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-400' : 'text-blue-400';

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between px-2 mt-4 border-t border-slate-800/50 pt-3 text-xs gap-3 md:gap-0">
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: currentBarColor }}></div>
             <span className="font-bold" style={{ color: currentBarColor }}>{isCoin ? Text.LEGEND_COIN : Text.LEGEND_CELL}</span>
             <div className="w-4 h-0.5 border-t-2 border-dashed ml-2" style={{ borderColor: currentTrendColor }}></div>
             <span style={{ color: currentTrendColor }} className="font-medium">{Text.LEGEND_TREND}</span>
           </div>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 bg-slate-950/50 p-3 md:px-3 md:py-1.5 rounded-xl md:rounded-full border border-slate-800 w-full md:w-auto">
          <div className="flex items-center justify-between md:justify-start gap-1.5">
            <span className="text-slate-500">{Text.LABEL_TOTAL}</span>
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>{formatNumber(summary.total)}</span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">{viewMode === 'daily' ? Text.LABEL_AVG_DAILY : (viewMode === 'weekly' ? Text.LABEL_AVG_WEEKLY : Text.LABEL_AVG_MONTHLY)}</span>
            <span className="font-mono font-bold text-sm" style={{ color: currentBarColor }}>{formatNumber(summary.dailyAvg)}</span>
          </div>
          <div className="hidden md:block w-px h-3 bg-slate-700"></div> 
          <div className="flex items-center justify-between md:justify-start gap-1.5 border-t border-slate-800/50 pt-2 md:border-none md:pt-0">
            <span className="text-slate-500">{Text.LABEL_AVG_GROWTH}</span>
            <span className={`font-mono font-bold text-sm flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon size={12} />{Math.abs(summary.avgGrowth).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && chartData.length === 0) {
    return (
      <div className="h-[380px] bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-8 animate-pulse">
        <RefreshCw className="animate-spin mr-2" size={20} /> {Text.LOADING}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 mb-8 animate-fade-in shadow-xl text-slate-300 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col w-full md:w-auto">
            <div className="flex justify-between items-center w-full md:w-auto gap-4">
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
        
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
           {/* 리소스 전환 (Coin/Cell) - 2행 구조 */}
           <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 min-w-[100px]">
                <button onClick={() => setResourceType('coin')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isCoin ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                  <CircleDollarSign size={14} /> Coins
                </button>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 min-w-[100px]">
                <button onClick={() => setResourceType('cell')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!isCoin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
                  <Zap size={14} /> Cells
                </button>
              </div>
           </div>

           {/* 뷰 모드 및 기간 선택 통합 컨트롤러 - 2행 구조 */}
           <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 h-fit">
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
              
              {/* 기간 선택 버튼 (ViewMode 버튼 아래에 같은 크기로 배치) */}
              {renderLimitSelector()}
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
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} tickFormatter={(val) => val <= 0 ? '0' : formatNumber(val)} axisLine={false} tickLine={false} width={50} domain={[0, 'auto']} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }} 
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
              formatter={(value: any, name: string, props: any) => {
                if (viewMode === 'monthly' && props.payload.isCurrent) return [<span>{formatNumber(value)} {Text.SUFFIX_ONGOING}</span>, isCoin ? 'Coins' : 'Cells'];
                if (name === 'Growth %') return [<span style={{ color: Number(value) > 0 ? COLORS.increase : COLORS.decrease }}>{value}%</span>, Text.LEGEND_GROWTH];
                return [<span>{formatNumber(value)}</span>, isCoin ? 'Coins' : 'Cells'];
              }}
            />
            <Legend content={renderCustomLegend} />
            <Bar yAxisId="left" dataKey="amount" barSize={viewMode === 'daily' ? (dailyLimit > 10 ? 16 : 24) : 32} radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={currentBarColor} 
                        fillOpacity={entry.isLastMonthly ? 0.3 : 0.8}
                        stroke={entry.isLastMonthly ? currentBarColor : 'none'}
                        strokeDasharray={entry.isLastMonthly ? "4 4" : "0"}
                    />
                ))}
            </Bar>
            <Line yAxisId="left" type="linear" dataKey="trendValue" stroke={currentTrendColor} strokeDasharray="5 5" strokeWidth={2} dot={false} tooltipType="none" />
            <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />
            <Line yAxisId="right" type="monotone" dataKey="currentGrowth" name="Growth %" stroke="url(#splitColor)" strokeWidth={3} dot={(props: any) => props.payload.isLastMonthly ? <></> : <circle cx={props.cx} cy={props.cy} r={4} fill="#0f172a" stroke="#64748b" strokeWidth={2} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
