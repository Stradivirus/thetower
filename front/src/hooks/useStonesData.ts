import { useState, useEffect, useMemo } from 'react';
import { fetchProgress, saveProgress } from '../api/progress';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import { useTotalStones } from '../utils/stoneCalculations';

export function useStonesData(token: string | null) {
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [lastSavedProgress, setLastSavedProgress] = useState<Record<string, any>>({});
  const [modulesState, setModulesState] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalStonesUsed = useTotalStones(progress);

  // 1. 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      let dataToLoad: Record<string, any> = {};

      if (token) {
        try {
          const serverData = await fetchProgress();
          if (serverData && typeof serverData === 'object') {
            dataToLoad = serverData;
          }
        } catch (e) {
          console.error("Failed to fetch progress", e);
        }
      }

      const saved = localStorage.getItem('thetower_progress');
      if (Object.keys(dataToLoad).length === 0 && saved) {
        try {
          dataToLoad = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved progress", e);
        }
      }
      
      setProgress(dataToLoad);
      setLastSavedProgress(dataToLoad);
      
      // 모듈 데이터 로드
      const localModules = localStorage.getItem('thetower_modules');
      if (localModules) {
        try { setModulesState(JSON.parse(localModules)); } catch (e) { console.error(e); }
      }

      if (token) {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/modules/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.modules_json) {
            setModulesState(data.modules_json);
            localStorage.setItem('thetower_modules', JSON.stringify(data.modules_json));
          }
        } catch (e) {
          console.error("Failed to fetch modules", e);
        }
      }
    };
    
    loadData();
  }, [token]);

  // 2. 헬퍼 함수들
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
    setLastSavedProgress(newProg); 
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
    modulesState,
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