import { useState } from 'react';
import { Skull } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/** 차트 색상 팔레트 */
const CHART_COLORS = [
  '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', 
  '#06b6d4', '#f43f5e', '#a855f7', '#14b8a6', '#f97316'
];

interface Props {
  allKillSourceItems: any[];
  majorKillSources: any[];
  minorKillSources: any[];
  totalKills: number;
}

export default function KillSourceSection({ allKillSourceItems, majorKillSources, minorKillSources, totalKills }: Props) {
  const [activeIndex, setActiveIndex] = useState(-1);

  /** [헬퍼] 원형 차트 지시선 라벨 렌더링 */
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.55; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={CHART_COLORS[index % CHART_COLORS.length]} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        className="text-[13px] font-black pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
        style={{ opacity: 1 }}
      >
        {name}
      </text>
    );
  };

  /** [내부 컴포넌트] 리스트 아이템 렌더러 */
  const KillSourceItem = ({ item, isMajor }: { item: any, isMajor: boolean }) => {
    const ratio = totalKills > 0 ? (item.value / totalKills) * 100 : 0;
    const isHovered = activeIndex === item.originalIndex;
    return (
        <div 
            className={`flex flex-col p-2.5 rounded-xl transition-all border ${isHovered ? 'bg-slate-800 border-slate-600 scale-[1.05]' : 'border-transparent hover:bg-slate-800/50'}`}
            onMouseEnter={() => setActiveIndex(item.originalIndex)}
            onMouseLeave={() => setActiveIndex(-1)}
        >
            <span className="text-[11px] font-black mb-1 truncate uppercase tracking-tight" style={{ color: item.color }}>{item.name}</span>
            <div className="flex items-baseline justify-between">
                {isMajor ? (
                    <>
                        <span className="text-base font-mono font-bold text-white leading-none">{item.displayValue}</span>
                        <span className="text-[10px] font-black text-slate-500 font-mono leading-none">{ratio.toFixed(1)}%</span>
                    </>
                ) : (
                    <span className="text-xs font-mono font-bold text-slate-300 leading-none">{item.displayValue}</span>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="lg:w-3/4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4 px-1">
          <Skull size={18} className="text-blue-400" />
          <h4 className="text-base font-black text-blue-400 uppercase tracking-widest">Destroyed By</h4>
      </div>
      
      <div className="flex flex-col xl:flex-row items-stretch gap-2 flex-1">
          {/* [좌] Major Sources (3% 이상) */}
          <div className="w-full xl:w-1/4 flex flex-col gap-2 justify-center py-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-2 px-2 border-b border-slate-800/50 pb-1">Major (≥ 3%)</div>
              {majorKillSources.map(item => <KillSourceItem key={item.name} item={item} isMajor={true} />)}
          </div>

          {/* [중] 원형 차트 */}
          <div className="w-full xl:w-2/4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={allKillSourceItems}
                          cx="50%"
                          cy="50%"
                          labelLine={{ stroke: '#475569', strokeWidth: 2 }}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          innerRadius={75}
                          dataKey="value"
                          stroke="none"
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(-1)}
                          isAnimationActive={false}
                      >
                          {allKillSourceItems.map((item, index) => (
                              <Cell 
                                  key={`cell-${index}`} 
                                  fill={item.color} 
                                  opacity={activeIndex === -1 || activeIndex === item.originalIndex ? 1 : 0.3}
                                  style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                              />
                          ))}
                      </Pie>
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                          itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value: any) => [value.toLocaleString(), 'Count']}
                      />
                  </PieChart>
              </ResponsiveContainer>
          </div>

          {/* [우] Minor Sources (3% 미만) */}
          <div className="w-full xl:w-1/4 flex flex-col gap-2 justify-center py-4">
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-2 px-2 border-b border-slate-800/50 pb-1">Minor (&lt; 3%)</div>
              <div className="grid grid-cols-1 gap-1 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {minorKillSources.map(item => <KillSourceItem key={item.name} item={item} isMajor={false} />)}
              </div>
          </div>
      </div>
    </div>
  );
}
