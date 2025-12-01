import { X, Trophy, Zap, Clock, Hash, Target, Minimize, Maximize, Layers, Sparkles } from 'lucide-react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import cardCosts from '../../data/card_mastery_costs.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<string, number>;
  category: string;
}

// 스탯 이름에 따른 아이콘 매핑
const getStatIcon = (name: string, isPlus: boolean = false) => {
  if (isPlus) return <Sparkles size={12} className="text-pink-400" />;

  const n = name.toLowerCase();
  const size = 12;
  if (n.includes('damage') || n.includes('bonus')) return <Zap size={size} className="text-yellow-500" />;
  if (n.includes('cooldown') || n.includes('duration')) return <Clock size={size} className="text-blue-500" />;
  if (n.includes('quantity') || n.includes('count')) return <Hash size={size} className="text-green-500" />;
  if (n.includes('size') || n.includes('range')) return <Maximize size={size} className="text-purple-500" />;
  if (n.includes('angle')) return <Minimize size={size} className="text-orange-500" />;
  return <Target size={size} className="text-red-500" />;
};

export default function UwSummaryModal({ isOpen, onClose, progress }: Props) {
  if (!isOpen) return null;

  // 1. 마스터한 카드 데이터
  const completedCards = cardCosts.filter(c => progress[`card_${c.name}`] === 1);

  // 2. 활성화된 궁극 무기 데이터 통합
  const allUwKeys = Array.from(new Set([...Object.keys(baseStats), ...Object.keys(plusStats)]));
  
  const activeUws = allUwKeys.map(uwKey => {
    const baseData = (baseStats as any)[uwKey] || {};
    const activeBaseStats = Object.entries(baseData).filter(([statKey]) => {
      return (progress[`base_${uwKey}_${statKey}`] || 0) > 0;
    });

    const plusData = (plusStats as any)[uwKey] || {};
    const activePlusStats = Object.entries(plusData).filter(([statKey]) => {
      return (progress[`plus_${uwKey}_${statKey}`] || 0) > 0;
    });

    if (activeBaseStats.length === 0 && activePlusStats.length === 0) return null;

    return {
      key: uwKey,
      displayName: uwKey.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      base: activeBaseStats,
      plus: activePlusStats
    };
  }).filter(item => item !== null);

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* 모달 컨테이너 */}
      <div className={`relative w-fit h-full bg-[#0f172a] border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col min-w-[320px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0f172a] z-10 gap-8">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Trophy className="text-yellow-400 flex-shrink-0" size={22} />
            <h2 className="text-lg font-bold text-white flex items-baseline gap-2">
              Total Summary
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">— Card & UW Status</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 리스트 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          
          {/* === 1. 마스터한 카드 섹션 === */}
          {completedCards.length > 0 && (
            <div className="animate-fade-in w-full">
               <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5 whitespace-nowrap">
                  <Layers size={14} className="text-purple-400" />
                  Mastered Cards <span className="text-slate-600">({completedCards.length})</span>
               </div>
               <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/50 flex flex-wrap gap-1.5 w-full">
                  {completedCards.map((card) => (
                    <div key={card.name} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-[11px] font-medium shadow-sm whitespace-nowrap">
                      {card.name}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* === 2. 궁극 무기 섹션 === */}
          {activeUws.length > 0 ? (
            <div className="space-y-6">
              {activeUws.map((uw) => (
                <div key={uw!.key} className="animate-fade-in w-full">
                  <h3 className="text-base font-bold text-white mb-2.5 ml-0.5 flex items-center gap-2 whitespace-nowrap">
                    {uw!.displayName}
                  </h3>

                  {/* 카드 리스트 컨테이너 */}
                  <div className="flex flex-nowrap gap-2.5 w-full select-none">
                    
                    {/* (1) Base Stats */}
                    {uw!.base.map(([statName, detail]: [string, any]) => {
                      const progressKey = `base_${uw!.key}_${statName}`;
                      const currentLevel = progress[progressKey] || 0;
                      const displayLevel = currentLevel === 0 ? 0 : currentLevel - 1;
                      const displayMax = detail.values.length - 1;
                      const currentValue = detail.values[displayLevel];
                      const isMaxed = displayLevel >= displayMax;

                      return (
                        <div key={statName} className="w-[150px] flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-slate-600 transition-colors shadow-sm min-h-[64px]">
                          {/* 배경 장식 */}
                          <div className="absolute -bottom-2 -right-2 p-1 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                             {getStatIcon(statName)}
                          </div>

                          {/* [1단] 이름 (좌) --- 값 (우) */}
                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="flex-shrink-0">{getStatIcon(statName)}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{detail.name || statName}</span>
                            </div>
                            <div className="text-base font-bold text-cyan-400 font-mono leading-none">
                              {currentValue}<span className="text-[10px] text-slate-500 font-normal ml-0.5">{detail.unit}</span>
                            </div>
                          </div>
                          
                          {/* [2단] Lv (좌) --- 레벨 숫자 (우) */}
                          <div className="flex items-end justify-between z-10 w-full">
                            <span className="text-[10px] text-slate-500 font-bold leading-none">Lv</span>
                            <div className="flex items-baseline gap-0.5 font-mono leading-none">
                              <span className={`text-sm font-bold ${isMaxed ? 'text-yellow-400' : 'text-blue-400'}`}>{displayLevel}</span>
                              <span className="text-[10px] text-slate-600">/</span>
                              <span className={`text-[10px] font-bold ${isMaxed ? 'text-yellow-400' : 'text-slate-200'}`}>{displayMax}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* (2) Plus Stats */}
                    {uw!.plus.map(([statName, detail]: [string, any]) => {
                      const progressKey = `plus_${uw!.key}_${statName}`;
                      const currentLevel = progress[progressKey] || 0;
                      const displayLevel = currentLevel === 0 ? 0 : currentLevel - 1;
                      const displayMax = detail.values.length - 1;
                      const currentValue = detail.values[displayLevel];
                      const isMaxed = displayLevel >= displayMax;

                      return (
                        <div key={statName} className="w-[150px] flex-shrink-0 bg-slate-900 border-2 border-pink-500/30 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.1)] hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] min-h-[64px]">
                          {/* 배경 장식 */}
                          <div className="absolute -bottom-2 -right-2 p-1 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                             <Sparkles size={16} className="text-pink-500" />
                          </div>

                          {/* [1단] 이름 (좌) --- 값 (우) */}
                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="flex-shrink-0"><Sparkles size={12} className="text-pink-400 fill-pink-400/20" /></span>
                              <span className="text-[10px] font-bold text-pink-200 uppercase tracking-wider truncate">{detail.name || statName}</span>
                            </div>
                            <div className="text-base font-bold text-pink-300 font-mono leading-none">
                              {currentValue}<span className="text-[10px] text-pink-500/70 font-normal ml-0.5">{detail.unit}</span>
                            </div>
                          </div>
                          
                          {/* [2단] Lv (좌) --- 레벨 숫자 (우) */}
                          <div className="flex items-end justify-between z-10 w-full">
                            <span className="text-[10px] text-slate-500 font-bold leading-none">Lv</span>
                            <div className="flex items-baseline gap-0.5 font-mono leading-none">
                              <span className={`text-sm font-bold ${isMaxed ? 'text-yellow-400' : 'text-pink-400'}`}>{displayLevel}</span>
                              <span className="text-[10px] text-slate-600">/</span>
                              <span className={`text-[10px] font-bold ${isMaxed ? 'text-yellow-400' : 'text-slate-200'}`}>{displayMax}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 데이터가 없을 때 표시
            completedCards.length > 0 ? (
               <div className="text-center py-20 text-slate-500 whitespace-nowrap">궁극 무기 데이터가 없습니다.</div>
            ) : (
               <div className="text-center text-slate-500 py-20 flex flex-col items-center whitespace-nowrap">
                 <Trophy size={48} className="mb-4 opacity-20" />
                 <p className="text-lg">아직 기록된 데이터가 없습니다.</p>
               </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}