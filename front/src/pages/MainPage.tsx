import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, List } from 'lucide-react';
import type { BattleMain } from '../types/report';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import { T } from '../locales'; // 언어팩

interface MainPageProps {
  reports: BattleMain[];
}

export default function MainPage({ reports }: MainPageProps) {
  const navigate = useNavigate();
  const { progress } = useGameData();
  
  // 언어팩 연결
  const Text = T.main.PAGE;
  const ListText = T.main.LIST;

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleSelectReport = useCallback((date: string) => {
    navigate(`/report/${date}`);
  }, [navigate]);

  // [Optimization] 리스트 표시용 데이터 계산 최적화 (최근 2일 기록만 우선 표시)
  const listDisplayReports = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 2); 
    cutoffDate.setHours(0, 0, 0, 0);

    return reports.filter(r => new Date(r.battle_date) >= cutoffDate);
  }, [reports]);

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
      <Dashboard reports={reports} />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> {ListText.TITLE}
          <span className="text-sm font-normal text-slate-500 ml-2">
            (최근 {reports.length}개)
          </span>
        </h2>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* 검색창과 토너 버튼을 삭제했습니다. */}
          
          {/* 3. 궁무 및 모듈 버튼 */}
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

      {listDisplayReports.length > 0 ? (
        <ReportList reports={listDisplayReports} onSelectReport={handleSelectReport} />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <p>{Text.NO_RESULT}</p>
        </div>
      )}

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

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />
    </>
  );
}