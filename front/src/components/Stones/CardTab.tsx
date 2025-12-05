import { Check } from 'lucide-react';
import cardCosts from '../../data/card_mastery_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
  resetCards: () => void; 
}

export default function CardTab({ progress, updateProgress, resetCards }: Props) {
  // 데이터 분리: 완료된 카드 vs 남은 카드
  const completedCards = cardCosts.filter(c => progress[`card_${c.name}`] === 1);
  const remainingCards = cardCosts.filter(c => progress[`card_${c.name}`] !== 1);

  return (
    <div className="animate-fade-in">
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>Card Mastery Costs</span>
          {completedCards.length > 0 && (
             <ResetButton onClick={(e) => { e.stopPropagation(); resetCards(); }} />
          )}
        </div>

        {/* [Updated] 마스터한 카드 목록 (아이콘 제거됨) */}
        {completedCards.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Check size={14} className="text-green-500" />
              Mastered Collection <span className="text-slate-600">({completedCards.length})</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {completedCards.map((card) => (
                <button
                  key={card.name}
                  onClick={() => updateProgress(`card_${card.name}`, 0)}
                  // [수정] flex, gap 제거하고 텍스트만 표시
                  className="px-3 py-1.5 bg-green-500/5 border border-green-500/20 text-green-400 rounded-full text-xs font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                  title="Click to un-master (Restore to list)"
                >
                  {card.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 남은 카드 목록 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr>
                <th className={styles.th}>Card Name</th>
                <th className={styles.th}>Stone Cost</th>
                <th className={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {remainingCards.length > 0 ? (
                remainingCards.map((card, idx) => (
                  <tr 
                    key={idx} 
                    className={styles.tr}
                    onClick={() => updateProgress(`card_${card.name}`, 1)}
                    title="Click to mark as Mastered"
                  >
                    <td className={`${styles.td} font-bold text-white`}>{card.name}</td>
                    <td className={`${styles.td} text-yellow-400`}>{formatNum(card.cost)}</td>
                    <td className={`${styles.td} text-slate-200 whitespace-normal min-w-[300px] leading-relaxed`}>
                      {card.desc}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <span className="font-bold text-slate-300">All Cards Mastered!</span>
                    <span className="text-xs">모든 카드를 마스터했습니다.</span>
                  </div>
                </td></tr>
              )}
            </tbody>
            {/* 남은 비용 합계 */}
            {remainingCards.length > 0 && (
              <tfoot>
                <tr>
                  <td className={styles.tfootTd}>Total Remaining</td>
                  <td className={`${styles.tfootTd} text-yellow-400`}>
                    {formatNum(remainingCards.reduce((acc, cur) => acc + cur.cost, 0))}
                  </td>
                  <td className={styles.tfootTd}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}