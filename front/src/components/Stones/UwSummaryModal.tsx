import { X, Trophy, Zap, Clock, Hash, Target, Minimize, Maximize, Layers, Sparkles } from 'lucide-react'; // [수정] FlaskConical 아이콘 임포트 제거
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import cardCosts from '../../data/card_mastery_costs.json';
import labConfig from '../../data/uw_lab_config.json'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<string, any>;
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

// 연구 효과를 합산하는 함수 (변화 없음)
const applyLabEffect = (uwKey: string, statKey: string, currentValue: number, progress: Record<string, any>) => {
    const labStats = (labConfig as any)[uwKey];
    let addedValue = 0;
    let isLabActive = false;
    
    if (!labStats) return { finalValue: currentValue, isLabActive };

    // GT 지속시간, CF 지속시간, GT 보너스만 해당
    if (statKey === 'duration') {
        const labDurationKey = `${uwKey}_lab_duration_on`;
        const labDurationInfo = labStats['lab_duration'];
        
        if (progress[labDurationKey] === 1 && labDurationInfo) {
            addedValue += labDurationInfo.value;
            isLabActive = true;
        }
    }
    
    if (statKey === 'bonus') {
        const labBonusKey = `${uwKey}_lab_bonus_on`;
        const labBonusInfo = labStats['lab_bonus'];
        
        if (progress[labBonusKey] === 1 && labBonusInfo) {
            addedValue += labBonusInfo.value;
            isLabActive = true;
        }
    }

    // 값 합산 및 반환
    return { finalValue: currentValue + addedValue, isLabActive };
}

export default function UwSummaryModal({ isOpen, onClose, progress }: Props) {
  if (!isOpen) return null;

  // 1. 마스터한 카드 데이터
  const completedCards = cardCosts.filter(c => progress[`card_${c.name}`] === 1);

  // 2. 활성화된 궁극 무기 데이터 통합
  const allUwKeys = Array.from(new Set([...Object.keys(baseStats), ...Object.keys(plusStats)]));
  
  const activeUws = allUwKeys.map(uwKey => {
    const baseData = (baseStats as any)[uwKey] || {};
    
    const activeBaseStats = Object.entries(baseData).map(([statName, detail]: [string, any]) => {
      const progressKey = `base_${uwKey}_${statName}`;
      const currentLevel = progress[progressKey] || 0;
      
      if (currentLevel === 0) return null;
      
      const displayLevel = currentLevel - 1;
      const displayMax = detail.values.length - 1;
      let currentValue = detail.values[displayLevel];

      // [New] GT/CF의 duration/bonus에 연구 효과 합산
      const { finalValue, isLabActive } = applyLabEffect(uwKey, statName, currentValue, progress);
      currentValue = finalValue; 
      
      // [수정] isLabActive를 반환하여 렌더링 시 참고 가능하도록 합니다.
      return { statName, detail, displayLevel, displayMax, currentValue, isLabActive };
    }).filter(item => item !== null);


    const plusData = (plusStats as any)[uwKey] || {};
    const activePlusStats = Object.entries(plusData).map(([statName, detail]: [string, any]) => {
        const progressKey = `plus_${uwKey}_${statName}`;
        const currentLevel = progress[progressKey] || 0;
        
        if (currentLevel === 0) return null;
        
        const displayLevel = currentLevel - 1;
        const displayMax = detail.values.length - 1;
        const currentValue = detail.values[displayLevel];
        
        return { statName, detail, displayLevel, displayMax, currentValue };
    }).filter(item => item !== null);

    if (activeBaseStats.length === 0 && activePlusStats.length === 0) return null;


    return {
      key: uwKey,
      displayName: uwKey.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      base: activeBaseStats,
      plus: activePlusStats,
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
                    {uw!.base.map((stat: any) => {
                      const { statName, detail, displayLevel, displayMax, currentValue, isLabActive } = stat;
                      const isMaxed = displayLevel >= displayMax;

                      return (
                        <div key={statName} className="w-[150px] flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-slate-600 transition-colors shadow-sm min-h-[64px]">
                          <div className="absolute -bottom-2 -right-2 p-1 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                             {getStatIcon(statName)}
                          </div>

                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="flex-shrink-0">{getStatIcon(statName)}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{detail.name || statName}</span>
                              {/* [수정] 연구소 모양 아이콘 제거 */}
                            </div>
                            <div className="text-base font-bold text-cyan-400 font-mono leading-none">
                              {/* 합산된 값 표시, unit이 x면 소수점 2자리 */}
                              {currentValue.toFixed(detail.unit === 'x' ? 2 : 0)}<span className="text-[10px] text-slate-500 font-normal ml-0.5">{detail.unit}</span>
                            </div>
                          </div>
                          
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
                    {uw!.plus.map((stat: any) => {
                      const { statName, detail, displayLevel, displayMax, currentValue } = stat;
                      const isMaxed = displayLevel >= displayMax;

                      return (
                        <div key={statName} className="w-[150px] flex-shrink-0 bg-slate-900 border-2 border-pink-500/30 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.1)] hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] min-h-[64px]">
                          <div className="absolute -bottom-2 -right-2 p-1 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                             <Sparkles size={16} className="text-pink-500" />
                          </div>

                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="flex-shrink-0"><Sparkles size={12} className="text-pink-400 fill-pink-400/20" /></span>
                              <span className="text-[10px] font-bold text-pink-200 uppercase tracking-wider truncate">{detail.name || statName}</span>
                            </div>
                            <div className="text-base font-bold text-pink-300 font-mono leading-none">
                              {currentValue}<span className="text-[10px] text-pink-500/70 font-normal ml-0.5">{detail.unit}</span>
                            </div>
                          </div>
                          
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