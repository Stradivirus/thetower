/**
 * 파일명: thetower/front/src/components/Modules/RerollPanel.tsx
 * 용도: 모듈 부옵션 리롤 시뮬레이터의 메인 컨테이너
 * 기능: 모듈 타입 선택, 타겟/밴 리스트 관리, 시뮬레이션 제어 로직 통합 및 하위 컴포넌트(Sidebar, Controls, Viewer) 조율
 */
import { useState } from 'react';
import { Info, BarChart3, Target, Shield, Zap, Cpu } from 'lucide-react';
import { RARITY, MODULE_TYPES } from '../../data/module_reroll_data'; 
import { useRerollSimulation } from '../../hooks/useRerollSimulation';
import RerollControls from './Reroll/RerollControls';
import WishlistSelector from './Reroll/WishlistSelector';
import SlotViewer from './Reroll/SlotViewer';
import RerollSidebar from './Reroll/RerollSidebar'; 
import ManualSelectorModal from './Reroll/ManualSelectorModal'; 

// 모듈 타입별 아이콘 및 테마 설정
const MODULE_ICONS = {
  cannon: { icon: Target, label: 'Cannon', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  armor: { icon: Shield, label: 'Armor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  generator: { icon: Zap, label: 'Generator', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  core: { icon: Cpu, label: 'Core', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

// 연구 등급에 따른 최대 밴(Ban) 가능 개수
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

  // 시뮬레이션 설정 상태
  const [targetOptions, setTargetOptions] = useState<string[]>([]); 
  const [targetRarityCap, setTargetRarityCap] = useState<number>(RARITY.ANCESTRAL);

  // 밴(Ban) 설정 상태
  const [banCount, setBanCount] = useState<number>(0);
  const [bannedOptions, setBannedOptions] = useState<string[]>([]);
  const [isBanMode, setIsBanMode] = useState(false);

  // 수동 선택 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  // 시뮬레이션 엔진 훅 사용
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

  // 현재 활성화된(사용 중인) 슬롯 개수 계산 로직
  const lockedSlots = slots.filter(s => s.isLocked);
  const pendingTargets = targetOptions.filter(t => !lockedSlots.some(s => s.effectId === t));
  const usedSlotCount = lockedSlots.length + pendingTargets.length;

  /** 모듈 타입 변경 시 모든 상태 초기화 */
  const handleModuleChange = (typeId: string) => {
    if (isSimulating) stopSimulation();
    setSelectedModuleType(typeId);
    setTargetOptions([]); 
    setBanCount(0);
    setBannedOptions([]);
    setIsBanMode(false);
    resetSimulation();
  };

  /** 밴 개수 변경 핸들러 */
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

  /** 위시리스트 항목 클릭 핸들러 (타겟 추가 또는 밴 추가) */
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

  /** 슬롯 클릭 시 잠금 해제 또는 수동 선택 모달 오픈 */
  const handleSlotClick = (idx: number) => {
    const slot = slots[idx];
    if (slot.isLocked) {
      manualUnlockSlot(idx);
    } else {
      setSelectedSlotIdx(idx);
      setIsModalOpen(true);
    }
  };

  /** 수동 선택 모달에서 옵션 선택 시 처리 */
  const handleOptionSelect = (effectId: string) => {
    if (selectedSlotIdx === null) return;

    const effectData = currentEffects.find(e => e.id === effectId);
    if (!effectData) return;

    const val = effectData.values[targetRarityCap];
    
    // 1. 해당 슬롯에 옵션 수동 장착
    manualSetSlot(selectedSlotIdx, effectId, targetRarityCap, val, effectData.unit);

    // 2. 위시리스트에 자동으로 추가하여 체크 표시 활성화
    setTargetOptions(prev => {
        if (prev.includes(effectId)) return prev;
        return [...prev, effectId];
    });

    // 3. 중복 방지를 위해 밴 리스트에서 제거
    if (bannedOptions.includes(effectId)) {
        setBannedOptions(prev => prev.filter(id => id !== effectId));
    }

    setIsModalOpen(false);
    setSelectedSlotIdx(null);
  };

  /** 시뮬레이션 시작/정지 토글 */
  const toggleSimulation = () => {
    if (isSimulating) stopSimulation();
    else {
      startSimulation(targetOptions, bannedOptions, currentEffects, targetRarityCap, isBanMode);
    }
  };

  return (
    <div className="flex gap-4 items-start w-full">
      
      {/* 왼쪽 사이드바: 모듈 선택 및 확률/비용 정보 */}
      <RerollSidebar 
        selectedModuleType={selectedModuleType}
        onModuleChange={handleModuleChange}
        targetRarityCap={targetRarityCap} 
        lockedCount={lockedCount}
      />

      {/* 오른쪽 메인 시뮬레이션 패널 */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6">
        
        {/* 상단 헤더: 제목 및 총 소모 비용 */}
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

        {/* 제어부: 등급 설정 및 시뮬레이션 버튼 */}
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

        {/* 메인 콘텐츠: 위시리스트 선택기 및 슬롯 뷰어 */}
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

        {/* 하단 도움말 안내 */}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-800 pt-3 shrink-0">
          <Info size={12} />
          <span>Click a slot to manually lock an effect. Unused slots will be disabled during simulation.</span>
        </div>
      </div>

      {/* 부옵션 수동 선택 모달 */}
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