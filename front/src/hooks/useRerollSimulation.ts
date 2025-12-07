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
      // 선택된 등급이 제한(maxCap)보다 높으면 제한 등급으로 낮춤
      return item.r > maxCap ? maxCap : item.r;
    }
  }
  // 혹시라도 소수점 오차로 빠져나오면 가장 높은 확률인 Common 반환
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

  const startSimulation = useCallback((
    targetOptions: string[],
    bannedOptions: string[],
    currentEffects: any[],
    targetRarityCap: number,
    isBanMode: boolean
  ) => {
    // 1. 유효성 검사
    if (targetOptions.length === 0) {
      alert("Please select target options first.");
      return;
    }
    
    const activeSlots = slots.slice(0, targetOptions.length);
    if (activeSlots.every(s => s.isLocked)) return;

    if (isBanMode) {
      alert("Please confirm your Ban Wishlist first.");
      return;
    }

    // 2. 시뮬레이션 시작
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
          // 비활성 슬롯은 초기화 상태 유지
          if (idx >= numActive) {
            return { ...slot, effectId: null, value: '-', isLocked: false, rarity: 0 }; 
          }

          // 이미 잠긴 슬롯은 패스
          if (slot.isLocked) return slot; 

          // [수정된 로직 1] 등급을 먼저 뽑습니다.
          const newRarity = getRandomRarity(targetRarityCap);

          // [수정된 로직 2] 해당 등급에서 '유효한(값이 있는)' 옵션만 추립니다.
          const validOptions = currentEffects.filter(e => {
            // 잠긴 옵션 제외
            if (activeLockedIds.includes(e.id)) return false;
            // 밴 된 옵션 제외
            if (bannedOptions.includes(e.id)) return false;
            // [중요] 해당 등급에 값이 없는(null) 옵션 제외 (예: Common 죽음극복 방지)
            if (e.values[newRarity] === null || e.values[newRarity] === undefined) return false;
            
            return true;
          });

          // 뽑을 수 있는 옵션이 없으면(매우 드문 경우) 이번 턴은 스킵 (기존 슬롯 유지)
          if (validOptions.length === 0) return slot;

          // [수정된 로직 3] 유효한 옵션 중에서 랜덤 선택
          const newOption = validOptions[Math.floor(Math.random() * validOptions.length)];

          // 타겟 달성 여부 체크
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

        // 종료 조건: 활성 슬롯이 모두 잠기면 정지
        const allActiveLocked = newSlots.slice(0, numActive).every(s => s.isLocked);
        if (allActiveLocked) {
          stopSimulation();
        }

        return newSlots;
      });
    }, 20); // 20ms 간격
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
    resetSimulation
  };
}