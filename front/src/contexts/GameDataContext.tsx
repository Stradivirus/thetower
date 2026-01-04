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
  isLoggedIn: boolean; // [추가] 로그인 상태 노출
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

  // [추가] 토큰 존재 여부로 로그인 상태 판단
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
        const mergedModules: any = { ...(modulesData.equipped_json || {}) };
        
        const inventory = modulesData.inventory_json || {};
        Object.entries(inventory).forEach(([name, data]: [string, any]) => {
            mergedModules[`owned_${name}`] = data.rarity; 
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
        isLoggedIn // [추가] Provider에 값 전달
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