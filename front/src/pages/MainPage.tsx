/**
 * 파일명: thetower/front/src/pages/MainPage.tsx
 * 용도: 애플리케이션의 메인 대시보드 페이지
 * 기능: 요약 위젯(Dashboard) 및 최근 전투 기록 목록 표시, 궁무/모듈 요약 모달 제어
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List } from 'lucide-react';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import { useReports } from '../contexts/ReportContext';
import { T } from '../locales'; 

export default function MainPage() {
  const navigate = useNavigate();
  const { progress } = useGameData();
  const { reports } = useReports();
  
  // 다국어 텍스트 매핑
  const Text = T.main.PAGE;
  const ListText = T.main.LIST;

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  /** 리포트 항목 클릭 시 상세 페이지로 이동 */
  const handleSelectReport = useCallback((date: string) => {
    navigate(`/report/${date}`);
  }, [navigate]);

  /** 
   * [최적화] 리스트에 표시할 데이터 필터링
   * - 최근 2일 이내의 기록만 우선적으로 메인 리스트에 표시함
   */
  const listDisplayReports = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 2); 
    cutoffDate.setHours(0, 0, 0, 0);

    return reports.filter(r => new Date(r.battle_date) >= cutoffDate);
  }, [reports]);

  /** 요약(Summary) 모달 열기 - 로그인 체크 포함 */
  const handleOpenSummary = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }
    setIsSummaryOpen(true);
  }, []);

  return (
    <>
      {/* 상단 대시보드 위젯 섹션 */}
      <Dashboard reports={reports} />

      {/* 리스트 헤더 및 컨트롤 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> {ListText.TITLE}
          <span className="text-sm font-normal text-slate-500 ml-2">
            (최근 {reports.length}개)
          </span>
        </h2>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* 궁무 및 모듈 요약 버튼 */}
          <button 
            onClick={handleOpenSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 whitespace-nowrap ml-auto"
            title={Text.BTN_SUMMARY_TOOLTIP}
          >
            <List size={16} /> 
            <span className="hidden sm:inline">{Text.BTN_SUMMARY}</span>
          </button>
        </div>
      </div>

      {/* 최근 기록 목록 표시 영역 */}
      {listDisplayReports.length > 0 ? (
        <ReportList reports={listDisplayReports} onSelectReport={handleSelectReport} />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <p>{Text.NO_RESULT}</p>
        </div>
      )}

      {/* 전체 기록 보기 버튼 (필터링된 데이터보다 전체 데이터가 많을 때 표시) */}
      {reports.length > listDisplayReports.length && (
        <div className="text-center mt-4">
            <button 
                onClick={() => navigate('/history')}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
                {Text.LOAD_MORE.replace('{n}', String(reports.length - listDisplayReports.length))}
            </button>
        </div>
      )}

      {/* 궁무/모듈 상태 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />
    </>
  );
}
