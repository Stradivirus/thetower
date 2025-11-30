import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getReports } from './api/reports';
import type { BattleMain } from './types/report';
import ReportDetail from './pages/ReportDetail';
import ReportInputModal from './components/ReportInputModal';
import MainPage from './pages/MainPage';

export default function App() {
  const [view, setView] = useState<'list' | 'detail'>('list');
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">T</div>
            <span className="font-bold text-xl tracking-tight text-white">The Tower <span className="text-slate-500 text-base font-normal">Analytics</span></span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> 기록 추가
          </button>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === 'list' ? (
          <MainPage reports={reports} onSelectReport={handleSelectReport} />
        ) : (
          <ReportDetail battleDate={selectedDate!} onBack={handleBackToList} />
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