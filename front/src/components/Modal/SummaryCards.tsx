import { Layers } from 'lucide-react';
import cardCosts from '../../data/card_mastery_costs.json';

interface Props {
  progress: Record<string, any>;
}

export function SummaryCards({ progress }: Props) {
  const completedCards = cardCosts.filter(c => progress[`card_${c.name}`] === 1);

  if (completedCards.length === 0) return null;

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={18} className="text-purple-400" />
        <h3 className="text-base font-bold text-white">
          Mastered Cards <span className="text-sm text-slate-500">({completedCards.length})</span>
        </h3>
      </div>
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