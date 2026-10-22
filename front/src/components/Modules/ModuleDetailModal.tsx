/**
 * 파일명: thetower/front/src/components/Modules/ModuleDetailModal.tsx
 * 용도: 개별 모듈의 상세 설정(등급 변경, 부옵션 편집, 장착/해제)을 위한 모달
 * 기능: 등급 선택기 제공, 슬롯별 부옵션 수동 선택 및 자동 잠금, 메인/어시스트 슬롯 장착 제어
 */
import { X, Save, Trash2, Shield, Zap, Target, Cpu, Loader2, Plus } from 'lucide-react'; 
import { RARITIES, RARITY } from './ModuleConstants';
import SlotViewer from './Reroll/SlotViewer';
import ManualSelectorModal from './Reroll/ManualSelectorModal';
import useEscKey from '../../hooks/useEscKey';
import { useModuleDetailState, type InstanceData } from '../../hooks/useModuleDetailState';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  moduleType: string;
  moduleName: string;
  currentData: any; 
  onSave: (data: { rarity: number; effects: string[]; instanceId: number; instances: Record<string, InstanceData> }) => void;
  onDelete: (instanceId?: number) => void;
  onEquip: (slot: 'main' | 'sub', instanceId: number, instanceData: InstanceData) => void;
  onUnequip: () => void;
  equipStatus: 'main' | 'sub' | null;
  equippedInstanceId?: number | null;
  isSaving: boolean; 
  viewMode?: 'equipped' | 'inventory';
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
  equippedInstanceId = 1,
  isSaving,
  viewMode = 'inventory'
}: Props) {
  const {
    selectedInstanceId,
    rarity,
    setRarity,
    effects,
    isSelectorOpen,
    setSelectorOpen,
    availableEffects,
    simulationSlots,
    currentSelectedIds,
    hasSecondInstance,
    handleSwitchInstance,
    handleAddSecondInstance,
    handleDeleteSecondInstance,
    handleSlotClick,
    handleEffectSelect,
    handleSave,
  } = useModuleDetailState({
    isOpen,
    moduleType,
    currentData,
    equippedInstanceId,
    isSaving,
    onSave,
  });

  // ESC 키 처리 (저장 중이 아닐 때만 닫기 허용)
  useEscKey(onClose, isOpen && !isSelectorOpen && !isSaving);

  const Icon = moduleType === 'cannon' ? Target : 
               moduleType === 'armor' ? Shield : 
               moduleType === 'generator' ? Zap : Cpu;

  const isSelectedInstanceEquipped = equipStatus !== null && equippedInstanceId === selectedInstanceId;

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
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {moduleName}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  #{selectedInstanceId}
                </span>
                {viewMode === 'equipped' && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${RARITIES[rarity]?.color} ${RARITIES[rarity]?.border} ${RARITIES[rarity]?.bg}`}>
                    {RARITIES[rarity]?.label}
                  </span>
                )}
              </h3>
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

        {/* 1호기 / 2호기 인스턴스 선택 탭 바 */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 select-none">Instance:</span>
            
            {/* 1호기 탭 */}
            <button
              onClick={() => handleSwitchInstance(1)}
              disabled={isSaving}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                selectedInstanceId === 1
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1호기
            </button>

            {/* 2호기 탭 또는 2호기 추가 버튼 */}
            {hasSecondInstance ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSwitchInstance(2)}
                  disabled={isSaving}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                    selectedInstanceId === 2
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2호기
                </button>
                {viewMode !== 'equipped' && selectedInstanceId === 2 && (
                  <button
                    onClick={handleDeleteSecondInstance}
                    disabled={isSaving}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="2호기 삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ) : viewMode !== 'equipped' ? (
              <button
                onClick={handleAddSecondInstance}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-slate-400 border border-dashed border-slate-700 hover:border-slate-500 hover:text-white bg-slate-900/40 transition-all"
                title="1호기 옵션을 복제하여 2호기를 생성합니다"
              >
                <Plus size={13} /> 2호기 추가
              </button>
            ) : null}
          </div>

          {/* 장착 상태 인디케이터 */}
          {equipStatus && (
            <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">
              Equipped: {equipStatus.toUpperCase()} (#{equippedInstanceId || 1})
            </span>
          )}
        </div>

        {/* 모달 본문 */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* 1. 등급 선택 섹션 (인벤토리 모드에서만 변경 가능) */}
          {viewMode !== 'equipped' && (
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-400">
                 Module Rarity (#{selectedInstanceId})
               </label>
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
          )}

          {/* 2. 부옵션 편집 섹션 */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-slate-400">
                Sub-Effects (#{selectedInstanceId}) ({effects.filter(e => e).length}/8)
              </label>
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
          
          {/* 삭제 버튼 (인벤토리 모드에서만 표시) */}
          {viewMode !== 'equipped' ? (
            <button 
               onClick={() => { 
                 if(confirm(selectedInstanceId === 2 ? '2호기를 삭제하시겠습니까?' : '이 모듈을 완전히 삭제하시겠습니까?')) {
                   if (selectedInstanceId === 2) {
                     handleDeleteSecondInstance();
                   } else {
                     onDelete();
                   }
                 }
               }}
               disabled={isSaving}
               className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} /> {selectedInstanceId === 2 ? 'Delete #2' : 'Delete'}
            </button>
          ) : <div />}

          <div className={`flex items-center gap-3 ${isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 메인 슬롯 장착/해제 */}
            {isSelectedInstanceEquipped && equipStatus === 'main' ? (
               <button onClick={onUnequip} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700">
                 Unequip Main
               </button>
            ) : (
               <button 
                 onClick={() => {
                   const cleanEffects = effects.filter((e): e is string => e !== null);
                   onEquip('main', selectedInstanceId, { rarity, effects: cleanEffects });
                 }} 
                 className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg text-sm font-bold hover:bg-yellow-600/30"
               >
                 Equip Main (#{selectedInstanceId})
               </button>
            )}

            {/* 어시스트 슬롯 장착/해제 */}
            {isSelectedInstanceEquipped && equipStatus === 'sub' ? (
               <button onClick={onUnequip} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700">
                 Unequip Assist
               </button>
            ) : (
               <button 
                 onClick={() => {
                   const cleanEffects = effects.filter((e): e is string => e !== null);
                   onEquip('sub', selectedInstanceId, { rarity, effects: cleanEffects });
                 }} 
                 className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg text-sm font-bold hover:bg-blue-600/30"
               >
                 Equip Assist (#{selectedInstanceId})
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
