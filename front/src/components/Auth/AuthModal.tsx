import { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, User } from 'lucide-react';
import { loginUser, registerUser } from '../../api/auth';
import { T } from '../../locales'; // [New] 언어팩

interface Props {
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export default function AuthModal({ onClose, onLoginSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 텍스트 단축어
  const Text = T.auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 4) {
      setError(Text.ERR_ID_LENGTH);
      return;
    }
    if (password.length < 4) {
      setError(Text.ERR_PW_LENGTH);
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError(Text.ERR_PW_MISMATCH);
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await registerUser(username, password);
        alert(Text.SUCCESS_REGISTER);
        const data = await loginUser(username, password);
        onLoginSuccess(data.access_token);
        onClose();
      } else {
        const data = await loginUser(username, password);
        onLoginSuccess(data.access_token);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : T.common.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" size={20} />
            {isRegister ? Text.REGISTER_TITLE : Text.LOGIN_TITLE}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{Text.ID_LABEL}</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder={Text.ID_PLACEHOLDER}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{Text.PW_LABEL}</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder={Text.PW_PLACEHOLDER}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isRegister && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{Text.PW_CONFIRM_LABEL}</label>
                <input 
                  type="password" 
                  required
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors text-sm ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-slate-700 focus:border-blue-500'
                  }`}
                  placeholder={Text.PW_CONFIRM_PLACEHOLDER}
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
              {loading ? Text.BTN_PROCESSING : isRegister ? <><UserPlus size={16}/> {Text.BTN_REGISTER}</> : <><LogIn size={16}/> {Text.BTN_LOGIN}</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={toggleMode} 
              className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              {isRegister ? Text.LINK_TO_LOGIN : Text.LINK_TO_REGISTER}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}