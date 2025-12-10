import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { getRecentReports } from './api/reports'; // [Modified] getRecentReports만 사용
import type { BattleMain } from './types/report';
import ReportInputModal from './components/Detail/ReportInputModal';
import AuthModal from './components/Auth/AuthModal';
import NavBar from './components/Layout/NavBar';
import { GameDataProvider } from './contexts/GameDataContext';

// 페이지 Lazy Loading
const MainPage = lazy(() => import('./pages/MainPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const StonesPage = lazy(() => import('./pages/StonesPage'));
const ModulesInfoPage = lazy(() => import('./pages/ModulesInfoPage'));

// 로딩 중 표시
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh] text-slate-500">
    <div className="animate-pulse">페이지 로딩 중...</div>
  </div>
);

// 로그인 필요 안내
const LoginRequired = ({ onOpenAuth }: { onOpenAuth: () => void }) => (
  <div className="text-center py-20 text-slate-500">
     <User size={48} className="mx-auto mb-4 opacity-20"/>
     <p>로그인이 필요합니다.</p>
     <button onClick={onOpenAuth} className="mt-4 text-blue-400 hover:underline">로그인 하러가기</button>
  </div>
);

// URL 파라미터 래퍼
const ReportDetailWrapper = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  return <ReportDetail battleDate={date || ""} onBack={() => navigate(-1)} />;
};

export default function App() {
  // [Modified] 전체 reports 대신 최근 리포트(recentReports)만 상태 관리
  const [recentReports, setRecentReports] = useState<BattleMain[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  // [Modified] 최근 데이터만 로드하도록 변경
  const loadRecentData = async () => {
    try {
      const data = await getRecentReports(); 
      setRecentReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) loadRecentData();
    else setRecentReports([]);
  }, [token]);

  // [Removed] useMemo로 recent/past 나누던 로직 제거 (백엔드가 이미 분리함)

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
      // [Modified] alert 제거하고 바로 로그인 모달 열기
      setIsAuthModalOpen(true);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setRecentReports([]);
  };

  const handleLoginSuccess = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setIsAuthModalOpen(false);
  };

  return (
    <BrowserRouter>
      <GameDataProvider token={token}>
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
                    <MainPage reports={recentReports} />
                  ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
                } />

                {/* [Modified] HistoryPage에 props 전달 제거 (자체 로딩) */}
                <Route path="/history" element={
                  token ? (
                    <HistoryPage /> 
                  ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
                } />

                <Route path="/modules" element={<ModulesInfoPage />} />

                <Route path="/stones" element={
                  <StonesPage onBack={() => window.history.back()} token={token} />
                } />

                <Route path="/report/:date" element={<ReportDetailWrapper />} />
              </Routes>
            </Suspense>
          </main>

          {isReportModalOpen && (
            <ReportInputModal onClose={() => setIsReportModalOpen(false)} onSuccess={loadRecentData} />
          )}

          {isAuthModalOpen && (
            <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
          )}
        </div>
      </GameDataProvider>
    </BrowserRouter>
  );
}