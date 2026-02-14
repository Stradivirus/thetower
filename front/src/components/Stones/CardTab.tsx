import { Check } from 'lucide-react';
import cardCosts from '../../data/card_mastery_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';
import { T } from '../../locales';

// JSON 데이터의 현재 구조 정의 (desc 제거됨)
interface CardItem {
  name: string;
  cost: number;
}

interface Props {
  progress: Record<string, number>;
  updateProgress: (key: string, level: number) => void;
  resetCards: () => void; 
}

export default function CardTab({ progress, updateProgress, resetCards }: Props) {
  // 타입을 CardItem[]로 지정하여 빌드 에러 해결
  const cards = cardCosts as CardItem[];
  
  // 언어팩 데이터 참조 (안전하게 빈 객체 폴백)
  const cardTranslations = T.data?.CARDS || {};

  const completedCards = cards.filter(c => progress[`card_${c.name}`] === 1);
  const remainingCards = cards.filter(c => progress[`card_${c.name}`] !== 1);

  return (
    <div className="animate-fade-in">
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>Card Mastery Costs</span>
          {completedCards.length > 0 && (
             <ResetButton onClick={(e) => { e.stopPropagation(); resetCards(); }} />
          )}
        </div>

        {completedCards.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Check size={14} className="text-green-500" />
              Mastered Collection <span className="text-slate-600">({completedCards.length})</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {completedCards.map((card) => {
                // 언어팩에서 번역된 이름 가져오기
                const cardInfo = (cardTranslations as any)[card.name];
                return (
                  <button
                    key={card.name}
                    onClick={() => updateProgress(`card_${card.name}`, 0)}
                    className="px-3 py-1.5 bg-green-500/5 border border-green-500/20 text-green-400 rounded-full text-xs font-medium hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                  >
                    {cardInfo?.name || card.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                remainingCards.map((card, idx) => {
                  // 언어팩에서 번역 데이터 찾기
                  const cardInfo = (cardTranslations as any)[card.name];
                  return (
                    <tr 
                      key={idx} 
                      className={styles.tr}
                      onClick={() => updateProgress(`card_${card.name}`, 1)}
                    >
                      <td className={`${styles.td} font-bold text-white`}>
                        {cardInfo?.name || card.name}
                      </td>
                      <td className={`${styles.td} text-yellow-400`}>{formatNum(card.cost)}</td>
                      <td className={`${styles.td} text-slate-200 whitespace-normal min-w-[300px] leading-relaxed`}>
                        {/* [Fix] JSON에 없는 card.desc 참조를 제거하고 언어팩 데이터만 사용 */}
                        {cardInfo?.desc || "No Description available"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <span className="font-bold text-slate-300">All Cards Mastered!</span>
                  </div>
                </td></tr>
              )}
            </tbody>
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