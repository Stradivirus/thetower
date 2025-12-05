// front/src/contexts/GameDataContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react'; // [Fix] type import 분리
import { fetchProgress } from '../api/progress';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import type { UserProgress, UserModules } from '../types/gameData';

interface GameDataContextType {
  progress: UserProgress;
  modules: UserModules;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  setProgress: (newProgress: UserProgress) => void;
  setModules: (newModules: UserModules) => void;
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

  const loadData = useCallback(async () => {
    if (!token) {
      setProgress({});
      setModules({});
      return;
    }

    setIsLoading(true);
    try {
      const [progressData, modulesRes] = await Promise.all([
        fetchProgress().catch((err) => {
          console.error("Progress fetch error:", err);
          return {};
        }),
        fetchWithAuth(`${API_BASE_URL}/modules/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch((err) => {
          console.error("Modules fetch error:", err);
          return null;
        })
      ]);

      if (progressData) {
        setProgress(progressData);
      }

      if (modulesRes && modulesRes.ok) {
        const modData = await modulesRes.json();
        setModules(modData.modules_json || {});
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
        setModules
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