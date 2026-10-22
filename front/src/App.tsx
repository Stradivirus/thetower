/**
 * 파일명: thetower/front/src/App.tsx
 * 용도: 프론트엔드 최상위 컴포넌트
 * 기능: 라우팅 설정, 전역 상태(GameData) 공급, 인증 상태 관리 및 모달 제어
 */
import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { User, Eye } from 'lucide-react';
import ReportInputModal from './components/Detail/ReportInputModal';
import AuthModal from './components/Auth/AuthModal';
import NavBar from './components/Layout/NavBar';
import { GameDataProvider } from './contexts/GameDataContext';
import { StatsCacheProvider } from './contexts/StatsCacheContext';
import { ReportProvider } from './contexts/ReportContext';
import SupportButton from './components/Layout/SupportButton';
import { T } from './locales';

// 지연 로딩을 위한 위젯 및 페이지 컴포넌트 임포트
import TierRecordWidget from './components/Main/TierRecordWidget'; 

const MainPage = lazy(() => import('./pages/MainPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const StonesPage = lazy(() => import('./pages/StonesPage'));
const ModulesInfoPage = lazy(() => import('./pages/ModulesInfoPage'));

/** 
 * 로딩 중 표시할 폴백 컴포넌트
 */
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-[50vh] text-slate-500">
    <div className="animate-pulse">페이지 로딩 중...</div>
  </div>
);

/** 
 * 비로그인 사용자에게 표시할 안내 컴포넌트
 */
const LoginRequired = ({ onOpenAuth, onBrowse }: { onOpenAuth: () => void; onBrowse: () => void }) => (
  <div className="text-center py-20 text-slate-500">
     <User size={48} className="mx-auto mb-4 opacity-20"/>
     <p>로그인이 필요합니다.</p>
     <div className="mt-4 flex items-center justify-center gap-4">
       <button onClick={onOpenAuth} className="text-blue-400 hover:underline font-medium">로그인 하러가기</button>
       <span className="text-slate-700">|</span>
       <button onClick={onBrowse} className="text-cyan-400 hover:underline font-medium flex items-center gap-1">
         <Eye size={15} /> {T.auth.BTN_BROWSE}
       </button>
     </div>
  </div>
);

/** 
 * URL 파라미터(date)를 추출하여 상세 페이지에 전달하는 래퍼
 */
const ReportDetailWrapper = ({ canView }: { canView: boolean }) => {
  const { date } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canView) {
      navigate('/', { replace: true });
    }
  }, [canView, navigate]);

  if (!canView) return null;
  return <ReportDetail battleDate={date || ""} onBack={() => navigate(-1)} />;
};

export default function App() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // 로컬 스토리지에서 토큰 로드 및 세션 스토리지에서 둘러보기 모드 로드
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isGuest, setIsGuest] = useState<boolean>(() => sessionStorage.getItem('guest_mode') === 'true');

  const canView = !!token || isGuest;

  // 초기 로드 시 로그인되어 있지 않고 둘러보기 상태도 아니면 로그인 모달을 자동으로 엽니다.
  useEffect(() => {
    if (!token && !isGuest) {
      setIsAuthModalOpen(true);
    }
  }, []);

  // 인증 만료 이벤트 리스너 등록
  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
      setIsAuthModalOpen(true);
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  /** 
   * 로그아웃 처리: 토큰 및 둘러보기 상태 제거 후 초기화
   */
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('guest_mode');
    setToken(null);
    setIsGuest(false);
  };

  /** 
   * 로그인 성공 콜백: 토큰 저장, 둘러보기 해제 및 모달 닫기
   */
  const handleLoginSuccess = (accessToken: string) => {
    sessionStorage.removeItem('guest_mode');
    setIsGuest(false);
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setIsAuthModalOpen(false);
  };

  /**
   * 비로그인 둘러보기 모드 진입 핸들러
   */
  const handleBrowse = () => {
    sessionStorage.setItem('guest_mode', 'true');
    setIsGuest(true);
    setIsAuthModalOpen(false);
  };

  return (
    <BrowserRouter>
      {/* 전역 게임 데이터 공급자 */}
      <GameDataProvider token={token} isGuest={isGuest}>
        <StatsCacheProvider authKey={`${token || ''}_${isGuest}`}>
          <ReportProvider token={token} isGuest={isGuest}>
            <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
              
              <NavBar 
                token={token} 
                isGuest={isGuest}
                onLogout={handleLogout} 
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenReport={() => setIsReportModalOpen(true)}
              />

              {/* 티어 기록 위젯 (상단 고정) */}
              <TierRecordWidget />

              <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* 메인 대시보드 */}
                    <Route path="/" element={
                      canView ? (
                        <MainPage />
                      ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} onBrowse={handleBrowse} />
                    } />

                    {/* 기록 보관소 */}
                    <Route path="/history" element={
                      canView ? (
                        <HistoryPage /> 
                      ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} onBrowse={handleBrowse} />
                    } />

                    {/* 모듈 관리 */}
                    <Route path="/modules" element={<ModulesInfoPage />} />

                    {/* 스톤 계산기 */}
                    <Route path="/stones" element={
                      <StonesPage token={token} />
                    } />

                    {/* 리포트 상세 페이지 */}
                    <Route path="/report/:date" element={<ReportDetailWrapper canView={canView} />} />
                  </Routes>
                </Suspense>
              </main>

              {/* 리포트 입력 모달 */}
              {isReportModalOpen && token && (
                <ReportInputModal onClose={() => setIsReportModalOpen(false)} />
              )}

              {/* 인증(로그인/회원가입) 모달 */}
              {isAuthModalOpen && (
                <AuthModal
                  onClose={() => setIsAuthModalOpen(false)}
                  onLoginSuccess={handleLoginSuccess}
                  onBrowse={handleBrowse}
                />
              )}
              
              {/* 고객 지원(문의하기) 버튼 */}
              <SupportButton />
            </div>
          </ReportProvider>
        </StatsCacheProvider>
      </GameDataProvider>
    </BrowserRouter>
  );
}
