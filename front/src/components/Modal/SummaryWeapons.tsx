import { Trophy, Zap, Clock, Hash, Target, Minimize, Maximize, Sparkles } from 'lucide-react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import labConfig from '../../data/uw_lab_config.json';

interface Props {
  progress: Record<string, any>;
}

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

const applyLabEffect = (uwKey: string, statKey: string, currentValue: number, progress: Record<string, any>) => {
    const labStats = (labConfig as any)[uwKey];
    let addedValue = 0;
    let isLabActive = false;
    
    if (!labStats) return { finalValue: currentValue, isLabActive };

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

    return { finalValue: currentValue + addedValue, isLabActive };
}

// [New] 숫자 포맷팅 헬퍼 함수
// 정수면 정수 그대로, 소수면 최대 2자리까지 표시하되 불필요한 0은 제거 (예: 27.50 -> 27.5, 27.00 -> 27)
const formatValue = (num: number) => parseFloat(num.toFixed(2));

export function SummaryWeapons({ progress }: Props) {
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

      const { finalValue, isLabActive } = applyLabEffect(uwKey, statName, currentValue, progress);
      currentValue = finalValue; 
      
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
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-yellow-400" />
        <h3 className="text-base font-bold text-white">Ultimate Weapons</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {activeUws.length > 0 ? (
          activeUws.map((uw) => (
            <div key={uw!.key} className="animate-fade-in">
              <h4 className="text-sm font-bold text-white mb-3 ml-0.5">
                {uw!.displayName}
              </h4>

              <div className="flex flex-wrap gap-2.5">
                {/* Base Stats */}
                {uw!.base.map((stat: any) => {
                  const { statName, detail, displayLevel, displayMax, currentValue} = stat;
                  const isMaxed = displayLevel >= displayMax;

                  return (
                    <div key={statName} className="w-[240px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-slate-600 transition-colors shadow-sm min-h-[64px]">
                      <div className="absolute -bottom-2 -right-2 p-1 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                         {getStatIcon(statName)}
                      </div>

                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="flex-shrink-0">{getStatIcon(statName)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{detail.name || statName}</span>
                        </div>
                        
                        {/* [Modified] formatValue 사용으로 소수점 버그 수정 및 색상 로직 적용 */}
                        <div className={`text-base font-bold font-mono leading-none ${isMaxed ? 'text-yellow-400' : 'text-cyan-400'}`}>
                          {formatValue(currentValue)}<span className="text-[10px] text-slate-500 font-normal ml-0.5">{detail.unit}</span>
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

                {/* Plus Stats */}
                {uw!.plus.map((stat: any) => {
                  const { statName, detail, displayLevel, displayMax, currentValue } = stat;
                  const isMaxed = displayLevel >= displayMax;

                  return (
                    <div key={statName} className="w-[240px] bg-slate-900 border-2 border-pink-500/30 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.1)] hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] min-h-[64px]">
                      <div className="absolute -bottom-2 -right-2 p-1 opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12 scale-150 pointer-events-none">
                         <Sparkles size={16} className="text-pink-500" />
                      </div>

                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="flex-shrink-0"><Sparkles size={12} className="text-pink-400 fill-pink-400/20" /></span>
                          <span className="text-[10px] font-bold text-pink-200 uppercase tracking-wider truncate">{detail.name || statName}</span>
                        </div>
                        
                        {/* [Modified] formatValue 사용으로 소수점 버그 수정 및 색상 로직 적용 */}
                        <div className={`text-base font-bold font-mono leading-none ${isMaxed ? 'text-yellow-400' : 'text-pink-300'}`}>
                          {formatValue(currentValue)}<span className="text-[10px] text-pink-500/70 font-normal ml-0.5">{detail.unit}</span>
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
          ))
        ) : (
          <div className="text-center py-20 text-slate-500">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-base">궁극 무기 데이터가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}