import { useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../../utils/format';

interface Props {
  data: any[]; // 차트용 데이터
  summary: { total: number; avgGrowth: number; dailyAvg: number }; // 요약 통계
  viewMode: 'daily' | 'weekly';
  resourceType: 'coin' | 'cell';
}

export default function GrowthTrendChart({ data, summary, viewMode, resourceType }: Props) {
  const isCoin = resourceType === 'coin';

  // 색상 팔레트 정의
  const COLORS = {
    coinBar: '#fbbf24',
    cellBar: '#22d3ee',
    increase: '#ef4444',
    decrease: '#3b82f6',
    trendUp: '#4ade80',   // Green
    trendDown: '#3b82f6', // Blue
    trendFlat: '#94a3b8'  // Gray
  };

  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;

  // 추세선 색상 결정 로직 (1% 기준)
  const currentTrendColor = useMemo(() => {
    if (summary.avgGrowth >= 1.0) return COLORS.trendUp;
    if (summary.avgGrowth <= -1.0) return COLORS.trendDown;
    return COLORS.trendFlat;
  }, [summary.avgGrowth]);

  const gradientOffset = () => {
    if (data.length === 0) return 0;
    const dataMax = Math.max(...data.map((i) => i.currentGrowth));
    const dataMin = Math.min(...data.map((i) => i.currentGrowth));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

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
          <div className="w-4 h-0.5 border-t-2 border-dashed ml-2" style={{ borderColor: currentTrendColor }}></div>
          <span style={{ color: currentTrendColor }} className="font-medium">Trend</span>
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
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
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
                return [<span style={{ color: currentTrendColor }}>{formatNumber(value)}</span>, 'Trend'];
              }
              return [formatNumber(value), isCoin ? 'Coins' : 'Cells'];
            }}
          />
          <Legend content={renderCustomLegend} />
          
          <Bar yAxisId="left" dataKey="amount" name={isCoin ? "Coins Earned" : "Cells Earned"} barSize={viewMode === 'daily' ? 24 : 36} radius={[6, 6, 0, 0]} fill={currentBarColor} fillOpacity={0.8} />
          
          <Line 
            yAxisId="left" type="linear" dataKey="trendValue" name="Trend" 
            stroke={currentTrendColor} strokeDasharray="5 5" strokeOpacity={0.8} strokeWidth={2}
            dot={false} activeDot={false} isAnimationActive={false}
          />

          <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />
          <Line yAxisId="right" type="monotone" dataKey="currentGrowth" name="Growth %" stroke="url(#splitColor)" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#64748b' }} activeDot={{ r: 6 }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}