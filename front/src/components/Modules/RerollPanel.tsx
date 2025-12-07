import { useState } from 'react';
import { Info, BarChart3, Target, Shield, Zap, Cpu } from 'lucide-react';
import { RARITY, MODULE_TYPES } from '../../data/module_reroll_data'; 

// Custom Hook Import
import { useRerollSimulation } from '../../hooks/useRerollSimulation';

import RerollControls from './Reroll/RerollControls';
import WishlistSelector from './Reroll/WishlistSelector';
import SlotViewer from './Reroll/SlotViewer';
import RerollSidebar from './Reroll/RerollSidebar'; 

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
  // --- 1. Settings State (UI 설정값) ---
  const [selectedModuleType, setSelectedModuleType] = useState('cannon');
  const currentModuleInfo = MODULE_ICONS[selectedModuleType as keyof typeof MODULE_ICONS];
  const currentEffects = MODULE_TYPES[selectedModuleType] || [];
  const maxBans = MAX_BAN_COUNTS[selectedModuleType] || 0;

  const [targetOptions, setTargetOptions] = useState<string[]>([]); 
  const [targetRarityCap, setTargetRarityCap] = useState<number>(RARITY.MYTHIC);

  // [밴 관련 State]
  const [banCount, setBanCount] = useState<number>(0);
  const [bannedOptions, setBannedOptions] = useState<string[]>([]);
  const [isBanMode, setIsBanMode] = useState(false);

  // --- 2. Simulation Hook (엔진 연결) ---
  const { 
    slots, 
    totalCost, 
    isSimulating, 
    startSimulation, 
    stopSimulation, 
    resetSimulation 
  } = useRerollSimulation();

  const lockedCount = slots.filter(s => s.isLocked).length;

  // --- 3. Handlers (UI 조작) ---
  const handleModuleChange = (typeId: string) => {
    if (isSimulating) stopSimulation();
    setSelectedModuleType(typeId);
    
    // 모든 상태 초기화
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
      // 밴 개수가 줄어들면 리스트 자르기
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
        
        if (targetOptions.includes(id)) {
          setTargetOptions(curr => curr.filter(t => t !== id));
        }
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

  const toggleSimulation = () => {
    if (isSimulating) stopSimulation();
    else {
      // 훅에 현재 설정값들을 넘겨주며 시작
      startSimulation(targetOptions, bannedOptions, currentEffects, targetRarityCap, isBanMode);
    }
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">
      
      {/* Left Sidebar */}
      <RerollSidebar 
        selectedModuleType={selectedModuleType}
        onModuleChange={handleModuleChange}
        targetRarityCap={targetRarityCap} 
        lockedCount={lockedCount}
      />

      {/* Right Main Panel */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        
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

        {/* Main Content (Split View) */}
        <div className="flex-1 flex gap-6 min-h-0">
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
            />
          </div>

          <div className="w-1/2 flex flex-col">
            <SlotViewer 
              slots={slots} 
              isSimulating={isSimulating} 
              availableEffects={currentEffects}
              activeCount={targetOptions.length > 0 ? targetOptions.length : 8}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3 shrink-0">
          <Info size={12} />
          <span>Select options to activate slots. Unused slots will be disabled.</span>
        </div>
      </div>
    </div>
  );
}