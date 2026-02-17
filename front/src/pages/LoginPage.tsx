/**
 * 파일명: thetower/front/src/pages/LoginPage.tsx
 * 용도: 사용자 인증(로그인 및 회원가입) 인터페이스 페이지
 * 기능: 로그인/회원가입 모드 전환, 폼 유효성 검사, API 연동 및 에러 처리
 */
import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';

interface Props {
  onLoginSuccess: (token: string) => void; // 로그인 성공 시 실행할 콜백 (토큰 전달)
  onCancel: () => void;                   // 취소 시 실행할 콜백
}

export default function LoginPage({ onLoginSuccess, onCancel }: Props) {
  const [isRegister, setIsRegister] = useState(false); // 회원가입 모드 여부
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** 
   * 폼 제출 핸들러: 모드에 따라 로그인 또는 회원가입 API 호출 
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // 회원가입 프로세스
        await registerUser(email, password);
        alert("회원가입 성공! 로그인합니다.");
        setIsRegister(false); // 회원가입 완료 후 로그인 모드로 자동 전환
      } else {
        // 로그인 프로세스
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

          {/* 에러 메시지 표시 */}
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