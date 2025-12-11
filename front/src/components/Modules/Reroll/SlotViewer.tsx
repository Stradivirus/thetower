import { Lock, Zap, Plus } from 'lucide-react'; 
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';

export interface SimulationSlot {
  id: number;
  effectId: string | null;
  rarity: number;
  value: number | string | null;
  unit: string;
  isLocked: boolean;
}

interface EffectData {
  id: string;
  name: string;
}

interface Props {
  slots: SimulationSlot[];
  isSimulating: boolean;
  availableEffects: EffectData[];
  activeCount: number;
  onSlotClick: (idx: number) => void; 
}

export default function SlotViewer({ slots, isSimulating, availableEffects, activeCount, onSlotClick }: Props) {
  
  const getRarityColor = (r: number) => {
    switch (r) {
      case RARITY.COMMON: return 'text-slate-400';
      case RARITY.RARE: return 'text-blue-400';
      case RARITY.EPIC: return 'text-purple-400';
      case RARITY.LEGENDARY: return 'text-yellow-400';
      case RARITY.MYTHIC: return 'text-red-400';
      case RARITY.ANCESTRAL: return 'text-green-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-2">
      {slots.map((slot, idx) => {
        const effectName = availableEffects.find(e => e.id === slot.effectId)?.name || 'Empty Slot';
        
        // [Modified] 활성 상태 판정 로직 수정
        // 시뮬레이션 중일 때는 계산된 activeCount를 따르지만, 
        // 멈춰있을 때는 모든 슬롯을 활성화(편집 가능) 상태로 보여줌
        const isActive = isSimulating ? idx < activeCount : true;
        
        // [Modified] 시뮬레이션 중이 아니면 무조건 클릭 가능
        const isClickable = !isSimulating;

        return (
          <div 
            key={idx} 
            onClick={() => isClickable && onSlotClick(idx)}
            className={`
              relative px-3 py-2 rounded-lg border transition-all h-14 flex items-center justify-between select-none
              ${!isActive 
                ? 'bg-slate-950/30 border-slate-900 opacity-30 cursor-default' // 시뮬 중 비활성 슬롯 (흐리게)
                : slot.isLocked 
                  ? 'bg-slate-900 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] cursor-pointer hover:bg-slate-800' // 잠긴 슬롯
                  : 'bg-slate-950/50 border-slate-800 cursor-pointer hover:border-slate-600 hover:bg-slate-900' // 빈 슬롯 (편집 가능)
              }
            `}
          >
            
            {/* Left: Slot Info */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-4 flex justify-center">
                  {slot.isLocked ? (
                    <Lock size={14} className="text-blue-400" />
                  ) : (
                    // 시뮬 중이 아니면 그냥 숫자 표시
                    <span className={`text-[10px] font-mono ${isActive ? 'text-slate-600' : 'text-slate-800'}`}>
                      {idx + 1}
                    </span>
                  )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold truncate ${
                  !isActive ? 'text-slate-700' : slot.isLocked ? 'text-white' : 'text-slate-500'
                }`}>
                  {effectName}
                </span>
                {isActive && slot.effectId && (
                  <span className={`text-[10px] leading-none font-bold ${getRarityColor(slot.rarity)}`}>
                    {RARITY_LABELS[slot.rarity]}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Value Display or Action Hint */}
            <div className="text-right pl-2">
              {isActive ? (
                slot.effectId ? (
                  <span className={`text-base font-mono font-bold leading-none ${slot.isLocked ? 'text-blue-400' : 'text-slate-500'}`}>
                    {typeof slot.value === 'number' ? `+${slot.value}` : slot.value}
                    <span className="text-xs ml-0.5">{slot.unit}</span>
                  </span>
                ) : (
                  // 빈 슬롯일 때 표시: 시뮬 중엔 번개, 아닐 땐 플러스(추가) 아이콘
                  isSimulating ? (
                    <Zap size={14} className="text-slate-700 animate-pulse" />
                  ) : (
                    <Plus size={14} className="text-slate-700 group-hover:text-slate-500" />
                  )
                )
              ) : (
                <span className="text-slate-800 text-xs">Disabled</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}