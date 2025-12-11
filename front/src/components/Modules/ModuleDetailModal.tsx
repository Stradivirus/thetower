import { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, Shield, Zap, Target, Cpu } from 'lucide-react';
import { RARITIES, RARITY } from './ModuleConstants';
import { MODULE_TYPES } from '../../data/module_reroll_data'; 
import SlotViewer, { type SimulationSlot } from './Reroll/SlotViewer';
import ManualSelectorModal from './Reroll/ManualSelectorModal';
import useEscKey from '../../hooks/useEscKey'; // [New] Import

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
  equipStatus
}: Props) {
  // ... (state 및 effect 로직들은 그대로 유지) ...
  const initialRarity = typeof currentData === 'object' ? currentData.rarity : (currentData !== undefined ? currentData : RARITY.ANCESTRAL);
  const initialEffects = typeof currentData === 'object' ? (currentData.effects || []) : [];

  const [rarity, setRarity] = useState<number>(initialRarity);
  const [effects, setEffects] = useState<(string | null)[]>([]);
  
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    const filled = Array(8).fill(null);
    initialEffects.forEach((eff: string, idx: number) => {
      if (idx < 8) filled[idx] = eff;
    });
    setEffects(filled);
    setRarity(initialRarity);
  }, [currentData, isOpen]);

  // [New] ESC 키 처리 (선택 모달이 안 열려있을 때만 동작)
  useEscKey(onClose, isOpen && !isSelectorOpen);

  const availableEffects = useMemo(() => {
    return MODULE_TYPES[moduleType] || [];
  }, [moduleType]);

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
      return { id: idx, effectId: effectId, rarity: rarity, value: val ?? '-', unit: effectData.unit, isLocked: false };
    });
  }, [effects, availableEffects, rarity]);

  const handleSlotClick = (idx: number) => {
    setSelectedSlotIdx(idx);
    setSelectorOpen(true);
  };

  const handleEffectSelect = (effectId: string) => {
    if (selectedSlotIdx === null) return;
    const newEffects = [...effects];
    newEffects[selectedSlotIdx] = effectId;
    setEffects(newEffects);
    setSelectorOpen(false);
  };

  const handleSave = () => {
    const cleanEffects = effects.filter(e => e !== null) as string[];
    onSave({ rarity, effects: cleanEffects });
    onClose();
  };

  const Icon = moduleType === 'cannon' ? Target : 
               moduleType === 'armor' ? Shield : 
               moduleType === 'generator' ? Zap : Cpu;

  const currentSelectedIds = effects.filter((e): e is string => e !== null);

  if (!isOpen) return null;

  return (
    <div 
      // [New] 배경 클릭 시 닫기 (이벤트 타겟 확인)
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 cursor-pointer"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] cursor-default">
        
        {/* Header */}
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
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* ... (기존 내용 유지) ... */}
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 rounded-b-2xl flex justify-between items-center gap-4 shrink-0">
          <button 
             onClick={() => { if(confirm('Delete this module?')) onDelete(); }}
             className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-sm font-bold transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>

          <div className="flex items-center gap-3">
            {equipStatus === 'main' ? (
               <button onClick={onUnequip} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700">
                 Unequip Main
               </button>
            ) : (
               <button onClick={() => onEquip('main')} className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 rounded-lg text-sm font-bold hover:bg-yellow-600/30">
                 Equip Main
               </button>
            )}

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

            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all"
            >
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      </div>

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