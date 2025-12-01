import cardCosts from '../../data/card_mastery_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
  resetCards: () => void; 
}

export default function CardTab({ progress, updateProgress, resetCards }: Props) {
  return (
    <div className="animate-fade-in">
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>Card Mastery Costs</span>
          {Object.keys(progress).some(k => k.startsWith('card_')) && (
             <ResetButton onClick={(e) => { e.stopPropagation(); resetCards(); }} />
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr>
                <th className={styles.th}>Card Name</th>
                <th className={styles.th}>Mastery Cost (Gems)</th>
                <th className={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {cardCosts.map((card, idx) => {
                const isCompleted = progress[`card_${card.name}`] === 1;
                if (isCompleted) return null;
                return (
                  <tr 
                    key={idx} 
                    className={styles.tr}
                    onClick={() => updateProgress(`card_${card.name}`, 1)}
                    title="Click to mark as Mastered"
                  >
                    <td className={`${styles.td} font-bold text-white`}>{card.name}</td>
                    <td className={`${styles.td} text-yellow-400`}>{formatNum(card.cost)}</td>
                    {/* [Updated] 글자색 밝게(slate-200) + 줄간격 추가 */}
                    <td className={`${styles.td} text-slate-200 whitespace-normal min-w-[300px] leading-relaxed`}>
                      {card.desc}
                    </td>
                  </tr>
                );
              })}
              {cardCosts.every(c => progress[`card_${c.name}`] === 1) && (
                 <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">All Cards Mastered! 🎉</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className={styles.tfootTd}>Total Remaining</td>
                <td className={`${styles.tfootTd} text-yellow-400`}>
                  {formatNum(cardCosts.filter(c => !progress[`card_${c.name}`]).reduce((acc, cur) => acc + cur.cost, 0))}
                </td>
                <td className={styles.tfootTd}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}