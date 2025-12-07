import { Percent, Dices, BarChart3, ArrowRight } from 'lucide-react';
import { 
  RARITY, 
  RARITY_LABELS, 
  SUB_MODULE_CHANCES, 
  REROLL_COSTS 
} from '../../../data/module_reroll_data';

// 확률표 텍스트 색상 (Epic 부터 사용하므로 인덱스 조정 필요 혹은 그대로 사용)
const RARITY_COLORS = {
  [RARITY.EPIC]: "text-purple-400",
  [RARITY.LEGENDARY]: "text-yellow-400",
  [RARITY.MYTHIC]: "text-red-400",
  [RARITY.ANCESTRAL]: "text-green-400"
};

interface DashboardProps {
  calculation: {
    baseChance: number;
    targetRarityLabel: string;
    baseCost: number;
    expectedCost: number;
  };
  lockedCount: number;
}

export default function RerollDashboard({ calculation, lockedCount }: DashboardProps) {
  // Common(0), Rare(1)을 제외하고 Epic(2)부터 필터링
  const visibleChances = Object.entries(SUB_MODULE_CHANCES)
    .filter(([rIdx]) => parseInt(rIdx) >= RARITY.EPIC);

  return (
    <div className="grid grid-cols-12 gap-4 mb-6 shrink-0 h-48">
      
      {/* [Left] 확률표 (Epic+) */}
      <div className="col-span-4 bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex flex-col relative overflow-hidden">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1">
          <Percent size={10} /> Rarity Chances
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <table className="w-full text-xs">
            <tbody>
              {visibleChances.map(([rIdx, chance]) => {
                const idx = parseInt(rIdx);
                // 타입 단언을 사용하여 인덱싱
                const colorClass = RARITY_COLORS[idx as keyof typeof RARITY_COLORS] || "text-slate-400";
                
                return (
                  <tr key={idx} className="border-b border-slate-800/30 last:border-0">
                    <td className={`py-1 font-bold ${colorClass}`}>
                      {RARITY_LABELS[idx]}
                    </td>
                    <td className="py-1 text-right font-mono text-slate-300">
                      {chance.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* [Center] 비용표 (전체 숫자 표기) */}
      <div className="col-span-4 bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex flex-col relative overflow-hidden">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between items-center">
          <span className="flex items-center gap-1"><Dices size={10} /> Reroll Costs</span>
          <span className="text-slate-600">(Shards)</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(REROLL_COSTS).map(([locks, cost]) => {
                const isCurrent = parseInt(locks) === lockedCount;
                return (
                  <tr 
                    key={locks} 
                    className={`border-b border-slate-800/30 last:border-0 transition-colors ${isCurrent ? 'bg-yellow-500/10' : ''}`}
                  >
                    <td className={`py-1 pl-2 ${isCurrent ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                      {locks} Lock{locks !== '1' ? 's' : ''}
                    </td>
                    <td className={`py-1 pr-2 text-right font-mono ${isCurrent ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>
                      {/* [수정] formatNumber 제거하고 toLocaleString 사용 */}
                      {cost.toLocaleString()}
                    </td>
                    <td className="w-4 text-center">
                      {isCurrent && <ArrowRight size={10} className="text-yellow-500 inline" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* [Right] 최종 결과 (전체 숫자 표기) */}
      <div className="col-span-4 bg-gradient-to-br from-slate-900 to-green-900/10 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <BarChart3 size={32} className="text-green-500/20 mb-3" />
        <span className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">
          Total Expected
        </span>
        <div className="text-3xl font-bold text-white font-mono drop-shadow-md tracking-tight">
          {/* [수정] formatNumber 제거하고 toLocaleString 사용 */}
          {Math.round(calculation.expectedCost).toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-500 mt-2 text-center leading-tight">
          Average shards required<br/>to hit selected target
        </div>
      </div>
    </div>
  );
}