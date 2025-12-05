// front/src/hooks/useStonesData.ts
import { useState, useMemo, useEffect } from 'react';
import { saveProgress } from '../api/progress';
import { useTotalStones } from '../utils/stoneCalculations';
import { useGameData } from '../contexts/GameDataContext';

export function useStonesData(token: string | null) {
  // [Fix] refreshData 제거 (사용하지 않음)
  const { progress, modules, setProgress } = useGameData();
  
  const [lastSavedProgress, setLastSavedProgress] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (Object.keys(progress).length > 0 && Object.keys(lastSavedProgress).length === 0) {
      setLastSavedProgress(progress);
    }
  }, [progress, lastSavedProgress]);

  const totalStonesUsed = useTotalStones(progress);

  const updateProgress = (key: string, value: any) => {
    const newProgress = { ...progress, [key]: value };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  const updateBatch = (updates: Record<string, any>) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  const resetCards = () => {
    const newProg = { ...progress };
    Object.keys(newProg).forEach(k => { if(k.startsWith('card_')) delete newProg[k]; });
    setProgress(newProg);
    localStorage.setItem('thetower_progress', JSON.stringify(newProg));
  };

  const resetAll = () => {
    setProgress({});
    setLastSavedProgress({});
    localStorage.removeItem('thetower_progress');
    if (token) saveProgress({});
  };

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

  const isProgressChanged = useMemo(() => {
    return JSON.stringify(progress) !== JSON.stringify(lastSavedProgress);
  }, [progress, lastSavedProgress]);

  return {
    progress,
    modulesState: modules,
    totalStonesUsed,
    isSaving,
    isProgressChanged,
    updateProgress,
    updateBatch,
    resetCards,
    resetAll,
    saveToServer
  };
}