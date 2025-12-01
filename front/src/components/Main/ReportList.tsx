import { useMemo } from 'react';
import { Zap, Layers } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader, formatTimeOnly } from '../../utils/format';

interface Props {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function ReportList({ reports, onSelectReport }: Props) {
  // === 날짜별 그룹화 로직 ===
  const groupedReports = useMemo(() => {
    const groups: Record<string, BattleMain[]> = {};
    reports.forEach(report => {
      const dateKey = formatDateHeader(report.battle_date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(report);
    });
    return Object.entries(groups);
  }, [reports]);

  return (
    <>
      {/* 테이블 헤더 */}
      <div className="hidden md:flex gap-6 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">
        <div className="w-32 flex-shrink-0">Date</div>
        <div className="flex-1 grid grid-cols-12 gap-2">
          <div className="col-span-3 grid grid-cols-2"><span>Time</span><span>Wave</span></div>
          <div className="col-span-1 text-right">Coins</div>
          <div className="col-span-2 text-right">CPH (Hr)</div>
          <div className="col-span-3 text-right">Resources</div>
          <div className="col-span-1 text-center">Killer</div>
          <div className="col-span-2 text-left pl-2">Memo</div>
        </div>
      </div>

      {/* 리스트 본문 */}
      <div className="space-y-0">
        {groupedReports.map(([dateHeader, groupItems]) => (
          <div key={dateHeader} className="flex flex-col md:flex-row gap-6 border-b border-slate-800/50 py-6 last:border-0">
            {/* 왼쪽: 날짜 */}
            <div className="md:w-32 flex-shrink-0">
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

            {/* 오른쪽: 리스트 아이템 */}
            <div className="flex-1 space-y-2">
              {groupItems.map((report) => (
                <div 
                  key={report.battle_date}
                  onClick={() => onSelectReport(report.battle_date)}
                  className="group bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                >
                  {/* Time & Wave */}
                  <div className="md:col-span-3 grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <div className="text-white font-medium text-sm">{report.real_time}</div>
                      <div className="text-slate-500 text-xs">{formatTimeOnly(report.battle_date)}</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-white font-medium text-sm">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">T{report.tier}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">Wave {report.wave}</div>
                    </div>
                  </div>

                  {/* Coins */}
                  <div className="md:col-span-1 text-right">
                    <div className="text-yellow-400 font-bold font-mono text-xl">{formatNumber(report.coin_earned)}</div>
                  </div>

                  {/* CPH */}
                  <div className="md:col-span-2 text-right">
                      <div className="text-slate-300 font-mono font-medium">{formatNumber(report.coins_per_hour)}/h</div>
                  </div>

                  {/* Resources */}
                  <div className="md:col-span-3 flex justify-end gap-3 text-right">
                    <div>
                      <div className="text-cyan-400 font-mono font-medium">{report.cells_earned.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-600 flex items-center justify-end gap-1"><Zap size={10}/> Cells</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-mono font-medium">{formatNumber(report.reroll_shards_earned)}</div>
                      <div className="text-[10px] text-slate-600 flex items-center justify-end gap-1"><Layers size={10}/> 리롤</div>
                    </div>
                  </div>

                  {/* Killer */}
                  <div className="md:col-span-1 text-center">
                    <span className="inline-flex items-center justify-center w-full px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 truncate">{report.killer}</span>
                  </div>

                  {/* Memo */}
                  <div className="md:col-span-2 pl-2">
                      {report.notes ? (
                        <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 truncate" title={report.notes}>{report.notes}</div>
                      ) : (
                        <div className="h-6"></div> 
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}