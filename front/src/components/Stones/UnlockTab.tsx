import unlockCosts from '../../data/uw_unlock_costs.json';
import moduleCosts from '../../data/module_costs.json'; // [New] 모듈 데이터 임포트
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
}

export default function UnlockTab({ progress, updateProgress }: Props) {
  
  const renderTable = (title: string, data: number[], keyPrefix: string) => {
    const currentLevel = progress[keyPrefix] || 0;
    const remainingData = data.map((cost, idx) => ({ cost, level: idx + 1 })).filter(item => item.level > currentLevel);
    const totalRemaining = remainingData.reduce((acc, cur) => acc + cur.cost, 0);

    return (
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>{title}</span>
          {currentLevel > 0 && (
            <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(keyPrefix, 0); }} />
          )}
        </div>
        <table className="w-full text-xs text-left">
          <thead>
            {/* [Updated] Total 컬럼 삭제 -> 2열 구성 */}
            <tr>
              <th className={styles.th}>Order</th>
              <th className={styles.th}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {remainingData.map((item) => (
              <tr 
                key={item.level} 
                className={styles.tr}
                onClick={() => updateProgress(keyPrefix, item.level)}
                title={`Click to complete up to ${item.level}`}
              >
                <td className={styles.td}>{item.level}번째</td>
                <td className={`${styles.td} text-green-400 font-bold`}>{formatNum(item.cost)}</td>
              </tr>
            ))}
            {remainingData.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">All Completed! 🎉</td></tr>
            )}
          </tbody>
          {remainingData.length > 0 && (
            <tfoot>
              <tr>
                {/* [Updated] 2열에 맞게 colSpan 제거 또는 조정 */}
                <td className={styles.tfootTd}>Remaining Total</td>
                <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalRemaining)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  };

  return (
    // [Updated] 카드가 3개가 되므로 lg 화면에서 3열로 보이게 설정 (lg:grid-cols-3)
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* 1. Ultimate Weapon Unlock */}
      {renderTable("Ultimate Weapon Unlock", unlockCosts.unlock_costs, "uw_unlock")}
      
      {/* 2. UW+ Unlock */}
      {renderTable("UW+ Unlock", unlockCosts.plus_unlock_costs, "uw_plus_unlock")}

      {/* 3. [Moved] Unique Effect Reroll Costs (from ModuleTab) */}
      <div className={styles.card + " h-fit"}>
        <div className={styles.uwHeader}>Unique Effect Reroll</div>
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              <th className={styles.th}>Rarity</th>
              <th className={styles.th}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {moduleCosts.unique_effect.map((effect, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50">
                <td className={`${styles.td} font-bold`}>
                  <span className={
                    effect.rarity === 'Ancestral' ? 'text-green-400' : 
                    effect.rarity === 'Mythic' ? 'text-red-400' :
                    effect.rarity === 'Legendary' ? 'text-yellow-400' : 'text-purple-400'
                  }>
                    {effect.rarity}
                  </span>
                </td>
                <td className={`${styles.td} text-green-400`}>{formatNum(effect.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}