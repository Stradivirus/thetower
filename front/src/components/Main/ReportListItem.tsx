import React from 'react';
import { Zap, Layers, Skull } from 'lucide-react';
// [수정 1] 경로 수정: components/Main에서 types까지는 두 단계 위입니다.
import type { BattleMain, DamageItem } from '../../types/report'; 
import { formatNumber, formatTimeOnly, parseDurationToHours } from '../../utils/format';

interface Props {
  report: BattleMain;
  onSelectReport: (date: string) => void;
}

// React.memo를 사용하여 props(report)가 변경되지 않는 한 리렌더링을 방지합니다.
const ReportListItem = React.memo<Props>(({ report, onSelectReport }) => {
  const durationHours = parseDurationToHours(report.real_time);
  const cellsPerHour = durationHours > 0 ? report.cells_earned / durationHours : 0;

  const utilityKeywords = ['오브', '블랙홀'];
  const mainDamages = (report.top_damages || [])
    // [수정 2] filter 파라미터 'd'에 DamageItem 타입을 명시합니다.
    .filter((d: DamageItem) => !utilityKeywords.includes(d.name)) 
    .slice(0, 3);

  return (
    <div 
      onClick={() => onSelectReport(report.battle_date)}
      className="group bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid grid-cols-1 md:grid-cols-12 gap-2 items-center mb-2"
    >
      {/* 1. Time & Wave (2칸) */}
      <div className="md:col-span-2 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
           <span className="text-white font-bold text-sm">{report.real_time}</span>
           <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 leading-none">T{report.tier}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
           <span className="text-slate-500 text-xs">{formatTimeOnly(report.battle_date)}</span>
           <span className="text-slate-600 text-[10px]">・</span>
           <span className="text-slate-400 text-xs">W {report.wave}</span>
        </div>
      </div>

      {/* 2. Coins (2칸) */}
      <div className="md:col-span-2 text-center">
        <div className="text-yellow-400 font-bold font-mono text-lg truncate">{formatNumber(report.coin_earned)}</div>
      </div>

      {/* 3. Coin/h (1칸) */}
      <div className="md:col-span-1 text-center">
          <div className="text-slate-300 font-mono font-medium text-sm truncate">{formatNumber(report.coins_per_hour)}/h</div>
      </div>

      {/* 4. Cell/h (1칸) */}
      <div className="md:col-span-1 text-center">
          <div className="text-cyan-300 font-mono font-bold text-sm truncate">
            {formatNumber(Math.round(cellsPerHour))}/h
          </div>
      </div>

      {/* 5. Resources (1칸) */}
      <div className="md:col-span-1 flex flex-col items-center gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1.5" title="Cells">
           <span className="text-cyan-400 font-mono font-medium text-xs truncate">{formatNumber(report.cells_earned)}</span>
           <Zap size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
        <div className="flex items-center gap-1.5" title="Reroll Shards">
           <span className="text-green-400 font-mono font-medium text-xs truncate">{formatNumber(report.reroll_shards_earned)}</span>
           <Layers size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
      </div>

      {/* 6. Damage & Killer (3칸) */}
      <div className="md:col-span-3 flex flex-col justify-center border-l border-slate-800/50 pl-4 h-full py-0.5 min-w-0">
        {mainDamages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-1.5">
            {/* [수정 3 & 4] map 파라미터 'dmg'와 'idx'에 각각 타입(DamageItem, number)을 명시합니다. */}
            {mainDamages.map((dmg: DamageItem, idx: number) => (
              <div key={idx} className="flex flex-col items-start min-w-0">
                <span className={`text-[11px] font-bold truncate w-full ${idx === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {idx + 1}. {dmg.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 mb-1.5">No Data</div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
           <Skull size={10} className="text-slate-500" />
           <span className="text-slate-500 text-[10px]">Killed by</span>
           <span className="text-rose-300 font-bold text-[11px] truncate max-w-[120px]">{report.killer}</span>
        </div>
      </div>

      {/* 7. Memo (2칸) */}
      <div className="md:col-span-2 flex justify-center items-center px-2">
          {report.notes ? (
            <div className="bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded text-[10px] text-blue-300 truncate w-full text-center cursor-help transition-colors hover:bg-blue-500/20" title={report.notes}>
              {report.notes}
            </div>
          ) : (
            <span className="text-slate-800 text-xs">-</span>
          )}
      </div>
    </div>
  );
});

ReportListItem.displayName = 'ReportListItem';

export default ReportListItem;