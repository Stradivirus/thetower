import { X, Trophy } from 'lucide-react';
import { stoneStyles as styles, formatNum } from './StoneShared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  uwName: string;
  statsData: any;
  progress: Record<string, number>;
  category: 'base' | 'plus';
}

export default function UwSummaryModal({ isOpen, onClose, uwName, statsData, progress, category }: Props) {
  if (!isOpen || !statsData) return null;

  const displayName = uwName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  let totalCurrentLv = 0;
  let totalMaxLv = 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* 배경 오버레이 */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />

      {/* 사이드바 컨텐츠 */}
      {/* [Updated] 너비 변경: w-80 -> w-[480px] (더 넓게) */}
      <div 
        className={`relative w-[480px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              {displayName}
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">
              {category === 'base' ? 'Base Stats' : 'UW+ Stats'} Summary
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 스탯 리스트 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.entries(statsData).map(([statName, detail]: [string, any]) => {
            const key = `${category}_${uwName}_${statName}`;
            const currentLevel = progress[key] || 0;
            const maxLevel = detail.values.length;
            const displayMaxLevel = maxLevel - 1; 
            const displayCurrentLevel = currentLevel === 0 ? 0 : currentLevel - 1;
            
            const valueIndex = currentLevel === 0 ? 0 : currentLevel - 1;
            const currentValue = detail.values[valueIndex];

            totalCurrentLv += displayCurrentLevel;
            totalMaxLv += displayMaxLevel;

            const percent = Math.round((displayCurrentLevel / displayMaxLevel) * 100) || 0;

            return (
              <div key={statName} className="bg-slate-950/30 rounded-xl p-4 border border-slate-800/50">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-base font-medium text-slate-300">{detail.name || statName}</span>
                  <span className="text-sm font-bold text-cyan-400">{currentValue}</span>
                </div>
                
                {/* 레벨 표시 */}
                <div className="flex justify-between items-end text-sm mb-2">
                  <span className="text-slate-500 font-mono">Lv <span className="text-white font-bold">{displayCurrentLevel}</span> / {displayMaxLevel}</span>
                  <span className="text-slate-600 font-medium">{percent}%</span>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
          <div className="flex justify-between items-center text-base">
            <span className="text-slate-400">Total Levels</span>
            <span className="text-white font-bold font-mono text-lg">
              {totalCurrentLv} <span className="text-slate-600 text-sm">/ {totalMaxLv}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}