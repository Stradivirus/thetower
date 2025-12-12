// front/src/pages/MainPage.tsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, X, List } from 'lucide-react';
import type { BattleMain } from '../types/report';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';

interface MainPageProps {
  reports: BattleMain[];
}

export default function MainPage({ reports }: MainPageProps) {
  const navigate = useNavigate();
  const { progress } = useGameData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const handleSelectReport = useCallback((date: string) => {
    navigate(`/report/${date}`);
  }, [navigate]);

  // [Optimization] 검색 필터링 최적화
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    
    const lowerTerm = searchTerm.toLowerCase();
    
    return reports.filter(report => {
      const noteMatch = report.notes?.toLowerCase().includes(lowerTerm);
      const killerMatch = report.killer?.toLowerCase().includes(lowerTerm);
      const tierMatch = report.tier?.toLowerCase().includes(lowerTerm);
      
      const dateObj = new Date(report.battle_date);
      const dateStrKr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
      const dateStrSlash = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      const dateMatch = dateStrKr.includes(lowerTerm) || dateStrSlash.includes(lowerTerm);
      
      return noteMatch || killerMatch || tierMatch || dateMatch;
    });
  }, [reports, searchTerm]);

  // [Optimization] 리스트 표시용 데이터 계산 최적화
  const listDisplayReports = useMemo(() => {
    if (searchTerm) return filteredReports;

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 2); 
    cutoffDate.setHours(0, 0, 0, 0);

    return filteredReports.filter(r => new Date(r.battle_date) >= cutoffDate);
  }, [filteredReports, searchTerm]);

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
      <Dashboard reports={filteredReports} />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> 전투 기록
          <span className="text-sm font-normal text-slate-500 ml-2">
            (최근 {filteredReports.length}개)
          </span>
        </h2>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메모, 티어, 킬러, 날짜..." 
              className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full md:w-72 transition-all" 
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button 
            onClick={handleOpenSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 whitespace-nowrap"
            title="내 궁극 무기 및 모듈 세팅 보기"
          >
            <List size={16} /> 
            <span className="hidden sm:inline">궁무 및 모듈</span>
          </button>
        </div>
      </div>

      {listDisplayReports.length > 0 ? (
        <ReportList reports={listDisplayReports} onSelectReport={handleSelectReport} />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      {!searchTerm && filteredReports.length > listDisplayReports.length && (
        <div className="text-center mt-4">
            <button 
                onClick={() => navigate('/history')}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
                이전 기록 더 보기 ({filteredReports.length - listDisplayReports.length}개 숨겨짐)
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