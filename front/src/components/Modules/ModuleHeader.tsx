// src/components/Modules/ModuleHeader.tsx
import { List, Layers, Box, Dices } from 'lucide-react';

interface Props {
  handleSave: () => void;
  isChanged: boolean;
  token: string | null;
  viewMode: 'equipped' | 'inventory' | 'reroll';
  setViewMode: (mode: 'equipped' | 'inventory' | 'reroll') => void;
}

export default function ModuleHeader({ 
  handleSave, isChanged, token,
  viewMode, setViewMode 
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-950/95 backdrop-blur z-50 shadow-md">
      
      {/* 탭 버튼 그룹 */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setViewMode('equipped')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'equipped' 
              ? 'bg-slate-700 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers size={16} /> 장착 관리
        </button>
        <button
          onClick={() => setViewMode('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'inventory' 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Box size={16} /> 보유 현황
        </button>
        <button
          onClick={() => setViewMode('reroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'reroll' 
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Dices size={16} /> 부옵션 리롤
        </button>
      </div>

      {/* 리롤 모드가 아닐 때만 저장 버튼 표시 */}
      {viewMode !== 'reroll' && (
        <button 
          onClick={handleSave}
          disabled={!token}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border text-sm
            ${token
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' 
              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
          `}
        >
          <List size={16} /> {isChanged ? '저장 및 요약*' : '저장 및 요약'}
        </button>
      )}
    </div>
  );
}