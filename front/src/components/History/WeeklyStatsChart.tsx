import { useState } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { BarChart3, Zap, CircleDollarSign, RefreshCw } from 'lucide-react';
import type { WeeklyStatsResponse } from '../../api/reports';
import { formatNumber } from '../../utils/format';

interface Props {
  data: WeeklyStatsResponse | null;
  loading: boolean;
}

export default function WeeklyStatsChart({ data, loading }: Props) {
  // [Modified] 탭 상태 제거 (자원 추이만 남김)
  const [resourceType, setResourceType] = useState<'coin' | 'cell'>('coin');

  if (loading) {
    return (
      <div className="h-[350px] bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 mb-6 animate-pulse">
        <RefreshCw className="animate-spin mr-2" size={20} /> 데이터 분석 중...
      </div>
    );
  }

  if (!data) return null;

  const { daily_stats } = data;

  // 데이터 가공 (현재 선택된 타입의 성장률을 'currentGrowth'로 통일)
  const formattedDaily = daily_stats.map(d => ({
    ...d,
    displayDate: d.date.substring(5).replace('-', '/'),
    currentGrowth: resourceType === 'coin' ? d.coin_growth : d.cell_growth
  }));

  // [Design] 색상 정의
  const COLORS = {
    coinBar: '#fbbf24',    // 노랑 (코인)
    cellBar: '#22d3ee',    // 청록 (셀)
    increase: '#ef4444',   // 빨강 (증가)
    decrease: '#3b82f6',   // 초록 (감소)
  };

  const isCoin = resourceType === 'coin';
  const currentBarColor = isCoin ? COLORS.coinBar : COLORS.cellBar;

  // [Logic] 0% 기준선 오프셋 계산 (그라데이션 분기점)
  const gradientOffset = () => {
    const dataMax = Math.max(...formattedDaily.map((i) => i.currentGrowth));
    const dataMin = Math.min(...formattedDaily.map((i) => i.currentGrowth));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 animate-fade-in shadow-xl">
      
      {/* Header & Controls */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-300 text-lg font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-slate-400" /> 주간 자원 추이
        </h3>

        {/* Resource Type Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
          <button 
            onClick={() => setResourceType('coin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              isCoin 
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                : 'text-slate-500 hover:text-white border border-transparent'
            }`}
          >
            <CircleDollarSign size={14} /> Coins
          </button>
          <button 
            onClick={() => setResourceType('cell')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              !isCoin 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                : 'text-slate-500 hover:text-white border border-transparent'
            }`}
          >
            <Zap size={14} /> Cells
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedDaily} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
            {/* 그라데이션 정의 (0% 기준 분기) */}
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor={COLORS.increase} stopOpacity={1} />
                <stop offset={off} stopColor={COLORS.decrease} stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            
            <XAxis 
              dataKey="displayDate" 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            
            {/* Left Y-Axis (획득량) */}
            <YAxis 
              yAxisId="left" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
              tickFormatter={(val) => formatNumber(val)} 
              axisLine={false} 
              tickLine={false}
              width={50}
            />
            
            {/* Right Y-Axis (성장률) */}
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
              tickFormatter={(val) => `${val}%`}
              axisLine={false} 
              tickLine={false}
              width={40}
              domain={['auto', 'auto']} // 자동 범위
            />
            
            <Tooltip 
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
              // [New] 툴팁 텍스트 색상 커스텀
              formatter={(value: any, name: string) => {
                if (name === 'Growth %') {
                  const num = Number(value);
                  const color = num > 0 ? COLORS.increase : (num < 0 ? COLORS.decrease : '#94a3b8');
                  return [<span style={{ color }}>{value}%</span>, 'Growth Rate'];
                }
                return [formatNumber(value), 'Total Amount'];
              }}
            />
            
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />

            {/* Bar (획득량) */}
            <Bar 
              yAxisId="left"
              dataKey={isCoin ? "total_coins" : "total_cells"} 
              name={isCoin ? "Coins Earned" : "Cells Earned"} 
              barSize={24} 
              radius={[6, 6, 0, 0]}
              fill={currentBarColor}
              fillOpacity={0.8}
            />

            {/* 0% 기준선 추가 */}
            <ReferenceLine y={0} yAxisId="right" stroke="#475569" strokeDasharray="3 3" />

            {/* Line (성장률) - 그라데이션 적용 */}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="currentGrowth" 
              name="Growth %" 
              stroke="url(#splitColor)" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#64748b' }} // 점은 중립색으로 처리
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}