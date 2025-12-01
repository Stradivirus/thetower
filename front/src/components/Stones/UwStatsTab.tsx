import { useEffect } from 'react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  category: 'base' | 'plus';
  progress: Record<string, any>; // [수정] number -> any
  updateProgress: (key: string, level: number) => void;
  selectedUw: string;
  onSelectUw: (uw: string) => void;
}

export default function UwStatsTab({ category, progress, updateProgress, selectedUw, onSelectUw }: Props) {
  const statsData = category === 'base' ? baseStats : plusStats;

  // [New] 현재 카테고리에서 해금된 무기 목록 필터링
  // Base 탭이면 unlocked_weapons 목록을, Plus 탭이면 unlocked_plus_weapons 목록을 사용
  const unlockedList: string[] = category === 'base' 
    ? (progress['unlocked_weapons'] || []) 
    : (progress['unlocked_plus_weapons'] || []);

  // 표시할 무기 키 목록 (해금된 것만 + 데이터에 있는 것만)
  const availableUwKeys = Object.keys(statsData).filter(key => unlockedList.includes(key));

  useEffect(() => {
    // 1. 해금된 무기가 하나도 없으면 선택 해제 (또는 빈 상태)
    if (availableUwKeys.length === 0) {
      // 특별히 할 건 없음, 렌더링에서 처리
    } 
    // 2. 현재 선택된 무기가 해금 목록에 없으면(리셋 등으로 사라짐), 첫 번째 해금 무기로 변경
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

  // 선택된 무기를 맨 앞으로 정렬 (선택사항, 여기선 그냥 순서대로 보여줘도 됨)
  // const sortedUwKeys = [
  //   selectedUw,
  //   ...availableUwKeys.filter(key => key !== selectedUw)
  // ].filter(key => availableUwKeys.includes(key)); // 안전장치
  
  // 그냥 목록 순서대로 보여주는 게 UI상 덜 헷갈릴 수 있음
  const sortedUwKeys = availableUwKeys;

  return (
    <div className="animate-fade-in">
      {/* 서브 탭 (무기 선택 버튼) - 해금된 것만 표시 */}
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

      {/* 선택된 무기의 스탯 테이블만 보여줌 (또는 전체를 보여주되 선택된 걸 강조) */}
      {/* 기존 로직 유지: 그리드로 보여주되, 선택된 게 맨 앞에 오도록? 
          아니면 탭 방식이니 선택된 무기 하나만 보여주는 게 깔끔할 수도 있음.
          하지만 기존 코드가 그리드 방식이었으므로, 그리드 방식을 유지하되 필터링된 목록만 보여줌.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 선택된 무기 데이터를 렌더링 */}
        {(() => {
           // 선택된 무기가 목록에 없으면 아무것도 안 그림
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