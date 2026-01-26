import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchProgress } from '../api/progress';
import { fetchModules } from '../api/modules';
import type { UserProgress, UserModules } from '../types/gameData';

interface GameDataContextType {
  progress: UserProgress;
  modules: UserModules;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  setProgress: (newProgress: UserProgress) => void;
  setModules: (newModules: UserModules) => void;
  isLoggedIn: boolean;
}

const GameDataContext = createContext<GameDataContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
  token: string | null;
}

export function GameDataProvider({ children, token }: ProviderProps) {
  const [progress, setProgress] = useState<UserProgress>({});
  const [modules, setModules] = useState<UserModules>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isLoggedIn = !!token;

  const loadData = useCallback(async () => {
    if (!token) {
      setProgress({});
      setModules({});
      return;
    }

    setIsLoading(true);
    try {
      const [progressData, modulesData] = await Promise.all([
        fetchProgress().catch((err) => {
          console.error("Progress fetch error:", err);
          return {};
        }),
        fetchModules().catch((err) => {
          console.error("Modules fetch error:", err);
          return null;
        })
      ]);

      if (progressData) {
        setProgress(progressData);
      }

      if (modulesData) {
        // 1. 장착된 모듈 데이터 복사
        const mergedModules: any = { ...(modulesData.equipped_json || {}) };
        
        // 2. 인벤토리 데이터 병합
        const inventory = modulesData.inventory_json || {};
        Object.entries(inventory).forEach(([name, data]: [string, any]) => {
            // [Fix] data.rarity만 뽑지 않고, 객체 전체(effects 포함)를 저장
            mergedModules[`owned_${name}`] = data; 
        });

        setModules(mergedModules);
      }

      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load game data", e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !isLoaded) {
      loadData();
    } else if (!token) {
      setIsLoaded(false);
      setProgress({});
      setModules({});
    }
  }, [token, isLoaded, loadData]);

  const refreshData = async () => {
    await loadData();
  };

  return (
    <GameDataContext.Provider 
      value={{ 
        progress, 
        modules, 
        isLoading, 
        refreshData,
        setProgress,
        setModules,
        isLoggedIn 
      }}
    >
      {children}
    </GameDataContext.Provider>
  );
}

export function useGameData() {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}