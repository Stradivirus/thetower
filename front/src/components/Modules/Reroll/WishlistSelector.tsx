/**
 * 파일명: thetower/front/src/components/Modules/Reroll/WishlistSelector.tsx
 * 용도: 리롤 타겟 옵션(Target) 및 제외 옵션(Ban) 선택 리스트
 * 기능: 옵션 다중 선택, 밴 모드 전환 및 개수 제한 처리, 사용 중인 슬롯 개수 카운팅 및 선택 제한
 */
import { CheckSquare, Square, Check } from 'lucide-react';

interface EffectData {
  id: string;
  name: string;
}

interface Props {
  targetOptions: string[];              // 현재 선택된 타겟 옵션 ID 배열
  onItemClick: (id: string) => void;    // 아이템 클릭 핸들러
  isSimulating: boolean;                // 시뮬레이션 중 여부
  availableEffects: EffectData[];       // 선택 가능한 전체 효과 목록
  
  // 밴(Ban) 관련 상태
  bannedOptions: string[];              // 현재 선택된 밴 옵션 ID 배열
  isBanMode: boolean;                   // 밴 선택 모드 활성화 여부
  banCount: number;                     // 설정된 최대 밴 개수
  onConfirmBans: () => void;            // 밴 선택 완료 핸들러

  usedSlotCount: number;                // 현재 사용 중인 슬롯 개수 (8개 제한 확인용)
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
  usedSlotCount 
}: Props) {
  return (
    <div className="flex flex-col">
      
      {/* 헤더 섹션: 현재 모드(Target/Ban)에 따른 상태 및 개수 표시 */}
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
            <span className={`text-[10px] font-bold ${usedSlotCount >= 8 ? 'text-blue-500' : 'text-slate-400'}`}>
              {usedSlotCount} / 8
            </span>
          </>
        )}
      </div>

      {/* 옵션 리스트 본문 */}
      <div className="space-y-1">
        {availableEffects.map((effect) => {
          const isTarget = targetOptions.includes(effect.id);
          const isBanned = bannedOptions.includes(effect.id);
          
          let containerStyle = "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:bg-slate-900";
          let textStyle = "";
          let isDisabled = isSimulating;

          // 1. 밴 모드일 때의 스타일 및 처리
          if (isBanMode) {
            if (isBanned) {
              containerStyle = "bg-rose-950/40 border-rose-500/50 text-rose-300"; 
            } else if (bannedOptions.length >= banCount) {
              isDisabled = true; 
              containerStyle += " opacity-50";
            }
          } 
          // 2. 일반(타겟) 모드일 때의 스타일 및 처리
          else {
            if (isBanned) {
              containerStyle = "bg-slate-950/50 border-transparent text-slate-700"; 
              textStyle = "line-through decoration-slate-700";
              isDisabled = true; // 밴된 옵션은 타겟으로 선택 불가
            } else if (isTarget) {
              containerStyle = "bg-blue-500/10 border-blue-500/30 text-blue-100"; 
            } else if (usedSlotCount >= 8) { 
              // 슬롯 8개가 모두 찼으면 추가 선택 불가
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