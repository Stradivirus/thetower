import { List, Layers, Box } from 'lucide-react';
import { RARITIES } from './ModuleConstants';

interface Props {
  rarity: number;
  setRarity: (r: number) => void;
  handleSave: () => void;
  isChanged: boolean;
  token: string | null;
  viewMode: 'equipped' | 'inventory';
  setViewMode: (mode: 'equipped' | 'inventory') => void;
}

export default function ModuleHeader({ 
  rarity, setRarity, 
  handleSave, isChanged, token,
  viewMode, setViewMode 
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-950/95 backdrop-blur z-50 shadow-md">
      
      {/* 좌측: 보기 모드 탭 (장착 관리 / 보유 현황) */}
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
      </div>

      <div className="flex items-center gap-4">
        {/* 중앙: 등급 선택 컨트롤 */}
        <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-500 mr-2">
            {viewMode === 'inventory' ? 'Add Rarity' : 'Preview Rarity'}
          </span>
          <div className="flex gap-1">
            {RARITIES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRarity(r.id)}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${rarity === r.id ? `${r.bg} ${r.color} ${r.border}` : 'border-transparent text-slate-600 hover:bg-slate-800'}`}
                title={r.label}
              >
                {r.short}
              </button>
            ))}
          </div>
        </div>

        {/* 우측: 저장 버튼 */}
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
          <List size={16} /> {isChanged ? '저장*' : '저장'}
        </button>
      </div>
    </div>
  );
}