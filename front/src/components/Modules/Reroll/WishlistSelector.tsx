import { CheckSquare, Square } from 'lucide-react';

// [수정] 데이터 타입을 정의 (name, id 등)
interface EffectData {
  id: string;
  name: string;
  // 필요한 다른 필드들...
}

interface Props {
  targetOptions: string[];
  toggleTargetOption: (id: string) => void;
  isSimulating: boolean;
  availableEffects: EffectData[]; // [수정] 외부에서 리스트를 받음
}

export default function WishlistSelector({ 
  targetOptions, 
  toggleTargetOption, 
  isSimulating,
  availableEffects // [수정] Props로 받음
}: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-1 shrink-0">
        <span className="text-xs font-bold text-slate-400">Target Wishlist</span>
        <span className={`text-[10px] font-bold ${targetOptions.length >= 8 ? 'text-rose-500' : 'text-slate-600'}`}>
          {targetOptions.length} / 8
        </span>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="space-y-1">
          {/* [수정] availableEffects로 매핑 */}
          {availableEffects.map((effect) => {
            const isSelected = targetOptions.includes(effect.id);
            const isDisabled = !isSelected && targetOptions.length >= 8;

            return (
              <button
                key={effect.id}
                onClick={() => toggleTargetOption(effect.id)}
                disabled={isDisabled || isSimulating} 
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all
                  ${isSelected 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-100' 
                    : 'bg-slate-900/30 border-slate-800/50 text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                  }
                  ${isDisabled || isSimulating ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? <CheckSquare size={14} className="text-blue-400"/> : <Square size={14} />}
                  <span className="text-xs font-bold truncate">{effect.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}