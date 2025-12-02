import { useEffect } from 'react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import labConfig from '../../data/uw_lab_config.json'; 
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react'; 

interface Props {
  category: 'base' | 'plus';
  progress: Record<string, any>; 
  updateProgress: (key: string, level: number) => void;
  selectedUw: string;
  onSelectUw: (uw: string) => void;
}

// [수정] 연구 항목을 렌더링하는 컴포넌트: 한 줄로 간결하게 변경
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
  const shortName = labInfo.name.split(' ')[1] || labInfo.name; // 'GT 지속시간 연구' -> '지속시간'
  const hoverText = labInfo.desc;

  return (
    // [수정] 한 줄 카드 디자인 적용
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

  const availableUwKeys = Object.keys(statsData).filter(key => unlockedList.includes(key));
  
  const labStats = (labConfig as any)[selectedUw]; 

  useEffect(() => {
    if (availableUwKeys.length === 0) {
      // Pass
    } 
    else if (!availableUwKeys.includes(selectedUw)) {
      onSelectUw(availableUwKeys[0]);
    }
  }, [availableUwKeys, selectedUw, onSelectUw]);

  const formatUwName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (availableUwKeys.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 animate-fade-in">
        <p className="text-lg font-bold mb-2">
          {category === 'base' ? '해금된 궁극 무기가 없습니다.' : 'UW+가 해금된 무기가 없습니다.'}
        </p>
        <p className="text-sm">Unlock 탭에서 먼저 무기를 해금해주세요.</p>
      </div>
    );
  }

  const sortedUwKeys = availableUwKeys;

  return (
    <div className="animate-fade-in">
      {/* 서브 탭 (무기 선택 버튼) */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide sticky top-16 bg-slate-950/95 z-10 pt-2">
        <div className="flex gap-2">
          {sortedUwKeys.map((uwKey) => (
            <button
              key={uwKey}
              onClick={() => onSelectUw(uwKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedUw === uwKey 
                  ? 'bg-slate-800 text-white border-green-500 shadow-sm' 
                  : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {formatUwName(uwKey)}
            </button>
          ))}
        </div>
      </div>

      {/* [수정] 연구 카드 섹션 (레이아웃 조정 유지) */}
      {category === 'base' && labStats && (
          <div className={`mb-8 animate-fade-in ${
              selectedUw === 'golden_tower' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' // GT: 2열 배치
                : selectedUw === 'chrono_field'
                ? 'flex justify-center' // CF: 중앙 배치
                : 'grid grid-cols-1 gap-6' // 기타: 1열 배치
          }`}>
              {Object.entries(labStats).map(([labKey, labInfo]) => (
                  <div 
                      key={labKey} 
                      // CF일 경우 중앙 배치를 위해 최대 너비 제한
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

      {/* 기존 스탯 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(() => {
           if (!availableUwKeys.includes(selectedUw)) return null;
           
           const uwDetail = (statsData as any)[selectedUw];
           
           return Object.entries(uwDetail).map(([statName, detail]: [string, any]) => {
            const key = `${category}_${selectedUw}_${statName}`;
            const currentLevel = progress[key] || 0;
            
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
              <div key={statName} className={`${styles.card} border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]`}>
                <div className={`${styles.uwHeader} bg-slate-800`}>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-normal mb-0.5">{formatUwName(selectedUw)}</span>
                     <span>{detail.name || statName} <span className="text-slate-500 normal-case font-normal">({detail.unit || 'Level'})</span></span>
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
                
                {detail.desc && <div className={styles.descBox}>{detail.desc}</div>}
                
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
        })()}
      </div>
    </div>
  );
}