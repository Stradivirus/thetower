/**
 * 파일명: thetower/front/src/contexts/ReportContext.tsx
 * 용도: 전투 기록(Reports)의 전역 상태 관리
 * 기능: 초기 진입 시 최근 7일 리포트 경량 페칭, 기록실 진입 시 전체 기록 지연 페칭, 추가/삭제/메모 수정 로컬 상태 동기화
 */
import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from 'react';
import { getRecentReports, getAllReports, deleteReport as deleteReportApi } from '../api/reports';
import type { BattleMain } from '../types/report';

interface ReportContextType {
  reports: BattleMain[];
  isLoading: boolean;
  refreshReports: () => Promise<void>;
  ensureAllReportsLoaded: () => Promise<void>;
  addReportToState: (newReport: BattleMain) => void;
  updateReportMemoInState: (battleDate: string, notes: string) => void;
  deleteReportFromState: (battleDate: string) => Promise<void>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children, token, isGuest = false }: { children: ReactNode; token: string | null; isGuest?: boolean }) {
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedAllRef = useRef(false);

  const canFetch = !!token || isGuest;

  /**
   * 초기 로드 시에는 최근 7일 기록만 가볍게 불러오고,
   * 이미 전체 기록을 로드한 상태라면 전체 기록을 새로고침합니다.
   */
  const refreshReports = useCallback(async () => {
    if (!canFetch) {
      setReports([]);
      hasLoadedAllRef.current = false;
      return;
    }
    setIsLoading(true);
    try {
      const data = hasLoadedAllRef.current ? await getAllReports() : await getRecentReports();
      setReports(data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [canFetch]);

  /**
   * 기록실(HistoryPage) 진입 시 전체 기록이 아직 로드되지 않았다면 전체 목록을 불러옵니다.
   */
  const ensureAllReportsLoaded = useCallback(async () => {
    if (!canFetch || hasLoadedAllRef.current) return;
    setIsLoading(true);
    try {
      const data = await getAllReports();
      hasLoadedAllRef.current = true;
      setReports(data || []);
    } catch (error) {
      console.error("Failed to fetch all reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [canFetch]);

  // 토큰 또는 둘러보기 상태 변경 시 초기화 후 최근 기록 로드
  useEffect(() => {
    hasLoadedAllRef.current = false;
    if (canFetch) {
      refreshReports();
    } else {
      setReports([]);
    }
  }, [canFetch, token, isGuest, refreshReports]);

  /**
   * 새로운 리포트를 상태에 추가 (동일 battle_date 존재 시 덮어쓰기 후 최신순 정렬)
   */
  const addReportToState = useCallback((newReport: BattleMain) => {
    setReports(prev => {
      const filtered = prev.filter(r => r.battle_date !== newReport.battle_date);
      return [newReport, ...filtered].sort((a, b) =>
        new Date(b.battle_date).getTime() - new Date(a.battle_date).getTime()
      );
    });
  }, []);

  /**
   * 특정 리포트의 메모를 로컬 상태에서 즉시 수정
   */
  const updateReportMemoInState = useCallback((battleDate: string, notes: string) => {
    setReports(prev =>
      prev.map(r => (r.battle_date === battleDate ? { ...r, notes } : r))
    );
  }, []);

  /**
   * 리포트 삭제 및 상태 반영
   */
  const deleteReportFromState = useCallback(async (battleDate: string) => {
    try {
      await deleteReportApi(battleDate);
      setReports(prev => prev.filter(r => r.battle_date !== battleDate));
    } catch (error) {
      console.error("Failed to delete report:", error);
      throw error;
    }
  }, []);

  return (
    <ReportContext.Provider
      value={{
        reports,
        isLoading,
        refreshReports,
        ensureAllReportsLoaded,
        addReportToState,
        updateReportMemoInState,
        deleteReportFromState,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
