import { useState, useEffect } from 'react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  category: 'base' | 'plus';
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
}

export default function UwStatsTab({ category, progress, updateProgress }: Props) {
  const [selectedUw, setSelectedUw] = useState<string>('death_wave');
  const statsData = category === 'base' ? baseStats : plusStats;

  useEffect(() => {
    if (!Object.keys(statsData).includes(selectedUw)) {
      setSelectedUw(Object.keys(statsData)[0]);
    }
  }, [category, statsData, selectedUw]);

  const formatUwName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const sortedUwKeys = [
    selectedUw,
    ...Object.keys(statsData).filter(key => key !== selectedUw)
  ];

  return (
    <div className="animate-fade-in">
      {/* 서브 탭 (무기 선택 버튼) */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide sticky top-16 bg-slate-950/95 z-10 pt-2">
        <div className="flex gap-2">
          {Object.keys(statsData).map((uwKey) => (
            <button
              key={uwKey}
              onClick={() => setSelectedUw(uwKey)}
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

      {/* 스탯 테이블 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedUwKeys.map((uwKey) => {
          const uwDetail = (statsData as any)[uwKey];
          const isSelected = uwKey === selectedUw;

          return Object.entries(uwDetail).map(([statName, detail]: [string, any]) => {
            const key = `${category}_${uwKey}_${statName}`;
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
              <div 
                key={statName} 
                className={`${styles.card} ${isSelected ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] order-first' : 'border-slate-800 opacity-80 hover:opacity-100 transition-opacity'}`}
              >
                <div className={`${styles.uwHeader} ${isSelected ? 'bg-slate-800' : 'bg-slate-900'}`}>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-400 font-normal mb-0.5">{formatUwName(uwKey)}</span>
                     <span>{detail.name || statName} <span className="text-slate-500 normal-case font-normal">({detail.unit || 'Level'})</span></span>
                  </div>
                  
                  {/* [Updated] 레벨 배지 디자인 개선 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                        {/* 'Lv' 라벨 */}
                        <span className="text-[10px] text-slate-500 font-bold">Lv</span>
                        
                        {/* 현재 레벨 (Cyan 강조) */}
                        <span className="text-sm font-bold text-cyan-400">
                          {currentLevel === 0 ? '0' : currentLevel - 1}
                        </span>
                        
                        {/* 구분선 */}
                        <span className="text-[10px] text-slate-600">/</span>
                        
                        {/* 최대 레벨 */}
                        <span className="text-xs font-medium text-slate-400">
                          {detail.values.length - 1}
                        </span>
                    </div>

                    {currentLevel > 0 && (
                      <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(key, 0); }} />
                    )}
                  </div>
                </div>
                
                {detail.desc && (
                    <div className={styles.descBox}>
                        {detail.desc}
                    </div>
                )}
                
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