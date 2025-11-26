// src/components/BattleSummary.tsx
import { Clock, Hourglass, Hash, Coins, Zap } from 'lucide-react';
import { formatNumber } from '../utils/format';
import type { BattleMain } from '../types/report';

interface Props {
  main: BattleMain;
}

export default function BattleSummary({ main }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      <h2 className="text-xl font-bold text-white mb-6">전투 요약</h2>
      
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-500 text-xs flex items-center gap-1 mb-1"><Clock size={14}/> 게임 시간</span>
            <span className="text-white font-mono text-lg">{main.game_time}</span>
          </div>
          <div>
            <span className="text-slate-500 text-xs flex items-center gap-1 mb-1"><Hourglass size={14}/> 실시간</span>
            <span className="text-slate-300 font-mono text-lg">{main.real_time}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
           <div>
              <span className="text-slate-500 text-xs flex items-center gap-1 mb-1"><Hash size={14}/> 웨이브</span>
              <span className="text-white font-bold font-mono text-2xl">{main.wave}</span>
           </div>
           <div className="text-right">
              <span className="text-slate-500 text-xs mb-1 block">처치자</span>
              <span className="text-rose-400 font-medium">{main.killer}</span>
           </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-2 text-sm"><Coins size={16}/> 코인 획득</span>
            <span className="text-yellow-400 font-bold font-mono text-lg">{formatNumber(main.coin_earned)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-2 text-sm"><Zap size={16}/> 셀 획득</span>
            <span className="text-cyan-400 font-bold font-mono text-lg">{main.cells_earned.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {main.notes && (
        <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-500 mb-1">메모</div>
          <div className="text-slate-300 text-sm">{main.notes}</div>
        </div>
      )}
    </div>
  );
}