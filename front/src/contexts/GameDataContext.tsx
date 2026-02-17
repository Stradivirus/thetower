/**
 * 파일명: thetower/front/src/contexts/GameDataContext.tsx
 * 용도: 게임 데이터(진행도, 모듈)의 전역 상태 관리
 * 기능: 서버 데이터 페칭, 로컬 상태 동기화, 컨텍스트 API 공급자 및 훅 제공
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchProgress } from '../api/progress';
import { fetchModules } from '../api/modules';
import type { UserProgress, UserModules } from '../types/gameData';

/** 
 * 전역 게임 데이터 컨텍스트 인터페이스
 */
interface GameDataContextType {
  progress: UserProgress;      // 게임 진행도 (카드, UW 등)
  modules: UserModules;        // 모듈 데이터 (인벤토리 및 장착)
  isLoading: boolean;          // 데이터 로딩 상태
  refreshData: () => Promise<void>; // 데이터를 서버에서 다시 불러오는 함수
  setProgress: (newProgress: UserProgress) => void;
  setModules: (newModules: UserModules) => void;
  isLoggedIn: boolean;         // 로그인 여부
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

  /** 
   * 서버에서 게임 데이터를 로드하여 상태를 업데이트합니다.
   */
  const loadData = useCallback(async () => {
    if (!token) {
      setProgress({});
      setModules({});
      return;
    }

    setIsLoading(true);
    try {
      // 진행도와 모듈 데이터를 병렬로 호출
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
        // 장착된 모듈과 인벤토리를 병합하여 관리하기 쉬운 형태로 변환
        const mergedModules: any = { ...(modulesData.equipped_json || {}) };
        
        const inventory = modulesData.inventory_json || {};
        Object.entries(inventory).forEach(([name, data]: [string, any]) => {
            // 인벤토리 아이템은 'owned_' 접두사를 붙여 저장
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

  // 토큰이 유효하고 아직 로드되지 않은 경우 데이터 로드 실행
  useEffect(() => {
    if (token && !isLoaded) {
      loadData();
    } else if (!token) {
      setIsLoaded(false);
      setProgress({});
      setModules({});
    }
  }, [token, isLoaded, loadData]);

  /** 
   * 수동으로 데이터를 새로고침하는 함수
   */
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

/** 
 * 컴포넌트에서 게임 데이터에 접근하기 위한 커스텀 훅
 */
export function useGameData() {
  const context = useContext(GameDataContext);
  if (!context) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
}