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
}

export default function WishlistSelector({ 
  targetOptions, 
  onItemClick, 
  isSimulating,
  availableEffects,
  bannedOptions,
  isBanMode,
  banCount,
  onConfirmBans
}: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      
      {/* Header: Ban Mode vs Target Mode */}
      <div className="flex justify-between items-center mb-2 px-1 shrink-0 h-6">
        {isBanMode ? (
          // [밴 모드] 헤더
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
          // [일반 모드] 헤더
          <>
            <span className="text-xs font-bold text-slate-400">Target Wishlist</span>
            <span className={`text-[10px] font-bold ${targetOptions.length >= 8 ? 'text-blue-500' : 'text-slate-600'}`}>
              {targetOptions.length} / 8
            </span>
          </>
        )}
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="space-y-1">
          {availableEffects.map((effect) => {
            const isTarget = targetOptions.includes(effect.id);
            const isBanned = bannedOptions.includes(effect.id);
            
            // 스타일링 로직
            let containerStyle = "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:bg-slate-900"; // 기본
            let textStyle = "";
            let isDisabled = isSimulating;

            if (isBanMode) {
              // [밴 모드]
              if (isBanned) {
                containerStyle = "bg-rose-950/40 border-rose-500/50 text-rose-300"; // 밴 선택됨
              } else if (bannedOptions.length >= banCount) {
                isDisabled = true; // 개수 꽉 참
                containerStyle += " opacity-50";
              }
            } else {
              // [일반 모드]
              if (isBanned) {
                containerStyle = "bg-slate-950/50 border-transparent text-slate-700"; // 확정된 밴 (비활성)
                textStyle = "line-through decoration-slate-700";
                isDisabled = true; 
              } else if (isTarget) {
                containerStyle = "bg-blue-500/10 border-blue-500/30 text-blue-100"; // 타겟
              } else if (targetOptions.length >= 8) {
                isDisabled = true; // 타겟 개수 초과
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
                {/* Checkbox Icon */}
                <div className={`shrink-0 ${isBanned && !isBanMode ? 'opacity-20' : ''}`}>
                  {isBanMode ? (
                     // 밴 모드일 땐 체크박스 대신 원형/금지 아이콘 느낌
                     <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isBanned ? 'border-rose-400 bg-rose-500/20' : 'border-slate-600'}`}>
                        {isBanned && <div className="w-2 h-2 rounded-full bg-rose-400" />}
                     </div>
                  ) : (
                     // 일반 모드
                     isTarget ? <CheckSquare size={14} className="text-blue-400"/> : <Square size={14} />
                  )}
                </div>

                {/* Name */}
                <span className={`text-xs font-bold truncate flex-1 ${textStyle}`}>
                  {effect.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}