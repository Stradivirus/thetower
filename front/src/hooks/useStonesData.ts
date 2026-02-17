/**
 * 파일명: thetower/front/src/hooks/useStonesData.ts
 * 용도: 스톤 계산기 페이지의 상태 및 데이터 로직 관리
 * 기능: 진행도 업데이트, 로컬 스토리지 동기화, 서버 저장 및 변경 감지
 */
import { useState, useMemo, useEffect } from 'react';
import { saveProgress } from '../api/progress';
import { useTotalStones } from '../utils/stoneCalculations';
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

  // 초기 로드 시 현재 진행도를 마지막 저장 상태로 설정
  useEffect(() => {
    if (Object.keys(progress).length > 0 && Object.keys(lastSavedProgress).length === 0) {
      setLastSavedProgress(progress);
    }
  }, [progress, lastSavedProgress]);

  // 총 사용 스톤량 계산 (메모이제이션된 훅 사용)
  const totalStonesUsed = useTotalStones(progress);

  /** 개별 항목의 진행도를 업데이트합니다. */
  const updateProgress = (key: string, value: any) => {
    const newProgress = { ...progress, [key]: value };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  /** 여러 항목의 진행도를 한꺼번에 업데이트합니다. */
  const updateBatch = (updates: Record<string, any>) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  /** 카드 관련 진행도만 초기화합니다. */
  const resetCards = () => {
    const newProg = { ...progress };
    Object.keys(newProg).forEach(k => { if(k.startsWith('card_')) delete newProg[k]; });
    setProgress(newProg);
    localStorage.setItem('thetower_progress', JSON.stringify(newProg));
  };

  /** 모든 진행도 데이터를 초기화합니다. */
  const resetAll = () => {
    setProgress({});
    setLastSavedProgress({});
    localStorage.removeItem('thetower_progress');
    if (token) saveProgress({});
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

  /** 현재 로컬 상태가 서버 저장 상태와 다른지 여부를 확인합니다. */
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