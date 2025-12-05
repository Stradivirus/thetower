import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { getReports } from './api/reports';
import type { BattleMain } from './types/report';
import ReportInputModal from './components/Detail/ReportInputModal';
import AuthModal from './components/Auth/AuthModal';
import NavBar from './components/Layout/NavBar'; 

// [Optimization] 페이지 Lazy Loading
const MainPage = lazy(() => import('./pages/MainPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const StonesPage = lazy(() => import('./pages/StonesPage'));
const ModulesInfoPage = lazy(() => import('./pages/ModulesInfoPage'));

// 로딩 중 표시 컴포넌트
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh] text-slate-500">
    <div className="animate-pulse">페이지 로딩 중...</div>
  </div>
);

// 로그인 필요 안내 컴포넌트
const LoginRequired = ({ onOpenAuth }: { onOpenAuth: () => void }) => (
  <div className="text-center py-20 text-slate-500">
     <User size={48} className="mx-auto mb-4 opacity-20"/>
     <p>로그인이 필요합니다.</p>
     <button onClick={onOpenAuth} className="mt-4 text-blue-400 hover:underline">로그인 하러가기</button>
  </div>
);

// [New] URL 파라미터를 받아 ReportDetail에 넘겨주는 래퍼 컴포넌트
const ReportDetailWrapper = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  // date가 없으면 빈 문자열 처리, 뒤로가기 버튼(-1) 연결
  return <ReportDetail battleDate={date || ""} onBack={() => navigate(-1)} />;
};

export default function App() {
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  const loadReports = async () => {
    try {
      const data = await getReports(); 
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) loadReports();
    else setReports([]);
  }, [token]);

  // 리포트 데이터 분류 (최근 3일 vs 과거)
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

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setReports([]);
  };

  const handleLoginSuccess = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setIsAuthModalOpen(false);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
        
        <NavBar 
          token={token} 
          onLogout={handleLogout} 
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenReport={() => setIsReportModalOpen(true)}
        />

        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={
                token ? (
                  // onSelectReport 제거 (MainPage 내부에서 useNavigate 사용)
                  <MainPage reports={recentReports} />
                ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
              } />

              <Route path="/history" element={
                token ? (
                  // onSelectReport 제거 (HistoryPage 내부에서 useNavigate 사용)
                  <HistoryPage reports={pastReports} /> 
                ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
              } />

              <Route path="/modules" element={<ModulesInfoPage />} />

              <Route path="/stones" element={
                <StonesPage onBack={() => window.history.back()} token={token} />
              } />

              {/* [Fix] URL 파라미터 라우팅 설정 */}
              <Route path="/report/:date" element={<ReportDetailWrapper />} />
            </Routes>
          </Suspense>
        </main>

        {isReportModalOpen && (
          <ReportInputModal onClose={() => setIsReportModalOpen(false)} onSuccess={loadReports} />
        )}

        {isAuthModalOpen && (
          <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </BrowserRouter>
  );
}