import { Play, Pause, RotateCcw } from 'lucide-react';
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';

interface Props {
  minTargetRarity: number;
  setMinTargetRarity: (r: number) => void;
  isSimulating: boolean;
  toggleSimulation: () => void;
  canRoll: boolean;
  onReset: () => void; // 리셋 함수 추가
}

export default function RerollControls({ 
  minTargetRarity, 
  setMinTargetRarity, 
  isSimulating, 
  toggleSimulation,
  canRoll,
  onReset
}: Props) {
  
  const targetRarities = [RARITY.EPIC, RARITY.LEGENDARY, RARITY.MYTHIC, RARITY.ANCESTRAL];

  const getRarityBtnStyle = (targetRarity: number) => {
    const isSelected = minTargetRarity === targetRarity;
    let baseStyle = "border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800";
    
    if (isSelected) {
      switch(targetRarity) {
        case RARITY.EPIC: return "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
        case RARITY.LEGENDARY: return "border-yellow-500 bg-yellow-500/20 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.3)]";
        case RARITY.MYTHIC: return "border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
        case RARITY.ANCESTRAL: return "border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
      }
    }
    return baseStyle;
  };

  return (
    // [수정] 6칸 그리드로 변경 (등급4 + Roll + Reset)
    <div className="w-full grid grid-cols-6 gap-2 mb-3 shrink-0 h-10">
      
      {/* 1~4. 등급 버튼 */}
      {targetRarities.map((r) => (
        <button
          key={r}
          onClick={() => setMinTargetRarity(r)}
          disabled={isSimulating}
          className={`
            rounded flex items-center justify-center text-[10px] font-bold uppercase transition-all border
            ${getRarityBtnStyle(r)}
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          {RARITY_LABELS[r]}
        </button>
      ))}

      {/* 5. Roll Button */}
      <button
        onClick={toggleSimulation}
        disabled={!canRoll && !isSimulating}
        className={`
          rounded flex items-center justify-center font-bold text-xs transition-all border
          ${isSimulating 
            ? 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]' 
            : 'bg-green-500 border-green-600 text-slate-900 hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
          }
          disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
        `}
      >
        {isSimulating ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5"/>}
      </button>

      {/* 6. Reset Button (NEW) */}
      <button
        onClick={onReset}
        disabled={isSimulating}
        className="rounded flex items-center justify-center font-bold text-xs transition-all border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
        title="Reset All"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}