/**
 * 파일명: thetower/front/src/components/Modules/ModuleDetailModal.tsx
 * 용도: 개별 모듈의 상세 설정(등급 변경, 부옵션 편집, 장착/해제)을 위한 모달
 * 기능: 등급 선택기 제공, 슬롯별 부옵션 수동 선택 및 자동 잠금, 메인/어시스트 슬롯 장착 제어
 */
import { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, Shield, Zap, Target, Cpu, Loader2 } from 'lucide-react'; 
import { RARITIES, RARITY } from './ModuleConstants';
import { MODULE_TYPES } from '../../data/module_reroll_data'; 
import SlotViewer, { type SimulationSlot } from './Reroll/SlotViewer';
import ManualSelectorModal from './Reroll/ManualSelectorModal';
import useEscKey from '../../hooks/useEscKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  moduleType: string;
  moduleName: string;
  currentData: any; 
  onSave: (data: { rarity: number; effects: string[] }) => void;
  onDelete: () => void;
  onEquip: (slot: 'main' | 'sub') => void;
  onUnequip: () => void;
  equipStatus: 'main' | 'sub' | null;
  isSaving: boolean; 
}

export default function ModuleDetailModal({
  isOpen,
  onClose,
  moduleType,
  moduleName,
  currentData,
  onSave,
  onDelete,
  onEquip,
  onUnequip,
  equipStatus,
  isSaving
}: Props) {
  
  const isDataObject = currentData && typeof currentData === 'object';

  // 초기 상태 설정: 기존 데이터가 있으면 로드, 없으면 기본값 적용
  const initialRarity = isDataObject 
    ? currentData.rarity 
    : (typeof currentData === 'number' ? currentData : RARITY.ANCESTRAL);

  const initialEffects = isDataObject ? (currentData.effects || []) : [];

  const [rarity, setRarity] = useState<number>(initialRarity);
  const [effects, setEffects] = useState<(string | null)[]>([]);
  
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  // 모달이 열릴 때마다 데이터 동기화
  useEffect(() => {
    const filled = Array(8).fill(null);
    initialEffects.forEach((eff: string, idx: number) => {
      if (idx < 8) filled[idx] = eff;
    });
    setEffects(filled);
    setRarity(initialRarity);
  }, [currentData, isOpen]);

  // ESC 키 처리 (저장 중이 아닐 때만 닫기 허용)
  useEscKey(onClose, isOpen && !isSelectorOpen && !isSaving);

  /** 현재 모듈 타입에 사용 가능한 부옵션 리스트를 가져옵니다. */
  const availableEffects = useMemo(() => {
    return MODULE_TYPES[moduleType] || [];
  }, [moduleType]);

  /** 
   * 슬롯 뷰어 표시를 위해 현재 편집 중인 효과 데이터를 Slot 인터페이스에 맞게 가공합니다.
   */
  const simulationSlots: SimulationSlot[] = useMemo(() => {
    return effects.map((effectId, idx) => {
      if (!effectId) {
        return { id: idx, effectId: null, rarity: 0, value: '-', unit: '', isLocked: false };
      }
      const effectData = availableEffects.find(e => e.id === effectId);
      if (!effectData) {
        return { id: idx, effectId: null, rarity: 0, value: 'Unknown', unit: '', isLocked: false };
      }
      
      const val = effectData.values[rarity]; 
      
      return {
        id: idx,
        effectId: effectId,
        rarity: rarity, 
        value: val ?? '-',
        unit: effectData.unit,
        isLocked: false 
      };
    });
  }, [effects, availableEffects, rarity]);

  /** 슬롯 클릭 시 부옵션 수동 선택 모달을 엽니다. */
  const handleSlotClick = (idx: number) => {
    if (isSaving) return; 
    setSelectedSlotIdx(idx);
    setSelectorOpen(true);
  };

  /** 선택 모달에서 옵션을 골랐을 때 호출되는 콜백 */
  const handleEffectSelect = (effectId: string) => {
    if (selectedSlotIdx === null) return;
    const newEffects = [...effects];
    newEffects[selectedSlotIdx] = effectId;
    setEffects(newEffects);
    setSelectorOpen(false);
  };

  /** 현재 편집된 내용을 부모 컴포넌트로 전달하여 저장합니다. */
  const handleSave = () => {
    if (isSaving) return; 
    const cleanEffects = effects.filter(e => e !== null) as string[];
    onSave({ rarity, effects: cleanEffects });
  };

  const Icon = moduleType === 'cannon' ? Target : 
               moduleType === 'armor' ? Shield : 
               moduleType === 'generator' ? Zap : Cpu;

  const currentSelectedIds = effects.filter((e): e is string => e !== null);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { 
        if (!isSaving && e.target === e.currentTarget) onClose(); 
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 cursor-pointer"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] cursor-default">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-800 text-slate-200`}>
               <Icon size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{moduleName}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{moduleType} Module</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* 1. 등급 선택 섹션 */}
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-400">Module Rarity</label>
             <div className="grid grid-cols-4 gap-2">
                {[RARITY.EPIC, RARITY.LEGENDARY, RARITY.MYTHIC, RARITY.ANCESTRAL].map((r) => {
                  const rInfo = RARITIES[r];
                  const isSelected = rarity === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRarity(r)}
                      disabled={isSaving}
                      className={`
                        py-2 px-1 rounded-lg border text-xs font-bold transition-all
                        ${isSelected 
                          ? `${rInfo.bg} ${rInfo.border} ${rInfo.color} ring-1 ring-current` 
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800'
                        }
                      `}
                    >
                      {rInfo.label}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* 2. 부옵션 편집 섹션 */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-slate-400">Sub-Effects ({effects.filter(e => e).length}/8)</label>
              <span className="text-[10px] text-slate-500">Click a slot to change effect</span>
            </div>
            
            <div className="bg-slate-950/30 rounded-xl border border-slate-800 p-4">
              <SlotViewer 
                slots={simulationSlots}
                isSimulating={false}
                availableEffects={availableEffects}
                activeCount={8}
                onSlotClick={handleSlotClick}
              />
            </div>
          </div>
        </div>

        {/* 푸터 액션 영역 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 rounded-b-2xl flex justify-between items-center gap-4 shrink-0">
          
          {/* 삭제 버튼 */}
          <button 
             onClick={() => { if(confirm('Delete this module?')) onDelete(); }}
             disabled={isSaving}
             className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} /> Delete
          </button>

          <div className={`flex items-center gap-3 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 메인 슬롯 장착/해제 */}
            {equipStatus === 'main' ? (
               <button onClick={onUnequip} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700">
                 Unequip Main
               </button>
            ) : (
               <button onClick={() => onEquip('main')} className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg text-sm font-bold hover:bg-yellow-600/30">
                 Equip Main
               </button>
            )}

            {/* 어시스트 슬롯 장착/해제 */}
            {equipStatus === 'sub' ? (
               <button onClick={onUnequip} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700">
                 Unequip Assist
               </button>
            ) : (
               <button onClick={() => onEquip('sub')} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg text-sm font-bold hover:bg-blue-600/30">
                 Equip Assist
               </button>
            )}

            <div className="w-px h-8 bg-slate-700 mx-2" />

            {/* 저장 버튼 (로딩 표시 포함) */}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all
                ${isSaving ? 'bg-green-800 text-green-200 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 부옵션 선택을 위한 중첩 모달 */}
      <ManualSelectorModal 
        isOpen={isSelectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleEffectSelect}
        effects={availableEffects}
        targetRarity={rarity}
        excludedIds={currentSelectedIds}
      />
    </div>
  );
}