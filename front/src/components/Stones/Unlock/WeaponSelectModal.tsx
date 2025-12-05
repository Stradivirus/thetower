import { X, MousePointerClick, Check } from 'lucide-react';

interface Props {
  state: { 
    type: 'base' | 'plus'; 
    count: number; 
    selected: string[];
  };
  allWeaponKeys: string[];
  unlockedBase: string[];
  unlockedPlus: string[];
  onToggle: (uwKey: string) => void;
  onClose: () => void;
}

export default function WeaponSelectModal({ 
  state, 
  allWeaponKeys, 
  unlockedBase, 
  unlockedPlus, 
  onToggle, 
  onClose 
}: Props) {
  const { type, count, selected } = state;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MousePointerClick size={18} className="text-blue-400"/>
              Select <span className="text-blue-400">{count}</span> Weapons
            </h3>
            <p className="text-xs text-slate-400 mt-1">선택됨: <span className="text-white font-bold">{selected.length}</span> / {count}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={20} /></button>
        </div>

        {/* 무기 리스트 */}
        <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 mb-4 pr-1">
          {allWeaponKeys.map(uwKey => {
            const displayName = uwKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const isSelected = selected.includes(uwKey);
            
            // 비활성화 로직
            let isDisabled = false;
            if (type === 'base') {
              if (unlockedBase.includes(uwKey)) isDisabled = true;
            } else {
              if (!unlockedBase.includes(uwKey)) isDisabled = true; 
              if (unlockedPlus.includes(uwKey)) isDisabled = true;
            }

            if (isDisabled) return null;

            return (
              <button
                key={uwKey}
                onClick={() => onToggle(uwKey)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-bold border relative overflow-hidden ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-200'}`}
              >
                <span>{displayName}</span>
                {isSelected && <Check size={16} className="text-blue-400" />}
              </button>
            );
          })}
        </div>

        {/* [Updated] 버튼 제거 및 상태 메시지 표시 */}
        <div className="text-center py-2 text-sm font-bold text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
          {count - selected.length} more to select...
        </div>
      </div>
    </div>
  );
}