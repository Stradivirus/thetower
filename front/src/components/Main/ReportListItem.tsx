import React from 'react';
import { Zap, RefreshCw, Skull, Layers, Coins } from 'lucide-react';
import type { BattleMain, DamageItem } from '../../types/report'; 
import { formatNumber, formatTimeOnly, parseDurationToHours } from '../../utils/format';

interface Props {
  report: BattleMain;
  onSelectReport: (date: string) => void;
  hideHeader?: boolean;
}

const ReportListItem = React.memo<Props>(({ report, onSelectReport }) => {
  // 공통 로직
  const durationHours = parseDurationToHours(report.real_time);
  const cellsPerHour = durationHours > 0 ? report.cells_earned / durationHours : 0;

  const utilityKeywords = ['오브', '블랙홀', '데스 페널티', '안티 큐브'];
  const mainDamages = (report.top_damages || [])
    .filter((d: DamageItem) => !utilityKeywords.includes(d.name)) 
    .slice(0, 3);

  // --------------------------------------------------------------------------
  // 1. [Mobile View] 모바일용 카드 디자인
  // --------------------------------------------------------------------------
  const MobileView = () => (
    <div 
      onClick={() => onSelectReport(report.battle_date)}
      className="group relative bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-800/60 p-4 rounded-xl cursor-pointer transition-all mb-3 shadow-sm md:hidden block"
    >
      {/* 1행: 날짜/시간 & 웨이브 */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-mono">{formatTimeOnly(report.battle_date)}</span>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">{report.real_time}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold">T{report.tier}</span>
            <span className="text-slate-300 text-sm font-bold">Wave {report.wave}</span>
        </div>
      </div>

      {/* 2행: 코인 / 셀 / 리롤 */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        {/* 코인 */}
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="p-1 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <Coins size={12} className="text-yellow-500"/>
                </div>
                <span className="text-yellow-400 font-bold font-mono text-base">
                    {formatNumber(report.coin_earned)}
                </span>
            </div>
            <div className="text-slate-500 font-mono text-xs">
                {formatNumber(report.coins_per_hour)}/h
            </div>
        </div>

        {/* 셀 */}
        <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="p-1 bg-cyan-500/10 rounded border border-cyan-500/20">
                    <Zap size={12} className="text-cyan-400"/>
                </div>
                <span className="text-cyan-300 font-bold font-mono text-base">
                    {formatNumber(report.cells_earned)}
                </span>
            </div>
            <div className="text-cyan-600/70 font-mono text-xs font-bold">
                {formatNumber(Math.round(cellsPerHour))}/h
            </div>
        </div>

        {/* 리롤 */}
        <div className="flex items-center gap-2">
             <div className="p-1 bg-green-500/10 rounded border border-green-500/20">
                <RefreshCw size={12} className="text-green-400"/>
             </div>
             <span className="text-green-400 font-bold font-mono text-base">
                 {formatNumber(report.reroll_shards_earned)}
             </span>
             <span className="text-slate-600 text-xs ml-auto">Shards</span>
        </div>
      </div>

      {/* 3행: 비율 / 딜량 / 킬러 (3등분) */}
      <div className="pt-2 border-t border-slate-800/50">
          <div className="grid grid-cols-3 gap-2">
              
              {/* 1. 비율 (왼쪽) */}
              <div className="flex flex-col justify-center items-center gap-0.5">
                <div className="text-[11px] leading-tight whitespace-nowrap">
                    <span className="text-purple-400 font-bold mr-1">죽파</span>
                    <span className="text-slate-300">{report.death_wave_ratio || '-'}</span>
                </div>
                <div className="text-[11px] leading-tight whitespace-nowrap">
                    <span className="text-emerald-400 font-bold mr-1">스포트</span>
                    <span className="text-slate-300">{report.spotlight_ratio || '-'}</span>
                </div>
              </div>

              {/* 2. 딜량 (가운데) */}
              <div className="flex flex-col justify-center min-w-0 border-l border-slate-800/50 pl-2">
                {mainDamages.length > 0 ? (
                    mainDamages.map((dmg: DamageItem, idx: number) => (
                        <div key={idx} className="flex items-center min-w-0">
                            <span className={`text-[10px] font-bold mr-1 ${idx === 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                {idx + 1}.
                            </span>
                            <span className={`${idx === 0 ? 'text-rose-400' : 'text-slate-500'} text-[10px] truncate`}>
                                {dmg.name}
                            </span>
                        </div>
                    ))
                ) : (
                    <span className="text-slate-700 text-[10px]">-</span>
                )}
              </div>

              {/* 3. 킬러 (오른쪽) */}
              <div className="flex items-center justify-center pl-2 border-l border-slate-800/50 min-w-0">
                {report.killer ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                        <Skull size={13} className="text-rose-500/70 flex-shrink-0" />
                        <span className="text-rose-300 font-bold text-xs truncate text-center max-w-full leading-tight">
                            {report.killer}
                        </span>
                    </div>
                ) : (
                    <span className="text-slate-700 text-[10px]">-</span>
                )}
              </div>
          </div>
          
          {/* 메모 */}
          {report.notes && (
             <div className="mt-2 flex justify-end">
                 <div className="bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] text-blue-300 truncate max-w-full inline-block">
                    {report.notes}
                 </div>
             </div>
          )}
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // 2. [Desktop View] PC용 그리드 리스트
  // --------------------------------------------------------------------------
  const DesktopView = () => (
    <div 
      onClick={() => onSelectReport(report.battle_date)}
      className="hidden md:grid group bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid-cols-12 gap-2 items-center mb-2"
    >
      {/* 1-2. Time & Wave */}
      <div className="col-span-2 flex flex-col items-center justify-center">
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

      {/* 3-4. Coins */}
      <div className="col-span-2 text-center">
        <div className="text-yellow-400 font-bold font-mono text-lg truncate">{formatNumber(report.coin_earned)}</div>
      </div>

      {/* 5. Coin/h */}
      <div className="col-span-1 text-center">
          <div className="text-slate-300 font-mono font-medium text-sm truncate">{formatNumber(report.coins_per_hour)}/h</div>
      </div>

      {/* 6. Cell/h */}
      <div className="col-span-1 text-center">
          <div className="text-cyan-300 font-mono font-bold text-sm truncate">
            {formatNumber(Math.round(cellsPerHour))}/h
          </div>
      </div>

      {/* 7. Resources */}
      <div className="col-span-1 flex flex-col items-center gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1.5" title="Cells">
           <span className="text-cyan-400 font-mono font-medium text-xs truncate">{formatNumber(report.cells_earned)}</span>
           <Zap size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
        <div className="flex items-center gap-1.5" title="Reroll Shards">
           <span className="text-green-400 font-mono font-medium text-xs truncate">{formatNumber(report.reroll_shards_earned)}</span>
           <Layers size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
      </div>

      {/* 8. Ratio (죽파/스포트 비율) - 툴팁 적용됨 */}
      <div className="col-span-1 flex flex-col justify-center items-center gap-0.5 border-l border-slate-800/50 pl-1 h-full">
         <div 
           className="text-xs leading-tight whitespace-nowrap cursor-help" 
           title="전체 적 중 죽음의 파동의 영향을 받은 적"
         >
            <span className="text-purple-400 font-bold mr-1">죽파</span>
            <span className="text-slate-300">{report.death_wave_ratio || '-'}</span>
         </div>
         <div 
           className="text-xs leading-tight whitespace-nowrap cursor-help" 
           title="전체 적 중 스포트라이트에서 죽은 적"
         >
            <span className="text-emerald-400 font-bold mr-1">스포트</span>
            <span className="text-slate-300">{report.spotlight_ratio || '-'}</span>
         </div>
      </div>

      {/* 9-10. [Merged] Damage & Killer (2칸) */}
      <div className="col-span-2 flex items-center justify-between border-l border-slate-800/50 pl-3 h-full py-0.5 gap-2 min-w-0">
        {/* Left: Damage List */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {mainDamages.length > 0 ? (
            mainDamages.map((dmg: DamageItem, idx: number) => (
              <div key={idx} className="flex items-center min-w-0">
                <span className={`text-[10px] font-bold mr-1 ${idx === 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {idx + 1}.
                </span>
                <span className={`text-[10px] truncate ${idx === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {dmg.name}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">No Data</div>
          )}
        </div>

        {/* Right: Killer (글씨 크기: text-xs, 아이콘: 13) */}
        <div className="flex items-center justify-end min-w-0 pl-1 border-l border-slate-800/30">
            {report.killer ? (
                 <div className="flex flex-col items-center justify-center gap-0.5" title="Killed by">
                    <Skull size={13} className="text-rose-500/70" />
                    <span className="text-rose-300 font-bold text-xs truncate text-center max-w-[75px] leading-tight">
                        {report.killer}
                    </span>
                 </div>
            ) : (
                <span className="text-slate-700 text-xs">-</span>
            )}
        </div>
      </div>

      {/* 11-12. [Expanded] Memo (2칸) */}
      <div className="col-span-2 flex justify-center items-center px-1 border-l border-slate-800/50 h-full">
          {report.notes ? (
            <div className="bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded text-[10px] text-blue-300 truncate w-full text-center cursor-help" title={report.notes}>
              {report.notes}
            </div>
          ) : (
            <span className="text-slate-800 text-xs">-</span>
          )}
      </div>
    </div>
  );

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  );
});

ReportListItem.displayName = 'ReportListItem';

export default ReportListItem;