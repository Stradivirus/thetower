/**
 * 파일명: thetower/front/src/utils/stoneCalculations.ts
 * 용도: 게임 내 재화인 '스톤(Stones)'의 총 사용량 계산 로직
 * 기능: UW 스탯, 카드 마스터리, 모듈 해금 및 효율 강화 비용 합산
 */
import { useMemo } from 'react';

// 외부 설정 데이터(JSON) 로드
import baseStats from '../data/uw_base_stats.json';
import plusStats from '../data/uw_plus_stats.json';
import cardCosts from '../data/card_mastery_costs.json';
import unlockCosts from '../data/uw_unlock_costs.json';
import moduleCosts from '../data/module_costs.json';

// UW 기본 스탯과 플러스 스탯 데이터를 병합하여 조회 최적화
const allUwKeys = Array.from(new Set([...Object.keys(baseStats), ...Object.keys(plusStats)]));
const uwStatsData: Record<string, any> = {};
allUwKeys.forEach(uwKey => {
    uwStatsData[uwKey] = {
        ...(baseStats as any)[uwKey],
        ...(plusStats as any)[uwKey]
    };
});

/** 
 * 비용 배열에서 특정 레벨까지의 누적 합계를 계산
 */
export const sumCostsUpToLevel = (costs: number[], targetLevel: number) => {
    let sum = 0;
    for (let i = 0; i < targetLevel; i++) {
        sum += costs[i] || 0;
    }
    return sum;
};

// 모듈 관련 상수 데이터 가공
export const MODULE_UNLOCK_COSTS = moduleCosts.unique_effect.map((e: any) => e.cost);
export const MODULE_SLOTS = ['attack', 'defense', 'generator', 'core'];
export const efficiencyCosts = moduleCosts.common_efficiency.levels.map((l: any) => l.cost);

/**
 * 특정 무기(uwKey)의 Base 또는 Plus 스탯 사용 스톤량을 계산
 */
export function calculateUwStones(progress: Record<string, any>, uwKey: string, category: 'base' | 'plus'): number {
  const statsSource = category === 'base' ? (baseStats as Record<string, any>) : (plusStats as Record<string, any>);
  const data = statsSource[uwKey] || {};
  let sum = 0;
  Object.entries(data).forEach(([statName, detail]: [string, any]) => {
    const key = `${category}_${uwKey}_${statName}`;
    const level = progress[key] || 0;
    if (level > 0 && detail.costs) {
      sum += sumCostsUpToLevel(detail.costs, level);
    }
  });
  return sum;
}

/**
 * 특정 모듈 슬롯(attack, defense, generator, core)의 강화 사용 스톤량을 계산
 */
export function calculateModuleSlotEfficiencyStones(progress: Record<string, any>, slotId: string, statType?: 'main' | 'sub'): number {
  let sum = 0;
  if (!statType || statType === 'main') {
    const mainLv = progress[`module_${slotId}_main`] || 0;
    if (mainLv > 0) sum += sumCostsUpToLevel(efficiencyCosts, mainLv);
  }
  if (!statType || statType === 'sub') {
    let subLv = progress[`module_${slotId}_sub`] || 0;
    if (subLv > 70) subLv = 70;
    if (subLv > 0) sum += sumCostsUpToLevel(efficiencyCosts, subLv);
  }
  return sum;
}

/**
 * Unlock 탭의 세부 항목별 스톤량 계산
 */
export function calculateUnlockDetailStones(progress: Record<string, any>) {
  const unlockedBase = progress['unlocked_weapons'] || [];
  const baseUnlock = unlockedBase.reduce((acc: number, _: any, idx: number) => acc + (unlockCosts.unlock_costs[idx] || 0), 0);

  const unlockedPlus = progress['unlocked_plus_weapons'] || [];
  const plusUnlock = unlockedPlus.reduce((acc: number, _: any, idx: number) => acc + (unlockCosts.plus_unlock_costs[idx] || 0), 0);

  let moduleSlots = 0;
  MODULE_SLOTS.forEach(id => {
    const level = progress[`module_unlock_${id}`] || 0;
    for (let i = 0; i < level; i++) {
      moduleSlots += MODULE_UNLOCK_COSTS[i] || 0;
    }
  });

  const botsList = ['golden', 'amplify', 'thunder', 'flame', 'bot'];
  let bots = 0;
  let unlockedBotsCount = 0;
  botsList.forEach(botId => {
    if (progress[`bot_plus_${botId}`] === 1) {
      bots += 1250;
      unlockedBotsCount++;
    }
  });
  if (unlockedBotsCount === botsList.length) {
    const synchLevel = progress['bot_synchronicity'] || 0;
    bots += synchLevel * 1500;
  }

  return {
    baseUnlock,
    plusUnlock,
    moduleSlots,
    bots
  };
}

/** 
 * [커스텀 훅] 탭별(Unlock, Base, Plus, Card, Module) 사용된 스톤량을 계산
 * @param progress 사용자의 게임 진행 데이터 객체
 * @returns 탭별 사용 스톤량 객체 ({ unlock, base, plus, card, module })
 */
export function useTabStones(progress: Record<string, any>): Record<string, number> {
  return useMemo(() => {
    let unlock = 0;
    let base = 0;
    let plus = 0;
    let card = 0;
    let module = 0;

    // 1. UW Base Stats 누적 비용 계산
    Object.entries(baseStats as Record<string, any>).forEach(([uwKey, stats]) => {
      Object.entries(stats as Record<string, any>).forEach(([statName, detail]) => {
        const key = `base_${uwKey}_${statName}`;
        const level = progress[key];
        if (typeof level === 'number' && level > 0 && detail.costs) {
          base += sumCostsUpToLevel(detail.costs, level);
        }
      });
    });

    // 1.5. UW Plus Stats 누적 비용 계산
    Object.entries(plusStats as Record<string, any>).forEach(([uwKey, stats]) => {
      Object.entries(stats as Record<string, any>).forEach(([statName, detail]) => {
        const key = `plus_${uwKey}_${statName}`;
        const level = progress[key];
        if (typeof level === 'number' && level > 0 && detail.costs) {
          plus += sumCostsUpToLevel(detail.costs, level);
        }
      });
    });

    // 2. 카드 마스터리 비용 합산
    cardCosts.forEach((cardItem: any) => {
      if (progress[`card_${cardItem.name}`] === 1) {
        card += cardItem.cost;
      }
    });

    // 3. UW 및 UW+ 해금 비용 합산
    const unlockedBase = progress['unlocked_weapons'] || [];
    unlockedBase.forEach((_: any, index: number) => {
      unlock += unlockCosts.unlock_costs[index] || 0;
    });
    const unlockedPlus = progress['unlocked_plus_weapons'] || [];
    unlockedPlus.forEach((_: any, index: number) => {
      unlock += unlockCosts.plus_unlock_costs[index] || 0;
    });

    // 4. 모듈 슬롯 등급(해금) 비용 합산
    MODULE_SLOTS.forEach(id => {
      const level = progress[`module_unlock_${id}`] || 0;
      for (let i = 0; i < level; i++) {
        unlock += MODULE_UNLOCK_COSTS[i] || 0;
      }
    });

    // 4.5. 신규 Bot+ 해금 및 동기화 비용 합산
    const botsList = ['golden', 'amplify', 'thunder', 'flame', 'bot'];
    let unlockedBotsCount = 0;
    botsList.forEach(botId => {
      if (progress[`bot_plus_${botId}`] === 1) {
        unlock += 1250;
        unlockedBotsCount++;
      }
    });
    if (unlockedBotsCount === botsList.length) {
      const synchLevel = progress['bot_synchronicity'] || 0;
      unlock += synchLevel * 1500;
    }

    // 5. 모듈 효율 강화(Main/Sub) 비용 합산
    const efficiencyKeys = Object.keys(progress).filter(key => key.startsWith('module_') && !key.startsWith('module_unlock_'));
    
    efficiencyKeys.forEach(key => {
      let level = progress[key] || 0;
      const isSub = key.endsWith('_sub');
      if (isSub && level > 70) {
        level = 70; // 서브 스탯 계산 상한선 적용 (displayLevel 69에 대응)
      }
      module += sumCostsUpToLevel(efficiencyCosts, level);
    });

    return { unlock, base, plus, card, module };
  }, [progress]);
}

/** 
 * [커스텀 훅] 현재 사용자의 진행 상황(progress)을 기반으로 총 사용된 스톤량을 계산
 * @param progress 사용자의 게임 진행 데이터 객체
 * @returns 총 사용 스톤량 (number)
 */
export function useTotalStones(progress: Record<string, any>): number {
  const tabStones = useTabStones(progress);
  return useMemo(() => {
    return Object.values(tabStones).reduce((a, b) => a + b, 0);
  }, [tabStones]);
}