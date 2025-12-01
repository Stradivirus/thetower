import moduleCosts from '../../data/module_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
}

export default function ModuleTab({ progress, updateProgress }: Props) {
  return (
    // [Updated] 카드가 하나뿐이므로 grid 관련 클래스 제거 또는 단순화
    <div className="max-w-2xl animate-fade-in">
      {/* Common Efficiency */}
      {(() => {
         const key = "module_common";
         const currentLevel = progress[key] || 0;
         const remainingLevels = moduleCosts.common_efficiency.levels
           .map((lv, idx) => ({ ...lv, displayLevel: idx === 0 ? 'Base' : idx }))
           .filter(lv => lv.level > currentLevel);

         const totalCost = remainingLevels.reduce((acc, cur) => acc + cur.cost, 0);

         return (
          <div className={styles.card}>
            <div className={styles.uwHeader}>
              <span>Common Efficiency</span>
              {currentLevel > 0 && (
                <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(key, 0); }} />
              )}
            </div>
            <div className={styles.descBox}>{moduleCosts.common_efficiency.desc}</div>
            <div className={styles.tableContainer}>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th className={styles.th}>Level</th>
                    <th className={styles.th}>Value</th>
                    <th className={styles.th}>Cost</th>
                    <th className={styles.th}>Cumul.</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingLevels.map((lv, idx) => {
                     const cumulative = remainingLevels.slice(0, idx + 1).reduce((a, b) => a + b.cost, 0);
                     return (
                      <tr key={lv.level} className={styles.tr} onClick={() => updateProgress(key, lv.level)}>
                        <td className={styles.td}>
                          {lv.displayLevel === 'Base' ? <span className="text-slate-500 font-bold">Base</span> : lv.displayLevel}
                        </td>
                        <td className={`${styles.td} text-cyan-400`}>{lv.value}</td>
                        <td className={`${styles.td} text-yellow-400`}>{lv.cost > 0 ? formatNum(lv.cost) : '-'}</td>
                        <td className={`${styles.td} text-slate-500`}>{cumulative > 0 ? formatNum(cumulative) : '-'}</td>
                      </tr>
                     );
                  })}
                </tbody>
                {remainingLevels.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className={styles.tfootTd} colSpan={2}>Total Left</td>
                      <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalCost)}</td>
                      <td className={styles.tfootTd}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
         );
      })()}
    </div>
  );
}