import { Activity, Trophy, Coins, Zap } from 'lucide-react';
import { formatNumber } from '../../utils/format';
import { T } from '../../locales';

interface Props {
  main: {
    coin_earned: number;
    coins_per_hour: number;
    cells_earned: number;
    best_coins_per_minute?: number;
  };
  v2_main?: {
    cells_per_hour?: number;
    max_golden_combo?: number;
  } | null;
}

export default function HighlightDashboard({ main, v2_main }: Props) {
  const Text = T.detail;
  if (!v2_main) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* 1. 코인 획득 (단독) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between group hover:border-slate-700 transition-colors h-16">
        <div className="flex items-center gap-2 text-amber-500 opacity-90">
          <Coins size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{Text.DASH_TOTAL_COINS}</span>
        </div>
        <div className="text-xl font-mono font-bold text-white tracking-tight">{formatNumber(main.coin_earned)}</div>
      </div>

      {/* 2. 코인 효율 (2행) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col justify-center gap-1 group hover:border-slate-700 transition-colors h-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-400 opacity-90">
            <Zap size={16} />
            <span className="text-[11px] font-black uppercase tracking-widest">{Text.DASH_EFFICIENCY}</span>
          </div>
          <div className="text-base font-mono font-bold text-white">{formatNumber(main.coins_per_hour)}<span className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-bold uppercase pl-5">{Text.DASH_PEAK_CPM}</span>
          <div className="text-base font-mono font-bold text-slate-300">{formatNumber(main.best_coins_per_minute || 0)}<span className="text-[10px] text-slate-500 font-normal ml-0.5">/m</span></div>
        </div>
      </div>

      {/* 3. 세포 성과 (2행) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col justify-center gap-1 group hover:border-slate-700 transition-colors h-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-400 opacity-90">
            <Activity size={16} />
            <span className="text-[11px] font-black uppercase tracking-widest">{Text.DASH_CELL_HARVEST}</span>
          </div>
          <div className="text-base font-mono font-bold text-white">{formatNumber(main.cells_earned)}</div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-bold uppercase pl-5">{Text.DASH_HOURLY_RATE}</span>
          <div className="text-base font-mono font-bold text-slate-300">{formatNumber(v2_main.cells_per_hour || 0)}<span className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></div>
        </div>
      </div>

      {/* 4. 골든 콤보 (단독) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between group hover:border-slate-700 transition-colors h-16">
        <div className="flex items-center gap-2 text-yellow-500 opacity-90">
          <Trophy size={18} />
          <span className="text-xs font-black uppercase tracking-widest">{Text.DASH_GOLDEN_COMBO}</span>
        </div>
        <div className="text-xl font-mono font-bold text-white tracking-tight">{v2_main.max_golden_combo || 0} <span className="text-[10px] text-slate-500 font-normal ml-0.5">Hits</span></div>
      </div>
    </div>
  );
}
