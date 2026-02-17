/**
 * 파일명: thetower/front/src/components/Modal/SummaryWeapons.tsx
 * 용도: 요약 모달 내에서 활성화된 궁극 무기(UW) 및 UW+의 스탯 현황 표시
 * 기능: 진행도 데이터 분석, 연구(Lab) 효과 적용된 최종 수치 계산, 해금된 무기별 스탯 카드 렌더링
 */
import { Trophy } from 'lucide-react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import labConfig from '../../data/uw_lab_config.json';
import { T } from '../../locales'; 

interface Props {
  progress: Record<string, any>; // 사용자의 게임 진행도 데이터
}

/** 
 * 연구(Lab) 효과를 적용하여 최종 스탯 수치를 계산합니다.
 * @param uwKey 무기 키 (예: 'death_wave')
 * @param statKey 스탯 키 (예: 'duration')
 * @param currentValue 기본 스탯 값
 * @param progress 현재 진행도 데이터
 */
const applyLabEffect = (uwKey: string, statKey: string, currentValue: number, progress: Record<string, any>) => {
    const labStats = (labConfig as any)[uwKey];
    let addedValue = 0;
    let isLabActive = false;
    
    if (!labStats) return { finalValue: currentValue, isLabActive };

    // 지속시간(Duration) 연구 적용
    if (statKey === 'duration') {
        const labDurationKey = `${uwKey}_lab_duration_on`;
        const labDurationInfo = labStats['lab_duration'];
        
        if (progress[labDurationKey] === 1 && labDurationInfo) {
            addedValue += labDurationInfo.value;
            isLabActive = true;
        }
    }
    
    // 보너스(Bonus) 연구 적용
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

const formatValue = (num: number) => parseFloat(num.toFixed(2));

export function SummaryWeapons({ progress }: Props) {
  const allUwKeys = Array.from(new Set([...Object.keys(baseStats), ...Object.keys(plusStats)]));
  
  /** 
   * 사용자가 현재 레벨을 1 이상 올린 활성화된 무기들만 필터링하고 데이터를 구성합니다.
   */
  const activeUws = allUwKeys.map(uwKey => {
    const baseData = (baseStats as any)[uwKey] || {};
    
    // 1. 기본 스탯(Base Stats) 처리
    const activeBaseStats = Object.entries(baseData).map(([statName, detail]: [string, any]) => {
      const progressKey = `base_${uwKey}_${statName}`;
      const currentLevel = progress[progressKey] || 0;
      
      if (currentLevel === 0) return null;
      
      const displayLevel = currentLevel - 1;
      const displayMax = detail.values.length - 1;
      let currentValue = detail.values[displayLevel];

      // 연구 효과 적용
      const { finalValue, isLabActive } = applyLabEffect(uwKey, statName, currentValue, progress);
      currentValue = finalValue; 
      
      return { statName, detail, displayLevel, displayMax, currentValue, isLabActive };
    }).filter(item => item !== null);

    // 2. 플러스 스탯(UW+ Stats) 처리
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
    <div className="w-full">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-yellow-400" />
        <h3 className="text-base font-bold text-white">{T.summary.WEAPONS.TITLE}</h3>
      </div>
      
      <div className="space-y-6">
        {activeUws.length > 0 ? (
          activeUws.map((uw) => (
            <div key={uw!.key} className="animate-fade-in">
              <h4 className="text-base font-bold text-white mb-3 ml-0.5">
                {uw!.displayName}
              </h4>

              <div className="flex flex-wrap gap-2.5">
                {/* 기본 스탯(Base) 카드 리스트 */}
                {uw!.base.map((stat: any) => {
                  const { statName, detail, displayLevel, displayMax, currentValue} = stat;
                  const isMaxed = displayLevel >= displayMax;

                  return (
                    <div key={statName} className="w-[200px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-slate-600 transition-colors shadow-sm min-h-[64px]">
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{detail.name || statName}</span>
                        </div>
                        
                        <div className={`text-xl font-bold font-mono leading-none ${isMaxed ? 'text-yellow-400' : 'text-cyan-400'}`}>
                          {formatValue(currentValue)}<span className="text-xs text-slate-500 font-normal ml-0.5">{detail.unit}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between z-10 w-full">
                        <span className="text-xs text-slate-500 font-bold leading-none">{T.summary.WEAPONS.LEVEL}</span>
                        <div className="flex items-baseline gap-0.5 font-mono leading-none">
                          <span className={`text-base font-bold ${isMaxed ? 'text-yellow-400' : 'text-blue-400'}`}>{displayLevel}</span>
                          <span className="text-xs text-slate-600">/</span>
                          <span className={`text-xs font-bold ${isMaxed ? 'text-yellow-400' : 'text-slate-200'}`}>{displayMax}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 플러스 스탯(Plus) 카드 리스트 */}
                {uw!.plus.map((stat: any) => {
                  const { statName, detail, displayLevel, displayMax, currentValue } = stat;
                  const isMaxed = displayLevel >= displayMax;

                  return (
                    <div key={statName} className="w-[190px] bg-slate-900 border-2 border-pink-500/30 rounded-lg px-3 py-2 flex flex-col justify-center gap-1 relative overflow-hidden group hover:border-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.1)] hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] min-h-[64px]">
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-xs font-bold text-pink-200 uppercase tracking-wider truncate">{detail.name || statName}</span>
                        </div>
                        
                        <div className={`text-xl font-bold font-mono leading-none ${isMaxed ? 'text-yellow-400' : 'text-pink-300'}`}>
                          {formatValue(currentValue)}<span className="text-xs text-pink-500/70 font-normal ml-0.5">{detail.unit}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-end justify-between z-10 w-full">
                        <span className="text-xs text-slate-500 font-bold leading-none">{T.summary.WEAPONS.LEVEL}</span>
                        <div className="flex items-baseline gap-0.5 font-mono leading-none">
                          <span className={`text-base font-bold ${isMaxed ? 'text-yellow-400' : 'text-pink-400'}`}>{displayLevel}</span>
                          <span className="text-xs text-slate-600">/</span>
                          <span className={`text-xs font-bold ${isMaxed ? 'text-yellow-400' : 'text-slate-200'}`}>{displayMax}</span>
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
            <p className="text-base">{T.summary.WEAPONS.NO_DATA}</p>
          </div>
        )}
      </div>
    </div>
  );
}