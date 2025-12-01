import { useState, useEffect, useMemo } from 'react';
import { Plus, Triangle, Archive, LayoutGrid } from 'lucide-react';
import { getReports } from './api/reports';
import type { BattleMain } from './types/report';
import ReportDetail from './pages/ReportDetail';
import ReportInputModal from './components/Detail/ReportInputModal';
import MainPage from './pages/MainPage';
import HistoryPage from './pages/HistoryPage'; // [New] 추가
import StonesPage from './pages/StonesPage';

export default function App() {
  const [view, setView] = useState<'list' | 'history' | 'detail' | 'stones'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  // [New] 데이터 분리 로직 (최근 3일 vs 과거)
  const { recentReports, pastReports } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recent: BattleMain[] = [];
    const past: BattleMain[] = [];

    reports.forEach(report => {
      const reportDate = new Date(report.battle_date);
      reportDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - reportDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 3일 미만(0, 1, 2일차)은 최근 기록
      if (diffDays < 3) {
        recent.push(report);
      } else {
        past.push(report);
      }
    });

    return { recentReports: recent, pastReports: past };
  }, [reports]);

  const handleSelectReport = (date: string) => {
    setSelectedDate(date);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedDate(null);
    setView('list');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* 상단 네비게이션 */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* 로고 */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleBackToList}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">T</div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">The Tower <span className="text-slate-500 text-base font-normal">Analytics</span></span>
          </div>

          {/* 우측 버튼 그룹 */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* 1. Main (Recent) */}
            <button 
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'list' ? 'bg-blue-500/10 text-blue-400 border-blue-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <LayoutGrid size={16} /> <span className="hidden md:inline">Main</span>
            </button>

            {/* 2. History (Past) [New] */}
            <button 
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'history' ? 'bg-purple-500/10 text-purple-400 border-purple-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <Archive size={16} /> <span className="hidden md:inline">기록</span>
            </button>

            {/* 3. Stones */}
            <button 
              onClick={() => setView('stones')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'stones' ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <Triangle size={16} className={view === 'stones' ? "fill-green-400/20" : ""} /> <span className="hidden md:inline">Stones</span>
            </button>

            {/* 4. Add Report */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 ml-2"
            >
              <Plus size={16} /> <span className="hidden md:inline">추가</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {view === 'list' && (
          <MainPage reports={recentReports} onSelectReport={handleSelectReport} />
        )}
        {view === 'history' && (
          <HistoryPage reports={pastReports} onSelectReport={handleSelectReport} />
        )}
        {view === 'detail' && selectedDate && (
          <ReportDetail battleDate={selectedDate} onBack={handleBackToList} />
        )}
        {view === 'stones' && (
          <StonesPage onBack={handleBackToList} />
        )}
      </main>

      {/* 입력 모달 */}
      {isModalOpen && (
        <ReportInputModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadReports}
        />
      )}
    </div>
  );
}