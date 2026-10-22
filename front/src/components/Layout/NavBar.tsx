/**
 * 파일명: thetower/front/src/components/Layout/NavBar.tsx
 * 용도: 애플리케이션 상단 네비게이션 바
 * 기능: 페이지 이동 라우팅, 인증 상태 표시, 다국어 전환 버튼 및 리포트 추가 모달 트리거
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Triangle, Archive, LayoutGrid, LogIn, LogOut, Box, Languages, Eye } from 'lucide-react';
import { T, CURRENT_LANG, toggleLanguage } from '../../locales'; 

interface NavBarProps {
  token: string | null;      // 인증 토큰 (로그인 여부 확인용)
  isGuest?: boolean;         // 비로그인 둘러보기 모드 여부
  isModalOpen?: boolean;     // 모달 오픈 여부 (단축키 충돌 방지용)
  onLogout: () => void;      // 로그아웃 핸들러
  onOpenAuth: () => void;    // 로그인 모달 오픈 핸들러
  onOpenReport: () => void;  // 리포트 입력 모달 오픈 핸들러
}

export default function NavBar({ token, isGuest = false, isModalOpen = false, onLogout, onOpenAuth, onOpenReport }: NavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const Text = T.layout.NAV;

  // 전역 네비게이션 및 액션 단축키 (Z: 기록실, X: 모듈, C: 스톤, V: 리포트 추가)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const activeTag = activeEl?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || activeEl?.isContentEditable) {
        return;
      }

      if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z' || e.key === 'ㅋ') {
        e.preventDefault();
        navigate('/history');
      } else if (e.code === 'KeyX' || e.key === 'x' || e.key === 'X' || e.key === 'ㅌ') {
        e.preventDefault();
        navigate('/modules');
      } else if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C' || e.key === 'ㅊ') {
        e.preventDefault();
        navigate('/stones');
      } else if ((e.code === 'KeyV' || e.key === 'v' || e.key === 'V' || e.key === 'ㅍ') && token) {
        e.preventDefault();
        onOpenReport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, token, navigate, onOpenReport]);

  /** 
   * 현재 경로에 따라 활성화된 버튼 스타일을 반환합니다.
   * @param path 체크할 경로
   * @param colorClass 활성화 시 적용할 색상 클래스
   */
  const navBtnClass = (path: string, colorClass: string) => 
    `flex items-center gap-2 px-2 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${
      currentPath === path 
      ? `${colorClass}` 
      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 md:py-0 md:h-16 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* 1줄째: 로고 + (모바일) 메인 내비 */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              T
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
              The Tower <span className="text-slate-500 text-base font-normal">Analytics</span>
            </span>
          </div>

          {/* (모바일) 메인 내비 버튼들 */}
          <div className="flex-1 flex md:hidden items-center justify-end gap-1.5">
            <button
              onClick={() => navigate('/')}
              className={navBtnClass('/', 'bg-blue-500/10 text-blue-400 border-blue-500/50')}
            >
              <LayoutGrid size={16} />
              <span className="text-xs">{Text.MAIN}</span>
            </button>

            <button
              onClick={() => navigate('/history')}
              className={navBtnClass('/history', 'bg-purple-500/10 text-purple-400 border-purple-500/50')}
            >
              <Archive size={16} />
              <span className="text-xs">{Text.HISTORY}</span>
            </button>

            <button
              onClick={() => navigate('/modules')}
              className={navBtnClass('/modules', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50')}
            >
              <Box size={16} />
              <span className="text-xs">{Text.MODULE}</span>
            </button>

            <button
              onClick={() => navigate('/stones')}
              className={navBtnClass('/stones', 'bg-green-500/10 text-green-400 border-green-500/50')}
            >
              <Triangle size={16} />
              <span className="text-xs">{Text.STONE}</span>
            </button>
          </div>

          {/* 데스크톱용 우측 액션 (언어 + 로그인) */}
          <div className="hidden md:flex items-center gap-2">
            {/* 다국어 변환 버튼 */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
              title={CURRENT_LANG === 'KR' ? 'Switch to English' : '한국어로 변경'}
            >
              <Languages size={14} />
              {CURRENT_LANG === 'KR' ? 'EN' : 'KR'}
            </button>

            {/* Auth Buttons */}
            {token ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={Text.LOGOUT}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {isGuest && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 select-none">
                    <Eye size={13} /> {Text.GUEST_BADGE}
                  </span>
                )}
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                >
                  <LogIn size={16} /> <span className="hidden md:inline">{Text.LOGIN}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2줄째: 메인 내비 + 액션들 */}
        {/* 데스크톱 레이아웃 */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <button
            onClick={() => navigate('/')}
            className={navBtnClass('/', 'bg-blue-500/10 text-blue-400 border-blue-500/50')}
          >
            <LayoutGrid size={16} /> <span className="hidden md:inline">{Text.MAIN}</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className={navBtnClass('/history', 'bg-purple-500/10 text-purple-400 border-purple-500/50')}
            title={`${Text.HISTORY} (Z)`}
          >
            <Archive size={16} />
            <span className="hidden md:inline">{Text.HISTORY}</span>
            <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/70 text-slate-400 border border-slate-700/80 leading-none">
              Z
            </span>
          </button>

          <button
            onClick={() => navigate('/modules')}
            className={navBtnClass('/modules', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50')}
            title={`${Text.MODULE} (X)`}
          >
            <Box size={16} />
            <span className="hidden md:inline">{Text.MODULE}</span>
            <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/70 text-slate-400 border border-slate-700/80 leading-none">
              X
            </span>
          </button>

          <button
            onClick={() => navigate('/stones')}
            className={navBtnClass('/stones', 'bg-green-500/10 text-green-400 border-green-500/50')}
            title={`${Text.STONE} (C)`}
          >
            <Triangle size={16} />
            <span className="hidden md:inline">{Text.STONE}</span>
            <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/70 text-slate-400 border border-slate-700/80 leading-none">
              C
            </span>
          </button>

          {token && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 ml-2"
              title={`${Text.ADD} (V)`}
            >
              <Plus size={16} />
              <span className="hidden md:inline">{Text.ADD}</span>
              <span className="hidden md:inline text-[11px] font-mono bg-blue-700/80 px-1.5 py-0.5 rounded text-blue-100 border border-blue-400/30 leading-none">
                V
              </span>
            </button>
          )}
        </div>

        {/* 모바일 레이아웃: 2줄 구조 (2줄째는 액션 영역만) */}
        <div className="md:hidden flex flex-col gap-2">
          {/* 액션 버튼 줄: 기록 추가 + 언어 + 로그인 */}
          <div className="flex items-center justify-between gap-2">
            {token ? (
              <button
                onClick={onOpenReport}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus size={16} />
                <span className="text-xs">{Text.ADD}</span>
              </button>
            ) : isGuest ? (
              <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 select-none">
                <Eye size={14} /> {Text.GUEST_BADGE}
              </span>
            ) : <div className="flex-1" />}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
              title={CURRENT_LANG === 'KR' ? 'Switch to English' : '한국어로 변경'}
            >
              <Languages size={14} />
              {CURRENT_LANG === 'KR' ? 'EN' : 'KR'}
            </button>

            {token ? (
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={Text.LOGOUT}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
              >
                <LogIn size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}