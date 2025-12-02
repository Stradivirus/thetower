import { useMemo, useState } from 'react';
import { Zap, Layers, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader, formatTimeOnly, parseDurationToHours } from '../../utils/format';

interface Props {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
  hideHeader?: boolean;
  collapseThresholdDays?: number;
}

export default function ReportList({ reports, onSelectReport, hideHeader = false, collapseThresholdDays = 3 }: Props) {
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const groupedReports = useMemo(() => {
    const groups: Record<string, BattleMain[]> = {};
    reports.forEach(report => {
      const dateKey = formatDateHeader(report.battle_date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(report);
    });
    return Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].battle_date).getTime() - new Date(a[0].battle_date).getTime()
    );
  }, [reports]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderItem = (report: BattleMain) => {
    const durationHours = parseDurationToHours(report.real_time);
    const cellsPerHour = durationHours > 0 ? report.cells_earned / durationHours : 0;

    return (
      <div 
        key={report.battle_date}
        onClick={() => onSelectReport(report.battle_date)}
        className="group bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
      >
        {/* 1. Time & Wave (3칸) - 중앙 정렬 */}
        <div className="md:col-span-3 grid grid-cols-2 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="text-white font-medium text-sm">{report.real_time}</div>
            <div className="text-slate-500 text-xs">{formatTimeOnly(report.battle_date)}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-white font-medium text-sm">
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">T{report.tier}</span>
            </div>
            <div className="text-slate-500 text-xs mt-0.5">Wave {report.wave}</div>
          </div>
        </div>

        {/* 2. Coins (2칸) - 중앙 정렬 */}
        <div className="md:col-span-2 text-center">
          <div className="text-yellow-400 font-bold font-mono text-xl truncate">{formatNumber(report.coin_earned)}</div>
        </div>

        {/* 3. Coin CPH (2칸) - 중앙 정렬 */}
        <div className="md:col-span-2 text-center">
            <div className="text-slate-300 font-mono font-medium text-sm truncate">{formatNumber(report.coins_per_hour)}/h</div>
        </div>

        {/* 4. Cell CPH (1칸) - 중앙 정렬 */}
        <div className="md:col-span-1 text-center">
            <div className="text-cyan-300 font-mono font-bold text-sm truncate">
              {formatNumber(Math.round(cellsPerHour))}/h
            </div>
        </div>

        {/* 5. Resources (2칸) - 아이콘만 중앙 정렬 */}
        <div className="md:col-span-2 flex flex-col items-center gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1.5" title="Cells">
             <span className="text-cyan-400 font-mono font-medium text-sm truncate">{formatNumber(report.cells_earned)}</span>
             <Zap size={12} className="text-slate-600 flex-shrink-0"/>
          </div>
          <div className="flex items-center gap-1.5" title="Reroll Shards">
             <span className="text-green-400 font-mono font-medium text-sm truncate">{formatNumber(report.reroll_shards_earned)}</span>
             <Layers size={12} className="text-slate-600 flex-shrink-0"/>
          </div>
        </div>

        {/* 6. Killer (1칸) - 중앙 정렬 */}
        <div className="md:col-span-1 text-center">
          <span className="inline-flex items-center justify-center w-full px-1 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-medium border border-rose-500/20 truncate">
            {report.killer}
          </span>
        </div>

        {/* 7. Memo (1칸) - 중앙 정렬 */}
        <div className="md:col-span-1 flex justify-center">
            {report.notes ? (
              <div className="text-xs text-slate-400 bg-slate-800/50 px-1.5 py-1 rounded border border-slate-700/50 truncate max-w-full text-center" title={report.notes}>
                {report.notes}
              </div>
            ) : (
              <div className="h-6"></div> 
            )}
        </div>
      </div>
    );
  };

  return (
    <>
      {!hideHeader && (
        <div className="hidden md:flex gap-6 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">
          <div className="w-32 flex-shrink-0 text-center">Date</div> {/* 날짜 헤더도 중앙 */}
          <div className="flex-1 grid grid-cols-12 gap-2 text-center"> {/* 전체 헤더 중앙 정렬 */}
            <div className="col-span-3 grid grid-cols-2"><span>Time</span><span>Wave</span></div>
            <div className="col-span-2">Coins</div>
            <div className="col-span-2">Coin/h</div>
            <div className="col-span-1 text-cyan-500/70">Cell/h</div>
            <div className="col-span-2">Res.</div>
            <div className="col-span-1">Killer</div>
            <div className="col-span-1">Memo</div>
          </div>
        </div>
      )}

      <div className="space-y-0">
        {groupedReports.map(([dateHeader, groupItems]) => {
          // ... (기존 로직 동일)
          const reportDate = new Date(groupItems[0].battle_date);
          reportDate.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - reportDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const isOld = diffDays >= collapseThresholdDays;
          const isExpanded = expandedDates[dateHeader];
          const totalCoins = groupItems.reduce((acc, r) => acc + r.coin_earned, 0);
          const totalCells = groupItems.reduce((acc, r) => acc + r.cells_earned, 0);
          const totalShards = groupItems.reduce((acc, r) => acc + r.reroll_shards_earned, 0);

          if (!isOld) {
            return (
              <div key={dateHeader} className="flex flex-col md:flex-row gap-6 border-b border-slate-800/50 py-6 last:border-0 animate-fade-in">
                <div className="md:w-32 flex-shrink-0 text-center md:text-left"> {/* 모바일은 중앙, 데스크탑은 왼쪽 유지 추천 (날짜 가독성) */}
                  <div className="sticky top-24">
                    <h3 className="text-slate-200 font-bold text-sm leading-tight mb-1">
                      {dateHeader.split(' ').slice(0, 3).join(' ')}
                    </h3>
                    <div className="text-slate-500 text-xs font-medium">
                      {dateHeader.split(' ').slice(3).join(' ')}
                    </div>
                    <div className="mt-2 text-[10px] text-blue-400 font-mono bg-blue-500/10 inline-block px-2 py-0.5 rounded border border-blue-500/20">
                      {groupItems.length} Games
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {groupItems.map(report => renderItem(report))}
                </div>
              </div>
            );
          }

          return (
            <div key={dateHeader} className="border-b border-slate-800/50">
              <div 
                onClick={() => toggleDate(dateHeader)}
                className="flex items-center justify-between py-4 px-4 hover:bg-slate-900/50 cursor-pointer transition-colors group select-none"
              >
                <div className="flex items-center gap-6">
                  <div className="w-32 flex-shrink-0">
                    <h3 className="text-slate-400 group-hover:text-slate-200 font-bold text-sm transition-colors">
                      {dateHeader.split(' ').slice(0, 3).join(' ')}
                    </h3>
                  </div>
                  {/* 요약 줄도 중앙 정렬 느낌을 위해 gap 조정 */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                      {groupItems.length} Games
                    </span>
                    <div className="h-4 w-px bg-slate-800"></div>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Coins size={12} className="text-yellow-500"/> 
                      <span className="text-yellow-500 font-mono font-bold">{formatNumber(totalCoins)}</span> Total
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Zap size={12} className="text-cyan-500"/> 
                      <span className="text-cyan-500 font-mono font-bold">{formatNumber(totalCells)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Layers size={12} className="text-green-500"/> 
                      <span className="text-green-500 font-mono font-bold">{formatNumber(totalShards)}</span>
                    </span>
                  </div>
                </div>
                <div className="text-slate-500 group-hover:text-white transition-colors">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {isExpanded && (
                <div className="pl-4 pr-4 pb-6 pt-2 flex flex-col md:flex-row gap-6 bg-slate-950/30 animate-fade-in border-t border-slate-800/30">
                  <div className="hidden md:block w-32 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    {groupItems.map(report => renderItem(report))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}