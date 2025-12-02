import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';

interface Props {
  onLoginSuccess: (token: string) => void;
  onCancel: () => void;
}

export default function LoginPage({ onLoginSuccess, onCancel }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // 회원가입 후 바로 로그인 처리 or 로그인 유도 (여기선 바로 로그인 시도)
        await registerUser(email, password);
        alert("회원가입 성공! 로그인합니다.");
        setIsRegister(false); // 로그인 모드로 전환
        // UX상 다시 로그인 요청하거나, 바로 로그인 API 호출 가능
      } else {
        // 로그인
        const data = await loginUser(email, password);
        onLoginSuccess(data.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm">
            {isRegister ? '새로운 계정을 생성하여 기록을 관리하세요.' : '이메일과 비밀번호로 로그인하세요.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">EMAIL</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">PASSWORD</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isRegister ? <><UserPlus size={18}/> Sign Up</> : <><LogIn size={18}/> Login</>}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300">
            취소하고 돌아가기
          </button>
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); }} 
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {isRegister ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}