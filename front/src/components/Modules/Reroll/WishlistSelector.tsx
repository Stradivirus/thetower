import { CheckSquare, Square, Check } from 'lucide-react';

interface EffectData {
  id: string;
  name: string;
}

interface Props {
  targetOptions: string[];
  onItemClick: (id: string) => void;
  isSimulating: boolean;
  availableEffects: EffectData[];
  
  // [밴 관련]
  bannedOptions: string[];
  isBanMode: boolean;
  banCount: number;
  onConfirmBans: () => void;

  // [New] 사용 중인 슬롯 개수 (수동 잠금 + 타겟)
  usedSlotCount: number;
}

export default function WishlistSelector({ 
  targetOptions, 
  onItemClick, 
  isSimulating,
  availableEffects,
  bannedOptions,
  isBanMode,
  banCount,
  onConfirmBans,
  usedSlotCount // [New]
}: Props) {
  return (
    <div className="flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-1 shrink-0 h-6">
        {isBanMode ? (
          <>
            <span className="text-xs font-bold text-rose-400 animate-pulse">
              🚫 Ban Wishlist ({bannedOptions.length}/{banCount})
            </span>
            <button 
              onClick={onConfirmBans}
              className="flex items-center gap-1 px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold transition-colors"
            >
              <Check size={10} strokeWidth={4} /> Done
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-slate-400">Target Wishlist</span>
            {/* [Modified] usedSlotCount로 표시 변경 */}
            <span className={`text-[10px] font-bold ${usedSlotCount >= 8 ? 'text-blue-500' : 'text-slate-400'}`}>
              {usedSlotCount} / 8
            </span>
          </>
        )}
      </div>

      {/* List Body */}
      <div className="space-y-1">
        {availableEffects.map((effect) => {
          const isTarget = targetOptions.includes(effect.id);
          const isBanned = bannedOptions.includes(effect.id);
          
          let containerStyle = "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:bg-slate-900";
          let textStyle = "";
          let isDisabled = isSimulating;

          if (isBanMode) {
            if (isBanned) {
              containerStyle = "bg-rose-950/40 border-rose-500/50 text-rose-300"; 
            } else if (bannedOptions.length >= banCount) {
              isDisabled = true; 
              containerStyle += " opacity-50";
            }
          } else {
            if (isBanned) {
              containerStyle = "bg-slate-950/50 border-transparent text-slate-700"; 
              textStyle = "line-through decoration-slate-700";
              isDisabled = true; 
            } else if (isTarget) {
              containerStyle = "bg-blue-500/10 border-blue-500/30 text-blue-100"; 
            } else if (usedSlotCount >= 8) { 
              // [Modified] 8개 꽉 차면 비활성화 (타겟 선택 불가)
              isDisabled = true; 
              containerStyle += " opacity-50";
            }
          }

          return (
            <button
              key={effect.id}
              onClick={() => !isDisabled && onItemClick(effect.id)}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all group
                ${containerStyle}
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`shrink-0 ${isBanned && !isBanMode ? 'opacity-20' : ''}`}>
                {isBanMode ? (
                   <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isBanned ? 'border-rose-400 bg-rose-500/20' : 'border-slate-600'}`}>
                      {isBanned && <div className="w-2 h-2 rounded-full bg-rose-400" />}
                   </div>
                ) : (
                   isTarget ? <CheckSquare size={14} className="text-blue-400"/> : <Square size={14} />
                )}
              </div>

              <span className={`text-xs font-bold truncate flex-1 ${textStyle}`}>
                {effect.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}