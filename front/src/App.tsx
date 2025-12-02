import { useState, useEffect, useMemo } from 'react';
import { Plus, Triangle, Archive, LayoutGrid, LogIn, LogOut, User } from 'lucide-react';
import { getReports } from './api/reports';
import type { BattleMain } from './types/report';
import ReportDetail from './pages/ReportDetail';
import ReportInputModal from './components/Detail/ReportInputModal';
import AuthModal from './components/Auth/AuthModal';
import MainPage from './pages/MainPage';
import HistoryPage from './pages/HistoryPage';
import StonesPage from './pages/StonesPage';

export default function App() {
  const [view, setView] = useState<'list' | 'history' | 'detail' | 'stones'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  // [Modified] 로그아웃 함수 (이벤트 핸들러에서도 쓰기 위해 useCallback 없이 정의)
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setReports([]);
    setView('list');
  };

  // [New] 토큰 만료 이벤트 감지
  useEffect(() => {
    const handleAuthExpired = () => {
      // 401 이벤트 발생 시 로그아웃 처리
      handleLogout();
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    // cleanup
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (token) {
        loadReports();
    } else {
        setReports([]);
    }
  }, [token]);

  const loadReports = async () => {
    try {
      const data = await getReports(); 
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

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

      if (diffDays < 3) recent.push(report);
      else past.push(report);
    });
    return { recentReports: recent, pastReports: past };
  }, [reports]);

  const handleLoginSuccess = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* 상단 네비게이션 */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setView('list')}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">T</div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">The Tower <span className="text-slate-500 text-base font-normal">Analytics</span></span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'list' ? 'bg-blue-500/10 text-blue-400 border-blue-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <LayoutGrid size={16} /> <span className="hidden md:inline">Main</span>
            </button>

            <button 
              onClick={() => setView('history')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'history' ? 'bg-purple-500/10 text-purple-400 border-purple-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <Archive size={16} /> <span className="hidden md:inline">기록</span>
            </button>

            <button 
              onClick={() => setView('stones')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${view === 'stones' ? 'bg-green-500/10 text-green-400 border-green-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'}`}
            >
              <Triangle size={16} className={view === 'stones' ? "fill-green-400/20" : ""} /> <span className="hidden md:inline">Stones</span>
            </button>

            <button 
              onClick={() => {
                  if(!token) { setIsAuthModalOpen(true); return; }
                  setIsReportModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 ml-2"
            >
              <Plus size={16} /> <span className="hidden md:inline">추가</span>
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1"></div>
            
            {token ? (
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            ) : (
                <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                >
                    <LogIn size={16} /> <span className="hidden md:inline">Login</span>
                </button>
            )}
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        
        {view === 'list' && (
            token ? (
              <MainPage reports={recentReports} onSelectReport={(date) => { setSelectedDate(date); setView('detail'); }} />
            ) : (
              <div className="text-center py-20 text-slate-500">
                 <User size={48} className="mx-auto mb-4 opacity-20"/>
                 <p>로그인이 필요합니다.</p>
                 <button onClick={() => setIsAuthModalOpen(true)} className="mt-4 text-blue-400 hover:underline">로그인 하러가기</button>
              </div>
            )
        )}
        
        {view === 'history' && (
           token ? (
             <HistoryPage reports={pastReports} onSelectReport={(date) => { setSelectedDate(date); setView('detail'); }} />
           ) : <div className="text-center py-20 text-slate-500">로그인이 필요합니다.</div>
        )}
        
        {view === 'detail' && selectedDate && (
          <ReportDetail battleDate={selectedDate} onBack={() => { setSelectedDate(null); setView('list'); }} />
        )}
        
        {view === 'stones' && (
          <StonesPage onBack={() => setView('list')} token={token} /> 
        )}
      </main>

      {/* 모달들 */}
      {isReportModalOpen && (
        <ReportInputModal 
          onClose={() => setIsReportModalOpen(false)} 
          onSuccess={loadReports}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}