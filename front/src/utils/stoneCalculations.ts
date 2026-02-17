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
 * 비용 배열에서 특정 레벨까지의 누적 합계를 계산합니다.
 */
const sumCostsUpToLevel = (costs: number[], targetLevel: number) => {
    let sum = 0;
    for (let i = 0; i < targetLevel; i++) {
        sum += costs[i] || 0;
    }
    return sum;
};

// 모듈 관련 상수 데이터 가공
const MODULE_UNLOCK_COSTS = moduleCosts.unique_effect.map((e: any) => e.cost);
const MODULE_SLOTS = ['attack', 'defense', 'generator', 'core'];
const efficiencyCosts = moduleCosts.common_efficiency.levels.map((l: any) => l.cost);

/** 
 * [커스텀 훅] 현재 사용자의 진행 상황(progress)을 기반으로 총 사용된 스톤량을 계산합니다.
 * @param progress 사용자의 게임 진행 데이터 객체
 * @returns 총 사용 스톤량 (number)
 */
export function useTotalStones(progress: Record<string, any>): number {
  return useMemo(() => {
    let total = 0;

    // 1. UW Base & Plus Stats 누적 비용 계산
    Object.entries(progress).forEach(([key, level]) => {
        if (typeof level !== 'number' || level <= 0) return;

        if (key.startsWith('base_') || key.startsWith('plus_')) {
            const parts = key.split('_'); 
            const statKey = parts[parts.length - 1]; 
            const uwKeyParts = parts.slice(1, parts.length - 1); 
            const uwKey = uwKeyParts.join('_'); 

            const costs = uwStatsData[uwKey]?.[statKey]?.costs;
            if (costs) {
                total += sumCostsUpToLevel(costs, level); 
            }
        }
    });

    // 2. 카드 마스터리 비용 합산
    cardCosts.forEach((card: any) => {
        if (progress[`card_${card.name}`] === 1) {
            total += card.cost;
        }
    });

    // 3. UW 및 UW+ 해금 비용 합산
    const unlockedBase = progress['unlocked_weapons'] || [];
    unlockedBase.forEach((_: any, index: number) => {
        total += unlockCosts.unlock_costs[index] || 0;
    });
    const unlockedPlus = progress['unlocked_plus_weapons'] || [];
    unlockedPlus.forEach((_: any, index: number) => {
        total += unlockCosts.plus_unlock_costs[index] || 0;
    });

    // 4. 모듈 슬롯 등급(해금) 비용 합산
    MODULE_SLOTS.forEach(id => {
        const level = progress[`module_unlock_${id}`] || 0;
        for (let i = 0; i < level; i++) {
            total += MODULE_UNLOCK_COSTS[i] || 0;
        }
    });

    // 5. 모듈 효율 강화(Main/Sub) 비용 합산
    const efficiencyKeys = Object.keys(progress).filter(key => key.startsWith('module_') && !key.startsWith('module_unlock_'));
    
    efficiencyKeys.forEach(key => {
        const level = progress[key] || 0;
        total += sumCostsUpToLevel(efficiencyCosts, level);
    });

    return total;
  }, [progress]);
}