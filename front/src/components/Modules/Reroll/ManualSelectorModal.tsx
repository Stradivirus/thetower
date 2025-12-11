import { X, CheckCircle2 } from 'lucide-react';
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';

interface EffectData {
  id: string;
  name: string;
  unit: string;
  values: (number | string | null)[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (effectId: string) => void;
  effects: EffectData[];
  targetRarity: number;
  excludedIds?: string[]; // [New] 제외할 옵션 ID 목록
}

export default function ManualSelectorModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  effects, 
  targetRarity, 
  excludedIds = [] // [New] 기본값 빈 배열
}: Props) {
  if (!isOpen) return null;

  const rarityLabel = RARITY_LABELS[targetRarity];
  
  // 등급별 텍스트 색상 (일관성 유지)
  const getRarityColor = (r: number) => {
    switch (r) {
      case RARITY.EPIC: return 'text-purple-400';
      case RARITY.LEGENDARY: return 'text-yellow-400';
      case RARITY.MYTHIC: return 'text-red-400';
      case RARITY.ANCESTRAL: return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">Select Option</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Rarity: <span className={`font-bold ${getRarityColor(targetRarity)}`}>{rarityLabel}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
          {effects
            // [New] 이미 선택된 옵션(excludedIds)은 목록에서 제외
            .filter(effect => !excludedIds.includes(effect.id))
            .map((effect) => {
              const value = effect.values[targetRarity];
              // 해당 등급에 값이 없는 옵션(예: Common 등급의 특정 옵션)은 비활성화 처리
              const isValid = value !== null && value !== undefined;

              return (
                <button
                  key={effect.id}
                  onClick={() => isValid && onSelect(effect.id)}
                  disabled={!isValid}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                    ${isValid 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 group' 
                      : 'bg-slate-900/50 border-slate-800 opacity-40 cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isValid ? 'text-slate-200 group-hover:text-white' : 'text-slate-500'}`}>
                      {effect.name}
                    </span>
                  </div>

                  {isValid && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${getRarityColor(targetRarity)}`}>
                        {value}{effect.unit}
                      </span>
                      <CheckCircle2 size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                </button>
              );
            })}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-center rounded-b-2xl">
          <span className="text-[10px] text-slate-500">
            Selected option will be locked automatically.
          </span>
        </div>
      </div>
    </div>
  );
}