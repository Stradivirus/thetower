import { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, User } from 'lucide-react';
import { loginUser, registerUser } from '../../api/auth';

interface Props {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function AuthModal({ onClose, onLoginSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // [New] 비밀번호 확인용 state
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. 기본 유효성 검사 (4자 이상)
    if (username.length < 4) {
      setError("아이디는 4자 이상이어야 합니다.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    // 2. [New] 회원가입 시 비밀번호 일치 검사
    if (isRegister && password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // 회원가입 시도 -> 실패 시(중복 아이디 등) catch로 이동
        await registerUser(username, password);
        alert("가입 성공! 자동으로 로그인합니다.");
        
        // 가입 성공 후 바로 로그인
        const data = await loginUser(username, password);
        onLoginSuccess(data.access_token);
        onClose();
      } else {
        // 로그인 시도
        const data = await loginUser(username, password);
        onLoginSuccess(data.access_token);
        onClose();
      }
    } catch (err) {
      // 백엔드에서 보낸 에러 메시지(예: "이미 사용 중인 아이디입니다.")가 여기 표시됨
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모드 전환 시 에러 및 입력값 초기화
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" size={20} />
            {isRegister ? '회원가입' : '로그인'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">아이디 (최소 4자)</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">비밀번호 (최소 4자)</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* [New] 회원가입일 때만 비밀번호 확인 필드 표시 */}
            {isRegister && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">비밀번호 확인</label>
                <input 
                  type="password" 
                  required
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors text-sm ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '처리 중...' : isRegister ? <><UserPlus size={16}/> 가입하기</> : <><LogIn size={16}/> 로그인</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={toggleMode} 
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}