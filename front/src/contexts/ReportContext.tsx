/**
 * 파일명: thetower/front/src/contexts/ReportContext.tsx
 * 용도: 전투 기록(Reports)의 전역 상태 관리
 * 기능: 리포트 목록 페칭, 추가, 삭제 및 로컬 상태 동기화
 */
import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { getAllReports, deleteReport as deleteReportApi } from '../api/reports';
import type { BattleMain } from '../types/report';

interface ReportContextType {
  reports: BattleMain[];
  isLoading: boolean;
  refreshReports: () => Promise<void>;
  addReportToState: (newReport: BattleMain) => void;
  deleteReportFromState: (battleDate: string) => Promise<void>;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children, token }: { children: ReactNode; token: string | null }) {
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshReports = useCallback(async () => {
    if (!token) {
      setReports([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getAllReports();
      setReports(data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // 토큰이 있을 때 초기 데이터 로드
  useEffect(() => {
    if (token) {
      refreshReports();
    } else {
      setReports([]);
    }
  }, [token, refreshReports]);

  /** 
   * 새로운 리포트를 상태에 추가 (새로고침 없이 반영)
   */
  const addReportToState = useCallback((newReport: BattleMain) => {
    setReports(prev => [newReport, ...prev].sort((a, b) => 
      new Date(b.battle_date).getTime() - new Date(a.battle_date).getTime()
    ));
  }, []);

  /** 
   * 리포트 삭제 및 상태 반영
   */
  const deleteReportFromState = useCallback(async (battleDate: string) => {
    try {
      await deleteReportApi(battleDate);
      // 서버 삭제 성공 시 로컬 상태에서도 즉시 제거
      setReports(prev => prev.filter(r => r.battle_date !== battleDate));
    } catch (error) {
      console.error("Failed to delete report:", error);
      throw error;
    }
  }, []);

  return (
    <ReportContext.Provider value={{ reports, isLoading, refreshReports, addReportToState, deleteReportFromState }}>
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
