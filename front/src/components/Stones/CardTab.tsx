/**
 * 파일명: thetower/front/src/components/Stones/CardTab.tsx
 * 용도: 스톤 계산기 페이지의 'Cards' 탭 컨텐츠
 * 기능: 마스터리 완료된 카드 관리, 미완료 카드 목록 및 해금 비용 표시, 다국어 카드 이름 및 설명 지원
 */
import { Check } from 'lucide-react';
import cardCosts from '../../data/card_mastery_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';
import { T } from '../../locales';

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
  const cards = cardCosts as CardItem[];
  
  // 언어팩 데이터 로드
  const cardTranslations = T.data?.CARDS || {};

  // 진행도 데이터를 기반으로 완료/미완료 카드 필터링
  const completedCards = cards.filter(c => progress[`card_${c.name}`] === 1);
  const remainingCards = cards.filter(c => progress[`card_${c.name}`] !== 1);

  return (
    <div className="animate-fade-in">
      <div className={styles.card}>
        {/* 섹션 헤더 */}
        <div className={styles.uwHeader}>
          <span>Card Mastery Costs</span>
          {completedCards.length > 0 && (
             <ResetButton onClick={(e) => { e.stopPropagation(); resetCards(); }} />
          )}
        </div>

        {/* 1. 완료된 카드 리스트 (배지 형태) */}
        {completedCards.length > 0 && (
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Check size={14} className="text-green-500" />
              Mastered Collection <span className="text-slate-600">({completedCards.length})</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {completedCards.map((card) => {
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

        {/* 2. 미완료 카드 테이블 */}
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
                        {cardInfo?.desc || "No Description available"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* 모든 카드 완료 시 메시지 */
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <span className="font-bold text-slate-300">All Cards Mastered!</span>
                  </div>
                </td></tr>
              )}
            </tbody>
            {/* 하단 요약: 남은 총 비용 */}
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