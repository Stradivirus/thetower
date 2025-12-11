import { Lock, Zap } from 'lucide-react';
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
}

export default function SlotViewer({ slots, isSimulating, availableEffects, activeCount }: Props) {
  
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
    // [Modified] overflow-y-auto 제거, space-y-2로 나열
    <div className="space-y-2">
      {slots.map((slot, idx) => {
        const effectName = availableEffects.find(e => e.id === slot.effectId)?.name || 'Empty Slot';
        const isActive = idx < activeCount;

        return (
          <div key={idx} className={`relative px-3 py-2 rounded-lg border transition-all h-14 flex items-center justify-between ${
            !isActive 
              ? 'bg-slate-950/30 border-slate-900 opacity-30' 
              : slot.isLocked 
                ? 'bg-slate-900 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                : 'bg-slate-950/50 border-slate-800'
          }`}>
            
            {/* Left: Slot Info */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-4">
                  {slot.isLocked ? (
                    <Lock size={14} className="text-blue-400" />
                  ) : (
                    <span className={`text-[10px] font-mono ${isActive ? 'text-slate-600' : 'text-slate-800'}`}>
                      {idx + 1}
                    </span>
                  )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold truncate ${
                  !isActive ? 'text-slate-700' : slot.isLocked ? 'text-white' : 'text-slate-600'
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

            {/* Right: Value Display */}
            <div className="text-right pl-2">
              {isActive ? (
                slot.effectId ? (
                  <span className={`text-base font-mono font-bold leading-none ${slot.isLocked ? 'text-blue-400' : 'text-slate-500'}`}>
                    {typeof slot.value === 'number' ? `+${slot.value}` : slot.value}
                    <span className="text-xs ml-0.5">{slot.unit}</span>
                  </span>
                ) : (
                  <Zap size={14} className={`text-slate-800 ${isSimulating ? 'animate-pulse text-slate-700' : ''}`} />
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