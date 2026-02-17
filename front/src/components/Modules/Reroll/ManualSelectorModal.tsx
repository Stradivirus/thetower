/**
 * 파일명: thetower/front/src/components/Modules/Reroll/ManualSelectorModal.tsx
 * 용도: 리롤 슬롯에 수동으로 옵션을 장착하기 위한 선택 모달
 * 기능: 선택한 타겟 등급에 해당하는 옵션 리스트 표시, 이미 선택된 옵션 제외 처리, ESC 및 배경 클릭 닫기 지원
 */
import { X, CheckCircle2 } from 'lucide-react';
import { RARITY, RARITY_LABELS } from '../../../data/module_reroll_data';
import useEscKey from '../../../hooks/useEscKey'; 

interface EffectData {
  id: string;
  name: string;
  unit: string;
  values: (number | string | null)[];
}

interface Props {
  isOpen: boolean;                      // 모달 오픈 여부
  onClose: () => void;                  // 모달 닫기 핸들러
  onSelect: (effectId: string) => void; // 옵션 선택 시 실행할 콜백
  effects: EffectData[];                // 선택 가능한 전체 효과 목록
  targetRarity: number;                 // 현재 설정된 타겟 등급 인덱스
  excludedIds?: string[];               // 목록에서 제외할 효과 ID 리스트 (이미 장착된 옵션 등)
}

export default function ManualSelectorModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  effects, 
  targetRarity, 
  excludedIds = [] 
}: Props) {
  // ESC 키 입력 시 모달 닫기 지원
  useEscKey(onClose, isOpen);

  if (!isOpen) return null;

  const rarityLabel = RARITY_LABELS[targetRarity];
  
  /** 등급 인덱스에 따른 텍스트 색상 반환 */
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
    <div 
      // 배경(Overlay) 클릭 시 모달 닫기
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 cursor-pointer"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] cursor-default">
        
        {/* 모달 헤더: 선택 중인 타겟 등급 정보 표시 */}
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

        {/* 옵션 리스트 본문: 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
          {effects
            .filter(effect => !excludedIds.includes(effect.id)) // 중복 옵션 필터링
            .map((effect) => {
              const value = effect.values[targetRarity];
              const isValid = value !== null && value !== undefined; // 해당 등급에 수치가 정의되어 있는지 확인

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
        
        {/* 모달 푸터: 안내 문구 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-center rounded-b-2xl">
          <span className="text-[10px] text-slate-500">
            Selected option will be locked automatically.
          </span>
        </div>
      </div>
    </div>
  );
}