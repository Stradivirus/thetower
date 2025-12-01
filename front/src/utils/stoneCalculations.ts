import { useMemo } from 'react';

// --- Import 모든 비용 데이터 ---
import baseStats from '../data/uw_base_stats.json';
import plusStats from '../data/uw_plus_stats.json';
import cardCosts from '../data/card_mastery_costs.json';
import unlockCosts from '../data/uw_unlock_costs.json';
import moduleCosts from '../data/module_costs.json';
// ------------------------------------

// UW Base Stats와 UW+ Stats를 안전하게 병합
const allUwKeys = Array.from(new Set([...Object.keys(baseStats), ...Object.keys(plusStats)]));
const uwStatsData: Record<string, any> = {};
allUwKeys.forEach(uwKey => {
    uwStatsData[uwKey] = {
        ...(baseStats as any)[uwKey],
        ...(plusStats as any)[uwKey]
    };
});

// Helper Function: 비용 배열에서 목표 레벨까지의 누적 비용 계산 (level 1 비용부터 합산)
const sumCostsUpToLevel = (costs: number[], targetLevel: number) => {
    let sum = 0;
    for (let i = 0; i < targetLevel; i++) {
        sum += costs[i] || 0;
    }
    return sum;
};

// Module cost data
const MODULE_UNLOCK_COSTS = moduleCosts.unique_effect.map((e: any) => e.cost);
const MODULE_SLOTS = ['attack', 'defense', 'generator', 'core'];
const efficiencyCosts = moduleCosts.common_efficiency.levels.map((l: any) => l.cost);

// Custom Hook: 현재 진행 상황(progress)을 기반으로 총 사용 스톤량을 계산
export function useTotalStones(progress: Record<string, any>): number {
  return useMemo(() => {
    let total = 0;

    // 1. UW Base & Plus Stats 누적 비용 (핵심 수정 영역)
    Object.entries(progress).forEach(([key, level]) => {
        if (typeof level !== 'number' || level <= 0) return;

        if (key.startsWith('base_') || key.startsWith('plus_')) {
            const parts = key.split('_'); 
            
            // statKey는 항상 마지막 파트입니다 (예: 'damage')
            const statKey = parts[parts.length - 1]; 
            
            // uwKey는 첫 번째 카테고리와 마지막 스탯을 제외한 모든 중간 파트를 합친 것입니다 (예: 'death_wave')
            const uwKeyParts = parts.slice(1, parts.length - 1); 
            const uwKey = uwKeyParts.join('_'); 

            // 수정된 uwKey로 비용 데이터 조회
            const costs = uwStatsData[uwKey]?.[statKey]?.costs;

            if (costs) {
                total += sumCostsUpToLevel(costs, level); 
            }
        }
    });

    // 2. Card Mastery 비용
    cardCosts.forEach((card: any) => {
        if (progress[`card_${card.name}`] === 1) {
            total += card.cost;
        }
    });

    // 3. UW Unlock / UW+ Unlock 비용
    const unlockedBase = progress['unlocked_weapons'] || [];
    unlockedBase.forEach((_: any, index: number) => {
        total += unlockCosts.unlock_costs[index] || 0;
    });
    const unlockedPlus = progress['unlocked_plus_weapons'] || [];
    unlockedPlus.forEach((_: any, index: number) => {
        total += unlockCosts.plus_unlock_costs[index] || 0;
    });

    // 4. Module Slot Rarity (해금) 비용
    MODULE_SLOTS.forEach(id => {
        const level = progress[`module_unlock_${id}`] || 0;
        for (let i = 0; i < level; i++) {
            total += MODULE_UNLOCK_COSTS[i] || 0;
        }
    });

    // 5. Module Efficiency 비용 (Main/Sub)
    const efficiencyKeys = Object.keys(progress).filter(key => key.startsWith('module_') && !key.startsWith('module_unlock_'));
    
    efficiencyKeys.forEach(key => {
        const level = progress[key] || 0;
        total += sumCostsUpToLevel(efficiencyCosts, level);
    });

    return total;
  }, [progress]);
}