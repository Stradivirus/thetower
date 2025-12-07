import { useState, useEffect, useRef } from 'react';
import { 
  Info, BarChart3, Target, Shield, Zap, Cpu
} from 'lucide-react';
import { 
  RARITY, 
  REROLL_COSTS, 
  MODULE_TYPES 
} from '../../../data/module_reroll_data'; 

import RerollControls from './RerollControls';
import WishlistSelector from './WishlistSelector';
import SlotViewer from './SlotViewer';
import RerollSidebar from './RerollSidebar'; // 사이드바 분리됨
import type { SimulationSlot } from './SlotViewer'; 

const MODULE_ICONS = {
  cannon: { icon: Target, label: 'Cannon', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  armor: { icon: Shield, label: 'Armor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  generator: { icon: Zap, label: 'Generator', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  core: { icon: Cpu, label: 'Core', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

// [수정] maxCap(최대 허용 등급)을 받아 그 이상은 나오지 않도록 제한
const getRandomRarity = (maxCap: number) => {
  const rand = Math.random() * 100;
  let accumulated = 0;
  const chances = [
    { r: RARITY.COMMON, c: 46.2 },
    { r: RARITY.RARE, c: 40.0 },
    { r: RARITY.EPIC, c: 10.0 },
    { r: RARITY.LEGENDARY, c: 2.5 },
    { r: RARITY.MYTHIC, c: 1.0 },
    { r: RARITY.ANCESTRAL, c: 0.3 }
  ];

  for (const item of chances) {
    accumulated += item.c;
    if (rand <= accumulated) {
      // [핵심 로직] 만약 뽑힌 등급(item.r)이 사용자가 정한 최대 등급(maxCap)보다 높으면?
      // -> 최대 등급으로 고정 (예: Mythic 설정 시 Ancestral 확률은 Mythic으로 흡수됨)
      return item.r > maxCap ? maxCap : item.r;
    }
  }
  return RARITY.COMMON;
};

const getRandomOption = (lockedEffectIds: string[], optionList: any[]) => {
  const available = optionList.filter(e => !lockedEffectIds.includes(e.id));
  if (available.length === 0) return null;
  const randIndex = Math.floor(Math.random() * available.length);
  return available[randIndex];
};

export default function RerollPanel() {
  // --- UI State ---
  const [selectedModuleType, setSelectedModuleType] = useState('cannon');
  const currentModuleInfo = MODULE_ICONS[selectedModuleType as keyof typeof MODULE_ICONS];
  const currentEffects = MODULE_TYPES[selectedModuleType] || [];

  // --- Settings State ---
  const [targetOptions, setTargetOptions] = useState<string[]>([]); 
  
  // [의미 변경] minTargetRarity 변수는 이제 '현재 모듈의 등급(Max Cap)'이자 '목표 등급' 역할을 동시에 합니다.
  const [targetRarityCap, setTargetRarityCap] = useState<number>(RARITY.MYTHIC);
  
  // --- Simulation State ---
  const initialSlots: SimulationSlot[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    effectId: null,
    rarity: 0,
    value: '-',
    unit: '',
    isLocked: false 
  }));

  const [slots, setSlots] = useState<SimulationSlot[]>(initialSlots);
  const [totalCost, setTotalCost] = useState(0); 
  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const lockedCount = slots.filter(s => s.isLocked).length;

  // --- Handlers ---
  const handleModuleChange = (typeId: string) => {
    if (isSimulating) stopSimulation();
    setSelectedModuleType(typeId);
    setTargetOptions([]); 
    setSlots(initialSlots);
    setTotalCost(0);
  };

  const toggleTargetOption = (id: string) => {
    setTargetOptions(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 8) return prev; 
      return [...prev, id];
    });
  };

  const toggleSimulation = () => {
    if (isSimulating) stopSimulation();
    else startSimulation();
  };

  const startSimulation = () => {
    if (targetOptions.length === 0) {
      alert("Please select target options first.");
      return;
    }
    if (slots.every(s => s.isLocked)) return;

    setIsSimulating(true);
    
    intervalRef.current = setInterval(() => {
      setSlots(prevSlots => {
        const lockedIds = prevSlots.filter(s => s.isLocked && s.effectId).map(s => s.effectId!);
        const currentLockCount = prevSlots.filter(s => s.isLocked).length;
        const costPerRoll = REROLL_COSTS[currentLockCount] || 0;
        setTotalCost(c => c + costPerRoll);

        const newSlots = prevSlots.map(slot => {
          if (slot.isLocked) return slot; 

          const newOption = getRandomOption(lockedIds, currentEffects);
          if (!newOption) return slot;

          // [수정] targetRarityCap을 인자로 넘겨 그 이상의 등급은 나오지 않게 함
          const newRarity = getRandomRarity(targetRarityCap);
          
          // 조건 충족 확인: 옵션이 일치하고 && 등급이 정확히 목표 등급(Max Cap)에 도달했는지 확인
          // (Max Cap으로 제한했으므로 >= 대신 == 를 써도 되지만 안전하게 >= 유지)
          const isTargetMet = targetOptions.includes(newOption.id) && newRarity >= targetRarityCap;

          return {
            ...slot,
            effectId: newOption.id,
            rarity: newRarity,
            value: newOption.values[newRarity], 
            unit: newOption.unit,
            isLocked: isTargetMet 
          };
        });

        if (newSlots.every(s => s.isLocked)) {
          stopSimulation();
        }

        return newSlots;
      });
    }, 50); 
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  const resetAll = () => {
    stopSimulation();
    setSlots(initialSlots);
    setTotalCost(0);
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">
      
      {/* === [좌측] 분리된 사이드바 === */}
      <RerollSidebar 
        selectedModuleType={selectedModuleType}
        onModuleChange={handleModuleChange}
        targetRarityCap={targetRarityCap} // 현재 선택된 등급 전달
        lockedCount={lockedCount}
      />

      {/* === [우측] 메인 패널 === */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
        
        {/* Header Area */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${currentModuleInfo.bg} ${currentModuleInfo.color} border-current uppercase`}>
              SIMULATOR
            </span>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               {currentModuleInfo.label} Module
            </h2>
          </div>

          {/* [복구됨] 우측 상단 Total Spent 표시 */}
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

        {/* 1. Controls */}
        <div className="shrink-0 mb-4">
          <RerollControls 
              minTargetRarity={targetRarityCap} // 이름은 유지하되 의미는 Max Cap
              setMinTargetRarity={setTargetRarityCap}
              isSimulating={isSimulating}
              toggleSimulation={toggleSimulation}
              canRoll={!slots.every(s => s.isLocked)}
              onReset={resetAll}
            />
        </div>

        {/* 2. Main Content */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* [Left] Wishlist */}
          <div className="w-1/2 flex flex-col border-r border-slate-800 pr-6">
            <WishlistSelector 
              targetOptions={targetOptions}
              toggleTargetOption={toggleTargetOption}
              isSimulating={isSimulating}
              availableEffects={currentEffects} 
            />
          </div>

          {/* [Right] Slots */}
          <div className="w-1/2 flex flex-col">
            <SlotViewer 
              slots={slots} 
              isSimulating={isSimulating} 
              availableEffects={currentEffects}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3 shrink-0">
          <Info size={12} />
          <span>Select options (Left), choose Module Grade (Top), and Roll. Higher grade options will not appear.</span>
        </div>
      </div>

    </div>
  );
}