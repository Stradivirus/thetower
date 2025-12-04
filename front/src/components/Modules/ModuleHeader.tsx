import { ToggleLeft, ToggleRight, Save, List } from 'lucide-react';
import { MODULE_TYPES, RARITIES } from './ModuleConstants';

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  rarity: number;
  setRarity: (r: number) => void;
  isAssistMode: boolean;
  toggleAssistMode: () => void;
  handleSave: () => void;
  isChanged: boolean;
}

export default function ModuleHeader({ 
  activeTab, setActiveTab, rarity, setRarity, 
  isAssistMode, toggleAssistMode, handleSave, isChanged 
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

      {/* 중앙 컨트롤: 등급 & 어시스트 */}
      <div className="flex items-center gap-6 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
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
        
        <div className="w-px h-4 bg-slate-700"></div>

        <button 
          onClick={toggleAssistMode}
          className={`flex items-center gap-2 text-sm font-bold transition-colors ${isAssistMode ? 'text-blue-400' : 'text-slate-500'}`}
        >
          {isAssistMode ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          <span>Assist Slot</span>
        </button>
      </div>

      {/* 저장 버튼 */}
      <button 
        onClick={handleSave}
        disabled={!isChanged}
        className={`
          flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all border
          ${isChanged 
            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}
        `}
      >
        <Save size={18} /> 저장 및 요약
      </button>
    </div>
  );
}