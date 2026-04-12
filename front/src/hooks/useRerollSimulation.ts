/**
 * 파일명: thetower/front/src/hooks/useRerollSimulation.ts
 * 용도: 모듈 부옵션 리롤(Reroll) 시뮬레이션 로직
 * 기능: 확률 기반 옵션 추출, 슬롯 잠금 관리, 시뮬레이션 상태 및 비용 추적
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { RARITY, REROLL_COSTS } from '../data/module_reroll_data';
import type { SimulationSlot } from '../components/Modules/Reroll/SlotViewer';

/** 
 * 설정된 확률표에 따라 랜덤한 등급(Rarity)을 반환합니다.
 * @param maxCap 허용되는 최대 등급
 */
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

// 초기 슬롯 상태 (8개 슬롯) — 훅 외부 상수로 분리하여 렌더마다 재생성 방지
const INITIAL_SLOTS: SimulationSlot[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  effectId: null,
  rarity: 0,
  value: '-',
  unit: '',
  isLocked: false
}));

/**
 * 리롤 시뮬레이션 관리를 위한 커스텀 훅
 */
export function useRerollSimulation() {

  const [slots, setSlots] = useState<SimulationSlot[]>(INITIAL_SLOTS);
  const [totalCost, setTotalCost] = useState(0); 
  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<number | null>(null);

  /** 시뮬레이션을 중단합니다. */
  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  /** 상태를 초기화합니다. */
  const resetSimulation = useCallback(() => {
    stopSimulation();
    setSlots(INITIAL_SLOTS);
    setTotalCost(0);
  }, [stopSimulation]);

  /** 특정 슬롯에 옵션을 수동으로 설정(장착)합니다. */
  const manualSetSlot = useCallback((slotIdx: number, effectId: string, rarity: number, value: any, unit: string) => {
    setSlots(prev => prev.map((slot, idx) => {
      if (idx === slotIdx) {
        return {
          ...slot,
          effectId,
          rarity,
          value,
          unit,
          isLocked: true // 수동 장착 시 자동 잠금 처리
        };
      }
      return slot;
    }));
  }, []);

  /** 특정 슬롯의 잠금을 해제하고 초기화합니다. */
  const manualUnlockSlot = useCallback((slotIdx: number) => {
    setSlots(prev => prev.map((slot, idx) => {
      if (idx === slotIdx) {
        return { ...slot, isLocked: false, effectId: null, value: '-' }; 
      }
      return slot;
    }));
  }, []);

  /** 
   * 리롤 시뮬레이션을 시작합니다. 
   * 20ms 간격으로 옵션을 무작위 추출하며 타겟 등급 이상이 나오면 해당 슬롯을 잠급니다.
   */
  const startSimulation = useCallback((
    targetOptions: string[],
    bannedOptions: string[],
    currentEffects: any[],
    targetRarityCap: number,
    isBanMode: boolean
  ): boolean => {
    if (targetOptions.length === 0) return false;

    const activeSlots = slots.slice(0, targetOptions.length);
    if (activeSlots.every(s => s.isLocked)) return false;

    if (isBanMode) return false;

    setIsSimulating(true);
    
    intervalRef.current = setInterval(() => {
      setSlots(prevSlots => {
        const numActive = targetOptions.length;
        
        // 잠금 개수에 따른 리롤 비용 누적
        const currentLockCount = prevSlots.slice(0, numActive).filter(s => s.isLocked).length;
        const costPerRoll = REROLL_COSTS[currentLockCount] || 0;
        setTotalCost(c => c + costPerRoll);

        // 현재 잠긴 옵션 목록 (중복 옵션 추출 방지)
        const activeLockedIds = prevSlots
          .slice(0, numActive)
          .filter(s => s.isLocked && s.effectId)
          .map(s => s.effectId!);

        const newSlots = prevSlots.map((slot, idx) => {
          if (idx >= numActive) return { ...slot, effectId: null, value: '-', isLocked: false, rarity: 0 }; 
          if (slot.isLocked) return slot; 

          const newRarity = getRandomRarity(targetRarityCap);

          // 밴 옵션 및 중복 옵션 제외한 유효 옵션 리스트 필터링
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

        // 모든 활성 슬롯이 잠기면 시뮬레이션 종료
        const allActiveLocked = newSlots.slice(0, numActive).every(s => s.isLocked);
        if (allActiveLocked) {
          stopSimulation();
        }

        return newSlots;
      });
    }, 20);
    return true;
  }, [slots, stopSimulation]);

  // 컴포넌트 언마운트 시 인터벌 정리
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
    manualSetSlot,
    manualUnlockSlot
  };
}