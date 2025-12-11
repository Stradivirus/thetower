import { useState } from 'react';
import { Info, BarChart3, Target, Shield, Zap, Cpu } from 'lucide-react';
import { RARITY, MODULE_TYPES } from '../../data/module_reroll_data'; 
import { useRerollSimulation } from '../../hooks/useRerollSimulation';
import RerollControls from './Reroll/RerollControls';
import WishlistSelector from './Reroll/WishlistSelector';
import SlotViewer from './Reroll/SlotViewer';
import RerollSidebar from './Reroll/RerollSidebar'; 
import ManualSelectorModal from './Reroll/ManualSelectorModal'; 

const MODULE_ICONS = {
  cannon: { icon: Target, label: 'Cannon', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  armor: { icon: Shield, label: 'Armor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  generator: { icon: Zap, label: 'Generator', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  core: { icon: Cpu, label: 'Core', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const MAX_BAN_COUNTS: Record<string, number> = {
  cannon: 4,
  armor: 4,
  generator: 3,
  core: 7,
};

export default function RerollPanel() {
  const [selectedModuleType, setSelectedModuleType] = useState('cannon');
  const currentModuleInfo = MODULE_ICONS[selectedModuleType as keyof typeof MODULE_ICONS];
  const currentEffects = MODULE_TYPES[selectedModuleType] || [];
  const maxBans = MAX_BAN_COUNTS[selectedModuleType] || 0;

  const [targetOptions, setTargetOptions] = useState<string[]>([]); 
  const [targetRarityCap, setTargetRarityCap] = useState<number>(RARITY.ANCESTRAL);

  const [banCount, setBanCount] = useState<number>(0);
  const [bannedOptions, setBannedOptions] = useState<string[]>([]);
  const [isBanMode, setIsBanMode] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  const { 
    slots, 
    totalCost, 
    isSimulating, 
    startSimulation, 
    stopSimulation, 
    resetSimulation,
    manualSetSlot,   
    manualUnlockSlot 
  } = useRerollSimulation();

  const lockedCount = slots.filter(s => s.isLocked).length;

  // 사용 중인 슬롯 개수 계산
  const lockedSlots = slots.filter(s => s.isLocked);
  const pendingTargets = targetOptions.filter(t => !lockedSlots.some(s => s.effectId === t));
  const usedSlotCount = lockedSlots.length + pendingTargets.length;

  const handleModuleChange = (typeId: string) => {
    if (isSimulating) stopSimulation();
    setSelectedModuleType(typeId);
    setTargetOptions([]); 
    setBanCount(0);
    setBannedOptions([]);
    setIsBanMode(false);
    resetSimulation();
  };

  const handleBanCountChange = (count: number) => {
    setBanCount(count);
    if (count > 0) {
      setIsBanMode(true);
      if (bannedOptions.length > count) {
        setBannedOptions(prev => prev.slice(0, count));
      }
    } else {
      setIsBanMode(false);
      setBannedOptions([]);
    }
  };

  const handleItemClick = (id: string) => {
    if (isBanMode) {
      setBannedOptions(prev => {
        if (prev.includes(id)) return prev.filter(item => item !== id);
        if (prev.length >= banCount) return prev;
        if (targetOptions.includes(id)) setTargetOptions(curr => curr.filter(t => t !== id));
        return [...prev, id];
      });
    } else {
      if (bannedOptions.includes(id)) return;
      setTargetOptions(prev => {
        if (prev.includes(id)) return prev.filter(item => item !== id);
        if (prev.length >= 8) return prev; 
        return [...prev, id];
      });
    }
  };

  const handleSlotClick = (idx: number) => {
    const slot = slots[idx];
    if (slot.isLocked) {
      manualUnlockSlot(idx);
    } else {
      setSelectedSlotIdx(idx);
      setIsModalOpen(true);
    }
  };

  // [Modified] 옵션 선택 시 타겟 리스트(Target Wishlist)도 업데이트
  const handleOptionSelect = (effectId: string) => {
    if (selectedSlotIdx === null) return;

    const effectData = currentEffects.find(e => e.id === effectId);
    if (!effectData) return;

    const val = effectData.values[targetRarityCap];
    
    // 1. 슬롯에 장착
    manualSetSlot(selectedSlotIdx, effectId, targetRarityCap, val, effectData.unit);

    // 2. [New] 타겟 리스트에 추가 (체크박스 활성화)
    setTargetOptions(prev => {
        if (prev.includes(effectId)) return prev; // 이미 체크되어 있으면 유지
        return [...prev, effectId];
    });

    // 3. [New] 만약 밴 리스트에 있었다면 제거 (타겟과 밴 동시 설정 방지)
    if (bannedOptions.includes(effectId)) {
        setBannedOptions(prev => prev.filter(id => id !== effectId));
    }

    setIsModalOpen(false);
    setSelectedSlotIdx(null);
  };

  const toggleSimulation = () => {
    if (isSimulating) stopSimulation();
    else {
      startSimulation(targetOptions, bannedOptions, currentEffects, targetRarityCap, isBanMode);
    }
  };

  return (
    <div className="flex gap-4 items-start w-full">
      
      {/* Left Sidebar */}
      <RerollSidebar 
        selectedModuleType={selectedModuleType}
        onModuleChange={handleModuleChange}
        targetRarityCap={targetRarityCap} 
        lockedCount={lockedCount}
      />

      {/* Right Main Panel */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentModuleInfo.bg} ${currentModuleInfo.color} border-current uppercase`}>
              SIMULATOR
            </span>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               {currentModuleInfo.label} Module
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
               <BarChart3 size={16} />
               <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
            </div>
            <div className="text-xl font-mono font-bold text-white tracking-tight">
               {totalCost.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 mb-2">
          <RerollControls 
              minTargetRarity={targetRarityCap} 
              setMinTargetRarity={setTargetRarityCap}
              isSimulating={isSimulating}
              toggleSimulation={toggleSimulation}
              canRoll={targetOptions.length > 0 && !slots.slice(0, targetOptions.length).every(s => s.isLocked)}
              onReset={resetSimulation}
              banCount={banCount}
              setBanCount={handleBanCountChange}
              maxBans={maxBans}
            />
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          <div className="w-1/2 flex flex-col border-r border-slate-800 pr-6">
            <WishlistSelector 
              targetOptions={targetOptions}
              onItemClick={handleItemClick}
              isSimulating={isSimulating}
              availableEffects={currentEffects}
              bannedOptions={bannedOptions}
              isBanMode={isBanMode}
              banCount={banCount}
              onConfirmBans={() => setIsBanMode(false)}
              usedSlotCount={usedSlotCount} 
            />
          </div>

          <div className="w-1/2 flex flex-col">
            <SlotViewer 
              slots={slots} 
              isSimulating={isSimulating} 
              availableEffects={currentEffects}
              activeCount={usedSlotCount > 0 ? usedSlotCount : 8}
              onSlotClick={handleSlotClick} 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3 shrink-0">
          <Info size={12} />
          <span>Click a slot to manually lock an effect. Unused slots will be disabled during simulation.</span>
        </div>
      </div>

      <ManualSelectorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleOptionSelect}
        effects={currentEffects}
        targetRarity={targetRarityCap}
      />
    </div>
  );
}