/**
 * 파일명: thetower/front/src/hooks/useStonesData.ts
 * 용도: 스톤 계산기 페이지의 상태 및 데이터 로직 관리
 * 기능: 진행도 업데이트, 로컬 스토리지 동기화, 서버 저장 및 변경 감지
 */
import { useState, useMemo, useEffect } from 'react';
import { saveProgress } from '../api/progress';
import { useTotalStones, useTabStones, evaluateStonePlan, type StonePlanItem } from '../utils/stoneCalculations';
import { useGameData } from '../contexts/GameDataContext';

/** 
 * 스톤 계산기 전용 상태 관리 커스텀 훅
 * @param token 인증 토큰
 */
export function useStonesData(token: string | null) {
  const { progress, modules, setProgress } = useGameData();
  
  // 마지막으로 서버에 저장된 상태 (변경 감지용)
  const [lastSavedProgress, setLastSavedProgress] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  // 계획 담기 모드 활성화 여부
  const [isPlanMode, setIsPlanMode] = useState(false);

  // 초기 로드 시 현재 진행도를 마지막 저장 상태로 설정
  useEffect(() => {
    if (Object.keys(progress).length > 0 && Object.keys(lastSavedProgress).length === 0) {
      setLastSavedProgress(progress);
    }
  }, [progress, lastSavedProgress]);

  const stonePlan: StonePlanItem[] = useMemo(() => {
    return Array.isArray(progress['stone_plan']) ? progress['stone_plan'] : [];
  }, [progress]);

  // 계획 시뮬레이션 평가 (가상 진행도, 단계별 비용, 총 계획 스톤량)
  const { effectiveProgress, evaluatedItems, totalPlanStones } = useMemo(() => {
    return evaluateStonePlan(progress, stonePlan);
  }, [progress, stonePlan]);

  // 총 사용 스톤량 및 탭별 사용 스톤량 계산 (실제 진행도 기준)
  const totalStonesUsed = useTotalStones(progress);
  const tabStonesUsed = useTabStones(progress);

  const syncProgress = (newProgress: Record<string, any>) => {
    setProgress(newProgress);
    if (token) localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  /** 개별 항목의 진행도를 업데이트하거나(일반 모드), 계획표에 단계를 추가합니다(계획 담기 모드). */
  const updateProgress = (key: string, value: any) => {
    // 연구소(Lab) 토글은 모드와 무관하게 즉시 반영
    if (!isPlanMode || key.endsWith('_on')) {
      syncProgress({ ...progress, [key]: value });
      return;
    }

    const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. 기본 무기 / UW+ 해금 계획 담기 (1개씩 개별 단계로 분할 등록)
    if (key === 'unlocked_weapons' || key === 'unlocked_plus_weapons') {
      const prevList: string[] = Array.isArray(effectiveProgress[key]) ? effectiveProgress[key] : [];
      const added = Array.isArray(value) ? value.filter((w: string) => !prevList.includes(w)) : [];
      if (added.length > 0) {
        const newItems: StonePlanItem[] = added.map((w: string) => ({
          id: makeId(),
          category: 'unlock',
          key,
          targetValue: [w],
        }));
        syncProgress({ ...progress, stone_plan: [...stonePlan, ...newItems] });
      }
      return;
    }

    // 2. 카드 마스터리 계획 담기 / 취소
    if (key.startsWith('card_')) {
      const currentEff = Number(effectiveProgress[key] || 0);
      if (value === 1 && currentEff !== 1) {
        const newItem: StonePlanItem = {
          id: makeId(),
          category: 'card',
          key,
          targetValue: 1,
        };
        syncProgress({ ...progress, stone_plan: [...stonePlan, newItem] });
      } else if (value === 0) {
        // 계획으로 담아둔 카드를 다시 누른 경우 계획에서 제거
        const nextPlan = stonePlan.filter(item => item.key !== key);
        if (nextPlan.length !== stonePlan.length) {
          syncProgress({ ...progress, stone_plan: nextPlan });
        }
      }
      return;
    }

    // 3. 레벨형 스탯 (UW Base, UW+, 모듈 슬롯, Bot+, 모듈 효율) 계획 담기 (1단계씩 개별 등록)
    const realLv = Number(progress[key] || 0);
    const currentEff = Number(effectiveProgress[key] || 0);
    const targetLv = Number(value || 0);
    if (targetLv === 0) {
      // 계획 담기 모드에서 개별 스탯 Reset 클릭 시: 실제 기록은 유지하고 해당 스탯의 계획만 제거
      const nextPlan = stonePlan.filter(item => item.key !== key);
      if (nextPlan.length !== stonePlan.length) {
        syncProgress({ ...progress, stone_plan: nextPlan });
      }
      return;
    }
    if (targetLv > currentEff) {
      let category: StonePlanItem['category'] = 'base';
      if (key.startsWith('plus_')) category = 'plus';
      else if (key.startsWith('module_unlock_') || key.startsWith('bot_')) category = 'unlock';
      else if (key.startsWith('module_')) category = 'module';

      const newItems: StonePlanItem[] = [];
      for (let lv = currentEff + 1; lv <= targetLv; lv++) {
        newItems.push({
          id: makeId(),
          category,
          key,
          targetValue: lv,
        });
      }
      syncProgress({ ...progress, stone_plan: [...stonePlan, ...newItems] });
    } else if (targetLv < currentEff) {
      // 이미 계획으로 담아둔 레벨보다 낮은 레벨을 클릭한 경우 초과분 계획 단계들을 뒤에서부터 제거
      const keepCount = Math.max(0, targetLv - realLv);
      let seen = 0;
      const nextPlan = stonePlan.filter(item => {
        if (item.key !== key) return true;
        seen++;
        return seen <= keepCount;
      });
      if (nextPlan.length !== stonePlan.length) {
        syncProgress({ ...progress, stone_plan: nextPlan });
      }
    }
  };

  /** 여러 항목의 진행도를 한꺼번에 업데이트합니다. */
  const updateBatch = (updates: Record<string, any>) => {
    if (isPlanMode) return;
    syncProgress({ ...progress, ...updates });
  };

  /** 계획 항목 순서 이동 (위/아래) */
  const movePlanItem = (id: string, direction: 'up' | 'down') => {
    const idx = stonePlan.findIndex(item => item.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stonePlan.length) return;

    const nextPlan = [...stonePlan];
    const [moved] = nextPlan.splice(idx, 1);
    nextPlan.splice(targetIdx, 0, moved);
    syncProgress({ ...progress, stone_plan: nextPlan });
  };

  /** 계획 항목 개별 삭제 */
  const removePlanItem = (id: string) => {
    const nextPlan = stonePlan.filter(item => item.id !== id);
    syncProgress({ ...progress, stone_plan: nextPlan });
  };

  /** 계획 항목 완료 처리: 실제 내 진행도(progress)에 반영하고 계획표에서 제거 */
  const completePlanItem = (id: string) => {
    const targetIdx = stonePlan.findIndex(item => item.id === id);
    if (targetIdx === -1) return;
    const target = stonePlan[targetIdx];

    const newProg: Record<string, any> = { ...progress };

    if (target.key === 'unlocked_weapons' || target.key === 'unlocked_plus_weapons') {
      const currentList: string[] = Array.isArray(newProg[target.key]) ? [...newProg[target.key]] : [];
      const toAdd: string[] = Array.isArray(target.targetValue) ? target.targetValue : [];
      toAdd.forEach(w => {
        if (!currentList.includes(w)) currentList.push(w);
      });
      newProg[target.key] = currentList;
      newProg['stone_plan'] = stonePlan.filter(item => item.id !== id);
    } else if (target.key.startsWith('card_') || target.key.startsWith('bot_plus_')) {
      newProg[target.key] = 1;
      newProg['stone_plan'] = stonePlan.filter(item => item.id !== id);
    } else {
      // 동일 키의 계획 단계 중 클릭한 행(targetIdx)까지 몇 단계가 포함되는지 계산하여 반영
      let stepsCompleted = 0;
      for (let i = 0; i <= targetIdx; i++) {
        if (stonePlan[i].key === target.key) {
          stepsCompleted++;
        }
      }
      newProg[target.key] = Number(newProg[target.key] || 0) + stepsCompleted;
      newProg['stone_plan'] = stonePlan.filter((item, idx) => {
        if (item.key === target.key && idx <= targetIdx) return false;
        return true;
      });
    }

    syncProgress(newProg);
  };

  /** 계획표 전체 비우기 */
  const clearPlan = () => {
    syncProgress({ ...progress, stone_plan: [] });
  };

  /** 카드 관련 진행도만 초기화합니다. */
  const resetCards = () => {
    if (isPlanMode) return;
    const newProg = { ...progress };
    Object.keys(newProg).forEach(k => { if(k.startsWith('card_')) delete newProg[k]; });
    syncProgress(newProg);
  };

  /** 모든 진행도 데이터를 초기화합니다 (계획표는 유지). */
  const resetAll = () => {
    const preservedPlan = progress['stone_plan'] ? { stone_plan: progress['stone_plan'] } : {};
    setProgress(preservedPlan);
    setLastSavedProgress(preservedPlan);
    localStorage.removeItem('thetower_progress');
    if (token) saveProgress(preservedPlan);
  };

  /** 현재 상태를 서버에 영구 저장합니다. */
  const saveToServer = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await saveProgress(progress);
      setLastSavedProgress(progress);
      console.log("Progress saved successfully.");
    } catch (e) {
      console.error("Save failed:", e);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  /** 실제 스톤 진행도(stone_plan 제외)가 서버 저장 상태와 다른지 여부를 확인합니다. */
  const isProgressChanged = useMemo(() => {
    const { stone_plan: _a, ...actualCurrent } = progress || {};
    const { stone_plan: _b, ...actualSaved } = lastSavedProgress || {};
    return JSON.stringify(actualCurrent) !== JSON.stringify(actualSaved);
  }, [progress, lastSavedProgress]);

  /** 계획표(stone_plan)가 서버 저장 상태와 다른지 여부를 확인합니다. */
  const isPlanChanged = useMemo(() => {
    const currentPlan = Array.isArray(progress?.['stone_plan']) ? progress['stone_plan'] : [];
    const savedPlan = Array.isArray(lastSavedProgress?.['stone_plan']) ? lastSavedProgress['stone_plan'] : [];
    return JSON.stringify(currentPlan) !== JSON.stringify(savedPlan);
  }, [progress, lastSavedProgress]);

  return {
    progress,
    displayProgress: isPlanMode ? effectiveProgress : progress,
    modulesState: modules,
    totalStonesUsed,
    tabStonesUsed,
    isPlanMode,
    setIsPlanMode,
    evaluatedItems,
    totalPlanStones,
    movePlanItem,
    removePlanItem,
    completePlanItem,
    clearPlan,
    isSaving,
    isProgressChanged,
    isPlanChanged,
    updateProgress,
    updateBatch,
    resetCards,
    resetAll,
    saveToServer
  };
}