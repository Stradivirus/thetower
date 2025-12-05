import { stoneStyles as styles, formatNum, ResetButton } from '../StoneShared';

interface Props {
  title: string;
  type: 'base' | 'plus';
  costs: number[];
  unlockedCount: number;
  onRowClick: (type: 'base' | 'plus', count: number, totalCost: number) => void;
  onReset: (type: 'base' | 'plus') => void;
}

export default function UwCostTable({ title, type, costs, unlockedCount, onRowClick, onReset }: Props) {
  // 남은 해금 단계 계산
  const remainingData = costs
    .map((cost, idx) => ({ cost, level: idx + 1 }))
    .filter(item => item.level > unlockedCount);
    
  const totalRemaining = remainingData.reduce((acc, cur) => acc + cur.cost, 0);

  return (
    <div className={styles.card}>
      <div className={styles.uwHeader}>
        <span>{title}</span>
        {unlockedCount > 0 && (
          <ResetButton onClick={(e) => { e.stopPropagation(); onReset(type); }} />
        )}
      </div>
      <table className="w-full text-xs text-left">
        <thead>
          <tr>
            <th className={styles.th}>Order</th>
            <th className={styles.th}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {remainingData.map((item, index) => {
            const batchItems = remainingData.slice(0, index + 1);
            const batchCost = batchItems.reduce((sum, i) => sum + i.cost, 0);
            const batchCount = batchItems.length;
            const isNext = index === 0; // 바로 다음 해금 순서인지

            return (
              <tr 
                key={item.level} 
                onClick={() => onRowClick(type, batchCount, batchCost)} 
                className="transition-all border-b border-slate-800/50 hover:bg-blue-500/10 cursor-pointer group"
              >
                <td className={styles.td}>
                  {item.level}번째
                  {isNext ? (
                    <span className="ml-2 text-[10px] text-blue-400 font-bold animate-pulse">Next</span>
                  ) : (
                    <span className="ml-2 text-[10px] text-slate-500 group-hover:text-blue-300 font-medium">(+{batchCount})</span>
                  )}
                </td>
                <td className={`${styles.td} ${isNext ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                  {formatNum(item.cost)}
                </td>
              </tr>
            );
          })}
          {remainingData.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                All Unlocked! 🎉
              </td>
            </tr>
          )}
        </tbody>
        {remainingData.length > 0 && (
          <tfoot>
            <tr>
              <td className={styles.tfootTd}>Remaining Total</td>
              <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalRemaining)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}