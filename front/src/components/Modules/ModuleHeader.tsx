import { Save } from 'lucide-react';
import { MODULE_TYPES, RARITIES } from './ModuleConstants';

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  rarity: number;
  setRarity: (r: number) => void;
  handleSave: () => void;
  isChanged: boolean;
  token: string | null;
}

export default function ModuleHeader({ 
  activeTab, setActiveTab, rarity, setRarity, 
  handleSave, isChanged, token
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800 shrink-0">
      {/* 탭 선택 */}
      <div className="flex gap-2">
        {MODULE_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveTab(type.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border
              ${activeTab === type.id ? `${type.bg} ${type.color} ${type.border}` : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}
            `}
          >
            <type.icon size={16} />
            <span className="hidden sm:inline">{type.label}</span>
          </button>
        ))}
      </div>

      {/* 중앙 컨트롤: 등급 선택 */}
      <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
        <span className="text-xs font-bold text-slate-500 mr-2">Preview Rarity</span>
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

      {/* 저장 및 요약 버튼 */}
      <button 
        onClick={handleSave}
        disabled={!token}
        className={`
          flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all border
          ${token
            ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
        `}
      >
        <Save size={18} /> {isChanged ? '저장 및 요약*' : '저장 및 요약'}
      </button>
    </div>
  );
}