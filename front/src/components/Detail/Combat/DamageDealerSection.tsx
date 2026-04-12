import { useState } from 'react';
import { Sword, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { RANK_COLORS, DEFAULT_RANK_COLOR } from '../../../constants/reportRules';
import { T } from '../../../locales';

/** 
 * [내부 헬퍼] 소형 스탯 그리드 행
 * 소수 딜러 및 기타 전투 스탯 표시용
 */
export const StatRow = ({ items }: { items: [string, any][] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-5">
    {items.map(([key, value]) => (
      <div key={key} className="flex flex-col group">
        <div className="text-[11px] text-slate-500 mb-1 truncate transition-colors group-hover:text-slate-400" title={key}>{key}</div>
        <div className="text-slate-200 font-bold font-mono text-sm truncate tracking-wide" title={String(value)}>
          {String(value)}
        </div>
      </div>
    ))}
  </div>
);

interface Props {
  majorStats: [string, any, number][];
  minorStats: [string, any][];
  totalDamageStr: string;
}

export default function DamageDealerSection({ majorStats, minorStats, totalDamageStr }: Props) {
  const [showMinors, setShowMinors] = useState(false);
  const Text = T.detail;

  return (
    <div className="mb-6">
      {/* 분석 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> {Text.HEADER_COMBAT}
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">{Text.HEADER_TOTAL}</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {/* 주요 딜러 리스트 (Progress Bar) */}
      <div className="space-y-3">
        {majorStats.map(([key, value, percentage], idx) => {
          const colorSet = RANK_COLORS[idx] || DEFAULT_RANK_COLOR;
          return (
            <div key={key} className="group">
              <div className="flex justify-between items-end mb-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>{idx + 1}</span>
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    {key} {percentage >= 50 && <Zap size={12} className="text-yellow-500 animate-pulse" />}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">{String(value)}</span>
                  <span className={`font-bold w-20 text-right text-base ${colorSet.text}`}>{percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg}`} 
                  style={{ width: `${Math.min(percentage, 100)}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 소수 딜러 섹션 (접이식) */}
      {minorStats.length > 0 && (
        <div className="mt-6 mb-10">
           <button 
             onClick={() => setShowMinors(!showMinors)} 
             className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4"
           >
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>{Text.HEADER_MISC_DEALER} ({minorStats.length}개 항목)</span>
           </button>
           {showMinors && <div className="animate-fade-in pl-2"><StatRow items={minorStats} /></div>}
        </div>
      )}
    </div>
  );
}
