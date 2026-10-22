/**
 * 파일명: thetower/front/src/utils/stonePlanCalculations.ts
 * 용도: 스톤 업그레이드 계획표(Plan) 시뮬레이션 및 단계별 비용 계산 로직
 * 기능: 실제 진행도(realProgress)와 계획 목록(plan)을 바탕으로 가상 진행도, 단계별/누적 스톤 비용 산출
 */
import baseStats from '../data/uw_base_stats.json';
import plusStats from '../data/uw_plus_stats.json';
import cardCosts from '../data/card_mastery_costs.json';
import unlockCosts from '../data/uw_unlock_costs.json';
import moduleCosts from '../data/module_costs.json';
import { T } from '../locales';
import { sumCostsUpToLevel, MODULE_UNLOCK_COSTS, efficiencyCosts } from './stoneCalculations';

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

    // 1. UW Base / Plus 스탯 (항상 +1 레벨씩 단일 단계로 평가)
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
        const maxLv = detail?.costs?.length || 0;
        const toLv = fromLv + 1;

        if (detail && toLv <= maxLv) {
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
    // 4. 모듈 슬롯 등급 해금 (항상 +1 등급씩 단일 단계로 평가)
    else if (key.startsWith('module_unlock_')) {
      const slotId = key.replace('module_unlock_', '');
      const fromLv = Number(simProgress[key] || 0);
      const toLv = fromLv + 1;
      if (toLv <= MODULE_UNLOCK_COSTS.length) {
        cost = MODULE_UNLOCK_COSTS[fromLv] || 0;
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
    // 6. Bot Synchronicity (항상 +1 레벨씩 단일 단계로 평가)
    else if (key === 'bot_synchronicity') {
      const fromLv = Number(simProgress[key] || 0);
      const toLv = fromLv + 1;
      if (toLv <= 4) {
        cost = 1500;
        categoryLabel = 'Unlock';
        title = 'Bot Synchronicity';
        stepDesc = `Lv.${fromLv} → Lv.${toLv}`;
        valueDesc = `${toLv + 1} Slots Sync`;
        simProgress[key] = toLv;
      }
    }
    // 7. 모듈 효율 강화 (module_{type}_{main|sub}, 항상 +1 레벨씩 단일 단계로 평가)
    else if (key.startsWith('module_')) {
      const parts = key.split('_'); // ['module', slotId, statType]
      const slotId = parts[1] || '';
      const statType = parts[2] || 'main';
      const fromLv = Number(simProgress[key] || 0);
      const maxAllowed = statType === 'sub' ? 70 : efficiencyCosts.length;
      const toLv = fromLv + 1;
      if (toLv <= maxAllowed) {
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
