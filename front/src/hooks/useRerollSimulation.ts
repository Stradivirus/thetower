import { useState, useRef, useEffect, useCallback } from 'react';
import { RARITY, REROLL_COSTS } from '../data/module_reroll_data';
import type { SimulationSlot } from '../components/Modules/Reroll/SlotViewer';

// 등급 뽑기 함수
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
      return item.r > maxCap ? maxCap : item.r;
    }
  }
  return RARITY.COMMON;
};

export function useRerollSimulation() {
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

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setSlots(initialSlots);
    setTotalCost(0);
  }, [stopSimulation]);

  // [New] 수동 장착 기능
  const manualSetSlot = useCallback((slotIdx: number, effectId: string, rarity: number, value: any, unit: string) => {
    setSlots(prev => prev.map((slot, idx) => {
      if (idx === slotIdx) {
        return {
          ...slot,
          effectId,
          rarity,
          value,
          unit,
          isLocked: true // 수동 장착 시 자동 잠금
        };
      }
      return slot;
    }));
  }, []);

  // [New] 슬롯 잠금 해제 기능 (선택 사항: 클릭해서 풀고 싶을 때)
  const manualUnlockSlot = useCallback((slotIdx: number) => {
    setSlots(prev => prev.map((slot, idx) => {
      if (idx === slotIdx) {
        return { ...slot, isLocked: false, effectId: null, value: '-' }; // 초기화
      }
      return slot;
    }));
  }, []);

  const startSimulation = useCallback((
    targetOptions: string[],
    bannedOptions: string[],
    currentEffects: any[],
    targetRarityCap: number,
    isBanMode: boolean
  ) => {
    if (targetOptions.length === 0) {
      // 타겟이 없어도, 수동으로 잠긴 슬롯이 있으면 나머지만 돌릴 수 있어야 함
      // 하지만 보통은 타겟을 정하고 돌리므로 경고 유지, 혹은 정책에 따라 변경 가능
      // 여기서는 타겟 옵션이 없으면 경고
      alert("Please select target options first.");
      return;
    }
    
    // 활성 슬롯(타겟 개수만큼) 체크 -> 수동 장착으로 인해 slots 전체가 활성 대상이 될 수도 있음.
    // 기존 로직: targetOptions.length 만큼만 앞에서부터 사용.
    // 변경 제안: 수동 장착된 슬롯이 있다면, 그 슬롯 뒤쪽까지도 활성화되어야 자연스럽지만,
    // 일단 기존 로직(Target 개수 = 활성 슬롯 개수)을 따르되, 
    // "수동으로 넣은 슬롯이 비활성 영역(Target 개수보다 뒤)에 있다면 무시"되는 구조임.
    // 따라서 사용자는 Target Wishlist에 옵션을 넉넉히 넣어서 슬롯을 열어두고 수동 장착을 해야 함.
    
    const activeSlots = slots.slice(0, targetOptions.length);
    if (activeSlots.every(s => s.isLocked)) return;

    if (isBanMode) {
      alert("Please confirm your Ban Wishlist first.");
      return;
    }

    setIsSimulating(true);
    
    intervalRef.current = setInterval(() => {
      setSlots(prevSlots => {
        const numActive = targetOptions.length;
        
        // 비용 계산
        const currentLockCount = prevSlots.slice(0, numActive).filter(s => s.isLocked).length;
        const costPerRoll = REROLL_COSTS[currentLockCount] || 0;
        setTotalCost(c => c + costPerRoll);

        // 현재 잠긴 옵션 ID 목록 (중복 방지용)
        const activeLockedIds = prevSlots
          .slice(0, numActive)
          .filter(s => s.isLocked && s.effectId)
          .map(s => s.effectId!);

        // 슬롯 업데이트
        const newSlots = prevSlots.map((slot, idx) => {
          if (idx >= numActive) return { ...slot, effectId: null, value: '-', isLocked: false, rarity: 0 }; 
          if (slot.isLocked) return slot; 

          const newRarity = getRandomRarity(targetRarityCap);

          const validOptions = currentEffects.filter(e => {
            if (activeLockedIds.includes(e.id)) return false;
            if (bannedOptions.includes(e.id)) return false;
            if (e.values[newRarity] === null || e.values[newRarity] === undefined) return false;
            return true;
          });

          if (validOptions.length === 0) return slot;

          const newOption = validOptions[Math.floor(Math.random() * validOptions.length)];
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

        const allActiveLocked = newSlots.slice(0, numActive).every(s => s.isLocked);
        if (allActiveLocked) {
          stopSimulation();
        }

        return newSlots;
      });
    }, 20); 
  }, [slots, stopSimulation]);

  useEffect(() => {
    return () => stopSimulation();
  }, [stopSimulation]);

  return {
    slots,
    totalCost,
    isSimulating,
    startSimulation,
    stopSimulation,
    resetSimulation,
    manualSetSlot,   // [New]
    manualUnlockSlot // [New]
  };
}