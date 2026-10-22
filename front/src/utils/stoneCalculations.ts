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
import { T } from '../locales';

export interface StonePlanItem {
  id: string;
  category: 'unlock' | 'base' | 'plus' | 'card' | 'module';
  key: string;
  targetValue: any;
}

export interface EvaluatedPlanItem extends StonePlanItem {
  index: number;
  categoryLabel: string;
  title: string;
  stepDesc: string;
  valueDesc: string;
  cost: number;
  cumulativeCost: number;
}

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

const formatUwName = (uwKey: string): string => {
  const localized = (T.data as any)?.UW_NAMES?.[uwKey];
  if (localized) return localized;
  return uwKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatDispLevel = (lv: number): string => {
  if (lv <= 0) return 'Lv.0';
  if (lv === 1) return 'Base';
  return `Lv.${lv - 1}`;
};

const MODULE_RARITY_LABELS = ['Locked', 'Epic', 'Legendary', 'Mythic', 'Ancestral'];
const BOT_LABELS: Record<string, string> = {
  golden: 'Golden Bot +',
  amplify: 'Amplify Bot +',
  thunder: 'Thunder Bot +',
  flame: 'Flame Bot +',
  bot: 'Bot Bot +',
};

/**
 * 실제 진행도(realProgress)와 계획 목록(plan)을 기반으로
 * 1) 계획이 모두 반영된 가상 진행도(effectiveProgress)
 * 2) 단계별 비용 및 누적 비용이 계산된 리스트(evaluatedItems)
 * 3) 총 필요 스톤 합계(totalPlanStones)를 반환합니다.
 */
export function evaluateStonePlan(realProgress: Record<string, any>, plan: StonePlanItem[] = []) {
  const simProgress: Record<string, any> = {
    ...realProgress,
    unlocked_weapons: Array.isArray(realProgress['unlocked_weapons']) ? [...realProgress['unlocked_weapons']] : [],
    unlocked_plus_weapons: Array.isArray(realProgress['unlocked_plus_weapons']) ? [...realProgress['unlocked_plus_weapons']] : [],
  };

  const evaluatedItems: EvaluatedPlanItem[] = [];
  let cumulativeCost = 0;

  plan.forEach((item) => {
    const { key, targetValue } = item;
    let cost = 0;
    let categoryLabel = '';
    let title = key;
    let stepDesc = '';
    let valueDesc = '-';

    // 1. UW Base / Plus 스탯
    if (key.startsWith('base_') || key.startsWith('plus_')) {
      const isPlus = key.startsWith('plus_');
      const prefix = isPlus ? 'plus_' : 'base_';
      const rest = key.slice(prefix.length);
      const statsSource = isPlus ? (plusStats as Record<string, any>) : (baseStats as Record<string, any>);
      const matchedUw = Object.keys(statsSource).find(uw => rest === uw || rest.startsWith(`${uw}_`));

      if (matchedUw) {
        const statName = rest.slice(matchedUw.length + 1);
        const detail = statsSource[matchedUw]?.[statName];
        const fromLv = Number(simProgress[key] || 0);
        const toLv = Number(targetValue || 0);

        if (detail && toLv > fromLv) {
          cost = sumCostsUpToLevel(detail.costs || [], toLv) - sumCostsUpToLevel(detail.costs || [], fromLv);
          categoryLabel = isPlus ? 'UW+' : 'Base UW';
          let statDispName = detail.name || statName;
          if (isPlus) {
            const locPlus = (T.data as any)?.UW_PLUS?.[matchedUw]?.[statName];
            if (locPlus?.name) statDispName = locPlus.name;
          }
          title = `${formatUwName(matchedUw)} - ${statDispName}`;
          stepDesc = `${formatDispLevel(fromLv)} → ${formatDispLevel(toLv)}`;
          const fromVal = fromLv > 0 ? detail.values?.[fromLv - 1] : '-';
          const toVal = detail.values?.[toLv - 1] ?? '-';
          const unit = detail.unit ? `${detail.unit}` : '';
          valueDesc = `${fromVal}${fromVal !== '-' ? unit : ''} → ${toVal}${unit}`;
          simProgress[key] = toLv;
        }
      }
    }
    // 2. 카드 마스터리
    else if (key.startsWith('card_')) {
      const cardName = key.replace('card_', '');
      const cardObj = (cardCosts as any[]).find(c => c.name === cardName);
      const fromVal = Number(simProgress[key] || 0);
      const toVal = Number(targetValue || 0);
      if (cardObj && fromVal === 0 && toVal === 1) {
        cost = cardObj.cost || 0;
        categoryLabel = 'Card';
        const locCard = (T.data as any)?.CARDS?.[cardName];
        title = locCard?.name || cardName;
        stepDesc = 'Mastery Unlock';
        valueDesc = locCard?.desc ? locCard.desc : 'Mastery';
        simProgress[key] = 1;
      }
    }
    // 3. 기본 무기 / UW+ 해금
    else if (key === 'unlocked_weapons' || key === 'unlocked_plus_weapons') {
      const isPlus = key === 'unlocked_plus_weapons';
      const currentList: string[] = Array.isArray(simProgress[key]) ? simProgress[key] : [];
      const addedWeapons: string[] = Array.isArray(targetValue)
        ? targetValue.filter((w: string) => !currentList.includes(w))
        : [];

      if (addedWeapons.length > 0) {
        const costTable = isPlus ? unlockCosts.plus_unlock_costs : unlockCosts.unlock_costs;
        const startIdx = currentList.length;
        const endIdx = startIdx + addedWeapons.length;
        for (let i = startIdx; i < endIdx; i++) {
          cost += costTable[i] || 0;
        }
        categoryLabel = 'Unlock';
        title = isPlus ? 'UW+ Unlock' : 'Ultimate Weapon Unlock';
        stepDesc = addedWeapons.length === 1
          ? `#${startIdx + 1} 해금`
          : `#${startIdx + 1} ~ #${endIdx} 해금`;
        valueDesc = addedWeapons.map(formatUwName).join(', ');
        simProgress[key] = [...currentList, ...addedWeapons];
      }
    }
    // 4. 모듈 슬롯 등급 해금
    else if (key.startsWith('module_unlock_')) {
      const slotId = key.replace('module_unlock_', '');
      const fromLv = Number(simProgress[key] || 0);
      const toLv = Number(targetValue || 0);
      if (toLv > fromLv) {
        for (let i = fromLv; i < toLv; i++) {
          cost += MODULE_UNLOCK_COSTS[i] || 0;
        }
        categoryLabel = 'Unlock';
        const slotLabel = slotId.charAt(0).toUpperCase() + slotId.slice(1);
        title = `${slotLabel} Module Slot`;
        stepDesc = `${MODULE_RARITY_LABELS[fromLv] || fromLv} → ${MODULE_RARITY_LABELS[toLv] || toLv}`;
        valueDesc = 'Assist Slot Tier';
        simProgress[key] = toLv;
      }
    }
    // 5. Bot+ 해금
    else if (key.startsWith('bot_plus_')) {
      const botId = key.replace('bot_plus_', '');
      const fromVal = Number(simProgress[key] || 0);
      const toVal = Number(targetValue || 0);
      if (fromVal === 0 && toVal === 1) {
        cost = 1250;
        categoryLabel = 'Unlock';
        title = BOT_LABELS[botId] || `Bot+ (${botId})`;
        stepDesc = 'Bot+ Unlock';
        valueDesc = 'Unlocked';
        simProgress[key] = 1;
      }
    }
    // 6. Bot Synchronicity
    else if (key === 'bot_synchronicity') {
      const fromLv = Number(simProgress[key] || 0);
      const toLv = Number(targetValue || 0);
      if (toLv > fromLv) {
        cost = (toLv - fromLv) * 1500;
        categoryLabel = 'Unlock';
        title = 'Bot Synchronicity';
        stepDesc = `Lv.${fromLv} → Lv.${toLv}`;
        valueDesc = `${toLv + 1} Slots Sync`;
        simProgress[key] = toLv;
      }
    }
    // 7. 모듈 효율 강화 (module_{type}_{main|sub})
    else if (key.startsWith('module_')) {
      const parts = key.split('_'); // ['module', slotId, statType]
      const slotId = parts[1] || '';
      const statType = parts[2] || 'main';
      const fromLv = Number(simProgress[key] || 0);
      const toLv = Number(targetValue || 0);
      if (toLv > fromLv) {
        cost = sumCostsUpToLevel(efficiencyCosts, toLv) - sumCostsUpToLevel(efficiencyCosts, fromLv);
        categoryLabel = 'Module';
        const slotLabel = slotId.charAt(0).toUpperCase() + slotId.slice(1);
        const statLabel = statType === 'sub' ? 'Sub Stat' : 'Main Stat';
        title = `${slotLabel} - ${statLabel} Efficiency`;
        stepDesc = `${formatDispLevel(fromLv)} → ${formatDispLevel(toLv)}`;
        const levelsArr = moduleCosts.common_efficiency.levels;
        const fromVal = fromLv > 0 ? `${levelsArr[fromLv - 1]?.value ?? '-'}%` : '-';
        const toVal = `${levelsArr[toLv - 1]?.value ?? '-'}%`;
        valueDesc = `${fromVal} → ${toVal}`;
        simProgress[key] = toLv;
      }
    }

    if (cost > 0) {
      cumulativeCost += cost;
      evaluatedItems.push({
        ...item,
        index: evaluatedItems.length + 1,
        categoryLabel,
        title,
        stepDesc,
        valueDesc,
        cost,
        cumulativeCost,
      });
    }
  });

  return {
    effectiveProgress: simProgress,
    evaluatedItems,
    totalPlanStones: cumulativeCost,
  };
}