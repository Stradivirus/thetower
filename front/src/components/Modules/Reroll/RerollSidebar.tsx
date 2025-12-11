import { useMemo } from 'react';
import { Target, Shield, Zap, Cpu, Percent, Dices, ArrowRight } from 'lucide-react';
import { 
  RARITY, 
  RARITY_LABELS, 
  SUB_MODULE_CHANCES, 
  REROLL_COSTS 
} from '../../../data/module_reroll_data';

const MODULE_CATS = [
  { id: 'cannon', label: 'Cannon', icon: Target, color: 'text-rose-400', border: 'border-rose-500/50' },
  { id: 'armor', label: 'Armor', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/50' },
  { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400', border: 'border-yellow-500/50' },
  { id: 'core', label: 'Core', icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/50' },
];

const RARITY_COLORS = {
  [RARITY.EPIC]: "text-purple-400",
  [RARITY.LEGENDARY]: "text-yellow-400",
  [RARITY.MYTHIC]: "text-red-400",
  [RARITY.ANCESTRAL]: "text-green-400"
};

interface Props {
  selectedModuleType: string;
  onModuleChange: (typeId: string) => void;
  targetRarityCap: number; 
  lockedCount: number;
}

export default function RerollSidebar({ 
  selectedModuleType, 
  onModuleChange, 
  targetRarityCap, 
  lockedCount 
}: Props) {

  const visibleChances = useMemo(() => {
    return Object.entries(SUB_MODULE_CHANCES)
      .filter(([rIdx]) => parseInt(rIdx) >= RARITY.EPIC)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
  }, []);

  // [Modified] overflow-hidden 제거 -> 자연스럽게 늘어남
  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4">
      
      {/* 1. 모듈 타입 선택기 */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {MODULE_CATS.map((cat) => {
          const isSelected = selectedModuleType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onModuleChange(cat.id)}
              className={`
                flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all
                ${isSelected 
                  ? `bg-slate-800 text-white ${cat.border} shadow-lg shadow-black/20` 
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }
              `}
            >
              <cat.icon size={20} className={isSelected ? cat.color : 'text-current'} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. 통계 패널 */}
      {/* [Modified] min-h-0, overflow-hidden 제거 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col">
        
        {/* (A) 확률표 */}
        <div className="mb-6 shrink-0">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1">
            <Percent size={12} /> Rarity Chances
          </div>
          <table className="w-full text-xs">
            <tbody>
              {visibleChances.map(([rIdx, chance]) => {
                const idx = parseInt(rIdx);
                const colorClass = RARITY_COLORS[idx as keyof typeof RARITY_COLORS] || "text-slate-400";
                const isAvailable = idx <= targetRarityCap;
                
                return (
                  <tr key={idx} className={`border-b border-slate-800/30 last:border-0 ${isAvailable ? '' : 'opacity-20 blur-[0.5px]'}`}>
                    <td className={`py-1.5 font-bold ${colorClass}`}>
                      {RARITY_LABELS[idx]}
                    </td>
                    <td className="py-1.5 text-right font-mono text-slate-300">
                      {chance.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* (B) 비용표 */}
        <div className="flex flex-col">
           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between items-center shrink-0">
            <span className="flex items-center gap-1"><Dices size={12} /> Cost / Roll</span>
          </div>
          {/* [Modified] overflow-y-auto 제거 */}
          <div className="pr-1">
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(REROLL_COSTS).map(([locks, cost]) => {
                  const isCurrent = parseInt(locks) === lockedCount;
                  return (
                    <tr 
                      key={locks} 
                      className={`border-b border-slate-800/30 last:border-0 transition-colors ${isCurrent ? 'bg-yellow-500/10' : ''}`}
                    >
                      <td className={`py-1.5 pl-2 ${isCurrent ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                        {locks} Lock{locks !== '1' ? 's' : ''}
                      </td>
                      <td className={`py-1.5 pr-2 text-right font-mono ${isCurrent ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>
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
      </div>
    </div>
  );
}