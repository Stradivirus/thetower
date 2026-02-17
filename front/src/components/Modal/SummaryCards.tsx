/**
 * 파일명: thetower/front/src/components/Modal/SummaryCards.tsx
 * 용도: 요약 모달 내에서 마스터리 완료된 카드 목록 표시
 * 기능: 진행도 데이터에서 완료된 카드 필터링 및 배지 형태로 시각화
 */
import { RectangleVertical } from 'lucide-react'; 
import cardCosts from '../../data/card_mastery_costs.json';
import { T } from '../../locales'; 

interface Props {
  progress: Record<string, any>; // 사용자의 게임 진행도 데이터
}

export function SummaryCards({ progress }: Props) {
  // 마스터리 비용 데이터와 대조하여 완료된(값이 1인) 카드만 필터링
  const completedCards = cardCosts.filter(c => progress[`card_${c.name}`] === 1);

  // 완료된 카드가 없으면 컴포넌트를 렌더링하지 않음
  if (completedCards.length === 0) return null;

  return (
    <div className="flex-shrink-0">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <RectangleVertical size={18} className="text-purple-400" />
        <h3 className="text-base font-bold text-white">
          {T.summary.CARDS.TITLE} <span className="text-sm text-slate-500">({completedCards.length})</span>
        </h3>
      </div>

      {/* 카드 리스트: 배지 형태의 가로 나열 레이아웃 */}
      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 flex flex-wrap gap-2">
        {completedCards.map((card) => (
          <div key={card.name} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-medium shadow-sm">
            {card.name}
          </div>
        ))}
      </div>
    </div>
  );
}