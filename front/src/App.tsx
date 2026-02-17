/**
 * 파일명: thetower/front/src/App.tsx
 * 용도: 프론트엔드 최상위 컴포넌트
 * 기능: 라우팅 설정, 전역 상태(GameData) 공급, 인증 상태 관리 및 모달 제어
 */
import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { getRecentReports } from './api/reports';
import type { BattleMain } from './types/report';
import ReportInputModal from './components/Detail/ReportInputModal';
import AuthModal from './components/Auth/AuthModal';
import NavBar from './components/Layout/NavBar';
import { GameDataProvider } from './contexts/GameDataContext';
import SupportButton from './components/Layout/SupportButton';

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
const LoginRequired = ({ onOpenAuth }: { onOpenAuth: () => void }) => (
  <div className="text-center py-20 text-slate-500">
     <User size={48} className="mx-auto mb-4 opacity-20"/>
     <p>로그인이 필요합니다.</p>
     <button onClick={onOpenAuth} className="mt-4 text-blue-400 hover:underline">로그인 하러가기</button>
  </div>
);

/** 
 * URL 파라미터(date)를 추출하여 상세 페이지에 전달하는 래퍼
 */
const ReportDetailWrapper = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  return <ReportDetail battleDate={date || ""} onBack={() => navigate(-1)} />;
};

export default function App() {
  const [recentReports, setRecentReports] = useState<BattleMain[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // 로컬 스토리지에서 토큰 로드
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  /** 
   * 최근 전투 기록 데이터를 서버에서 로드합니다.
   */
  const loadRecentData = async () => {
    try {
      const data = await getRecentReports(); 
      setRecentReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 토큰 변경 시(로그인/로그아웃) 데이터 로드 처리
  useEffect(() => {
    if (token) loadRecentData();
    else setRecentReports([]);
  }, [token]);

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
   * 로그아웃 처리: 토큰 제거 및 상태 초기화
   */
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setRecentReports([]);
  };

  /** 
   * 로그인 성공 콜백: 토큰 저장 및 모달 닫기
   */
  const handleLoginSuccess = (accessToken: string) => {
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    setIsAuthModalOpen(false);
  };

  return (
    <BrowserRouter>
      {/* 전역 게임 데이터 공급자 */}
      <GameDataProvider token={token}>
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
          
          <NavBar 
            token={token} 
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
                  token ? (
                    <MainPage reports={recentReports} />
                  ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
                } />

                {/* 기록 보관소 */}
                <Route path="/history" element={
                  token ? (
                    <HistoryPage /> 
                  ) : <LoginRequired onOpenAuth={() => setIsAuthModalOpen(true)} />
                } />

                {/* 모듈 관리 */}
                <Route path="/modules" element={<ModulesInfoPage />} />

                {/* 스톤 계산기 */}
                <Route path="/stones" element={
                  <StonesPage onBack={() => window.history.back()} token={token} />
                } />

                {/* 리포트 상세 페이지 */}
                <Route path="/report/:date" element={<ReportDetailWrapper />} />
              </Routes>
            </Suspense>
          </main>

          {/* 리포트 입력 모달 */}
          {isReportModalOpen && (
            <ReportInputModal onClose={() => setIsReportModalOpen(false)} onSuccess={loadRecentData} />
          )}

          {/* 인증(로그인/회원가입) 모달 */}
          {isAuthModalOpen && (
            <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
          )}
          
          {/* 고객 지원(문의하기) 버튼 */}
          <SupportButton />
        </div>
      </GameDataProvider>
    </BrowserRouter>
  );
}