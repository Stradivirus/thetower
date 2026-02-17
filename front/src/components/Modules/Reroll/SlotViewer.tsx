/**
 * 파일명: thetower/front/src/components/Modules/Reroll/SlotViewer.tsx
 * 용도: 리롤 시뮬레이터의 8개 옵션 슬롯을 시각화
 * 기능: 슬롯별 옵션명, 등급 색상, 수치 표시 및 잠금 상태 시각화, 클릭 시 수동 선택 인터랙션 지원
 */
import { Lock, Zap, Plus } from 'lucide-react'; 
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';

/** 
 * 개별 시뮬레이션 슬롯 데이터 구조 
 */
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
  slots: SimulationSlot[];             // 8개 슬롯 데이터 배열
  isSimulating: boolean;               // 현재 시뮬레이션 가동 여부
  availableEffects: EffectData[];      // 사용 가능한 효과 목록 (이름 매핑용)
  activeCount: number;                 // 활성화된(사용 중인) 슬롯 개수
  onSlotClick: (idx: number) => void;  // 슬롯 클릭 핸들러
}

export default function SlotViewer({ slots, isSimulating, availableEffects, activeCount, onSlotClick }: Props) {
  
  /** 등급 인덱스에 따른 텍스트 색상 반환 */
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
        
        // 활성화 판정: 시뮬레이션 중이면 activeCount 이내만, 정지 상태면 모든 슬롯 편집 가능
        const isActive = isSimulating ? idx < activeCount : true;
        const isClickable = !isSimulating;

        return (
          <div 
            key={idx} 
            onClick={() => isClickable && onSlotClick(idx)}
            className={`
              relative px-3 py-2 rounded-lg border transition-all h-14 flex items-center justify-between select-none
              ${!isActive 
                ? 'bg-slate-950/30 border-slate-900 opacity-30 cursor-default' 
                : slot.isLocked 
                  ? 'bg-slate-900 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)] cursor-pointer hover:bg-slate-800' 
                  : 'bg-slate-950/50 border-slate-800 cursor-pointer hover:border-slate-600 hover:bg-slate-900' 
              }
            `}
          >
            
            {/* 왼쪽 영역: 슬롯 번호 또는 잠금 아이콘, 효과 이름 및 등급 */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 w-4 flex justify-center">
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

            {/* 오른쪽 영역: 수치 표시 또는 상태 힌트 아이콘 */}
            <div className="text-right pl-2">
              {isActive ? (
                slot.effectId ? (
                  <span className={`text-base font-mono font-bold leading-none ${slot.isLocked ? 'text-blue-400' : 'text-slate-500'}`}>
                    {typeof slot.value === 'number' ? `+${slot.value}` : slot.value}
                    <span className="text-xs ml-0.5">{slot.unit}</span>
                  </span>
                ) : (
                  // 빈 슬롯 상태 시 표시
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