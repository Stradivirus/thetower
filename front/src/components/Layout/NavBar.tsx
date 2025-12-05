import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Triangle, Archive, LayoutGrid, LogIn, LogOut, Box } from 'lucide-react';

interface NavBarProps {
  token: string | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenReport: () => void;
}

export default function NavBar({ token, onLogout, onOpenAuth, onOpenReport }: NavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navBtnClass = (path: string, colorClass: string) => 
    `flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all border ${
      currentPath === path 
      ? `${colorClass}` 
      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">T</div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:block">The Tower <span className="text-slate-500 text-base font-normal">Analytics</span></span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => navigate('/')} className={navBtnClass('/', 'bg-blue-500/10 text-blue-400 border-blue-500/50')}>
            <LayoutGrid size={16} /> <span className="hidden md:inline">Main</span>
          </button>

          <button onClick={() => navigate('/history')} className={navBtnClass('/history', 'bg-purple-500/10 text-purple-400 border-purple-500/50')}>
            <Archive size={16} /> <span className="hidden md:inline">기록</span>
          </button>

          <button onClick={() => navigate('/modules')} className={navBtnClass('/modules', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50')}>
            <Box size={16} /> <span className="hidden md:inline">Modules</span>
          </button>

          <button onClick={() => navigate('/stones')} className={navBtnClass('/stones', 'bg-green-500/10 text-green-400 border-green-500/50')}>
            <Triangle size={16} /> <span className="hidden md:inline">Stones</span>
          </button>

          <button 
            onClick={() => {
                if(!token) { onOpenAuth(); return; }
                onOpenReport();
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 ml-2"
          >
            <Plus size={16} /> <span className="hidden md:inline">추가</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>
          
          {token ? (
              <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Logout">
                  <LogOut size={18} />
              </button>
          ) : (
              <button onClick={onOpenAuth} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all border bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white">
                  <LogIn size={16} /> <span className="hidden md:inline">Login</span>
              </button>
          )}
        </div>
      </div>
    </nav>
  );
}