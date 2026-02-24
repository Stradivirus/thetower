/**
 * 파일명: thetower/front/src/components/Stones/UwStatsTab.tsx
 * 용도: 스톤 계산기 페이지의 'Base Stats' 및 'UW+ Stats' 탭 컨텐츠
 * 기능: 해금된 무기별 스탯 정보 리스트업, 레벨별 비용 및 누적 비용 계산, 연구(Lab) 효과 토글 기능
 */
import { useEffect, useMemo } from 'react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import labConfig from '../../data/uw_lab_config.json'; 
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react'; 
import { T } from '../../locales';

interface Props {
  category: 'base' | 'plus';
  progress: Record<string, any>; 
  updateProgress: (key: string, level: number) => void;
  selectedUw: string;
  onSelectUw: (uw: string) => void;
}

/** 
 * [내부 컴포넌트] 연구소(Lab) 효과를 켜고 끌 수 있는 카드형 버튼
 */
const LabCard = ({ labKey, labInfo, progress, updateProgress }: {
  labKey: string;
  labInfo: any;
  progress: Record<string, any>;
  updateProgress: (key: string, level: number) => void;
}) => {
  const progressKey = `${labKey}_on`;
  const isEnabled = progress[progressKey] === 1;
  const ToggleIcon = isEnabled ? ToggleRight : ToggleLeft;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProgress(progressKey, isEnabled ? 0 : 1);
  };
  
  const displayValue = `+${labInfo.value}${labInfo.unit}`;
  const shortName = labInfo.name.split(' ')[1] || labInfo.name; 
  const hoverText = labInfo.desc;

  return (
    <div 
      className={`
        flex items-center justify-between p-3 rounded-xl shadow-md transition-all cursor-pointer
        ${isEnabled 
            ? 'bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30' 
            : 'bg-slate-900 border border-slate-800 hover:border-slate-500/50'
        }
      `}
      onClick={handleToggle}
      title={hoverText}
    >
      <div className="flex items-center gap-2">
         <FlaskConical size={16} className={`${isEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
         <span className={`font-bold text-sm ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
             Lab: {shortName} ({displayValue})
         </span>
      </div>
      <div className="flex items-center gap-1">
          <span className={`text-xs font-bold ${isEnabled ? 'text-yellow-400' : 'text-slate-500'}`}>
              {isEnabled ? 'ON' : 'OFF'}
          </span>
          <ToggleIcon size={20} className={isEnabled ? 'stroke-blue-400' : 'stroke-slate-500'} />
      </div>
    </div>
  );
};

export default function UwStatsTab({ category, progress, updateProgress, selectedUw, onSelectUw }: Props) {
  const statsData = category === 'base' ? baseStats : plusStats;

  const unlockedList: string[] = category === 'base' 
    ? (progress['unlocked_weapons'] || []) 
    : (progress['unlocked_plus_weapons'] || []);

  // 현재 해금된 무기들만 필터링
  const availableUwKeys = Object.keys(statsData).filter(key => unlockedList.includes(key));

  /** [정렬] 선택된 무기를 목록의 최상단으로 올립니다. */
  const sortedUwKeys = useMemo(() => {
    if (!selectedUw) return availableUwKeys;
    const filtered = availableUwKeys.filter(key => key !== selectedUw);
    return [selectedUw, ...filtered];
  }, [availableUwKeys, selectedUw]);
  
  const labStats = (labConfig as any)[selectedUw]; 

  // 유효하지 않은 무기가 선택되어 있으면 첫 번째 무기로 자동 전환
  useEffect(() => {
    if (availableUwKeys.length > 0 && !availableUwKeys.includes(selectedUw)) {
      onSelectUw(availableUwKeys[0]);
    }
  }, [availableUwKeys, selectedUw, onSelectUw]);

  /** 무기 키를 번역된 표시 이름으로 변환합니다. */
  const getUwDisplayName = (uwKey: string) => {
    const localizedName = (T.data as any)?.UW_NAMES?.[uwKey];
    if (localizedName) return localizedName;
    return uwKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (availableUwKeys.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 animate-fade-in">
        <p className="text-lg font-bold mb-2">
          {category === 'base' ? 'No Ultimate Weapons unlocked.' : 'No weapons with UW+ unlocked.'}
        </p>
        <p className="text-sm">Please unlock weapons in the Unlock tab first.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* 1. 상단 무기 선택 탭 버튼 영역 (Sticky) */}
      <div className="mb-6 pb-2 scrollbar-hide sticky top-16 bg-slate-950/95 z-10 pt-2">
        {/* 모바일: 줄바꿈 적용 */}
        <div className="md:hidden flex flex-wrap gap-2">
          {availableUwKeys.map((uwKey) => (
            <button
              key={uwKey}
              onClick={() => onSelectUw(uwKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedUw === uwKey 
                  ? 'bg-slate-800 text-white border-green-500 shadow-sm' 
                  : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {getUwDisplayName(uwKey)}
            </button>
          ))}
        </div>
        {/* 데스크톱: 기존대로 스크롤 적용 */}
        <div className="hidden md:flex gap-2 overflow-x-auto">
          {availableUwKeys.map((uwKey) => (
            <button
              key={uwKey}
              onClick={() => onSelectUw(uwKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedUw === uwKey 
                  ? 'bg-slate-800 text-white border-green-500 shadow-sm' 
                  : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {getUwDisplayName(uwKey)}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 연구실(Lab) 옵션 영역 (Base Stats 카테고리 전용) */}
      {category === 'base' && labStats && (
          <div className={`mb-8 animate-fade-in ${
              selectedUw === 'golden_tower' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                : selectedUw === 'chrono_field'
                ? 'flex justify-center' 
                : 'grid grid-cols-1 gap-6' 
          }`}>
              {Object.entries(labStats).map(([labKey, labInfo]) => (
                  <div 
                      key={labKey} 
                      className={selectedUw === 'chrono_field' ? 'max-w-md w-full' : ''} 
                  >
                      <LabCard 
                          labKey={`${selectedUw}_${labKey}`} 
                          labInfo={labInfo}
                          progress={progress}
                          updateProgress={updateProgress}
                      />
                  </div>
              ))}
          </div>
      )}

      {/* 3. 스탯별 비용 테이블 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedUwKeys.map((uwKey) => {
           const uwDetail = (statsData as any)[uwKey];
           const isSelected = uwKey === selectedUw;
           
           return Object.entries(uwDetail).map(([statName, detail]: [string, any]) => {
            const key = `${category}_${uwKey}_${statName}`;
            const currentLevel = progress[key] || 0;

            let displayName = detail.name || statName;
            let displayDesc = detail.desc;

            // UW+의 경우 다국어 이름 및 설명 적용
            if (category === 'plus') {
              const localizedPlus = (T.data as any)?.UW_PLUS?.[uwKey]?.[statName];
              if (localizedPlus) {
                displayName = localizedPlus.name;
                displayDesc = localizedPlus.desc;
              }
            }
            
            // 현재 레벨 이후의 비용 데이터만 필터링
            const remainingCosts = detail.costs
              .map((cost: number, idx: number) => ({ 
                cost, 
                value: detail.values[idx], 
                level: idx + 1,
                displayLevel: idx === 0 ? 'Base' : idx
              }))
              .filter((item: any) => item.level > currentLevel);

            const maxTotalCost = remainingCosts.reduce((a: number, b: any) => a + b.cost, 0);

            return (
              <div 
                key={`${uwKey}-${statName}`} 
                className={`
                  ${styles.card} transition-all duration-500
                  ${isSelected 
                    ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)] scale-[1.02] z-10' 
                    : 'border-slate-800 opacity-80'
                  }
                `}
              >
                {/* 카드 헤더: 스탯 이름 및 현재 레벨 정보 */}
                <div className={`${styles.uwHeader} ${isSelected ? 'bg-slate-700' : 'bg-slate-800'}`}>
                  <div className="flex flex-col">
                     <span className={`text-[10px] font-normal mb-0.5 ${isSelected ? 'text-green-400' : 'text-slate-400'}`}>
                        {getUwDisplayName(uwKey)}
                     </span>
                     <span className={isSelected ? 'text-white' : ''}>
                        {displayName} <span className="text-slate-500 normal-case font-normal">({detail.unit || 'Level'})</span>
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold">Lv</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {currentLevel === 0 ? '0' : currentLevel - 1}
                        </span>
                        <span className="text-[10px] text-slate-600">/</span>
                        <span className="text-xs font-medium text-slate-400">
                          {detail.values.length - 1}
                        </span>
                    </div>

                    {currentLevel > 0 && (
                      <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(key, 0); }} />
                    )}
                  </div>
                </div>
                
                {displayDesc && <div className={styles.descBox}>{displayDesc}</div>}
                
                {/* 비용 상세 테이블 */}
                <div className={styles.tableContainer}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr><th className={styles.th}>Lv</th><th className={styles.th}>Value</th><th className={styles.th}>Cost</th><th className={styles.th}>Cumul.</th></tr>
                    </thead>
                    <tbody>
                      {remainingCosts.map((item: any, idx: number) => {
                        const cumulative = remainingCosts.slice(0, idx + 1).reduce((a: number, b: any) => a + b.cost, 0);
                        return (
                          <tr 
                            key={item.level} 
                            className={styles.tr}
                            onClick={() => updateProgress(key, item.level)}
                          >
                            <td className={styles.td}>
                              {item.displayLevel === 'Base' ? <span className="text-slate-500 font-bold">Base</span> : item.displayLevel}
                            </td>
                            <td className={`${styles.td} text-cyan-400`}>{item.value}</td>
                            <td className={`${styles.td} text-yellow-400`}>{item.cost > 0 ? formatNum(item.cost) : '-'}</td>
                            <td className={`${styles.td} text-slate-500`}>{cumulative > 0 ? formatNum(cumulative) : '-'}</td>
                          </tr>
                        );
                      })}
                      {remainingCosts.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Maxed Out! 🎉</td></tr>
                      )}
                    </tbody>
                    {remainingCosts.length > 0 && (
                      <tfoot>
                        <tr>
                          <td className={styles.tfootTd} colSpan={2}>Total Left</td>
                          <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(maxTotalCost)}</td>
                          <td className={styles.tfootTd}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}