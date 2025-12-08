import { useMemo, useState } from 'react';
import { Zap, Layers, ChevronDown, ChevronUp, Skull} from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader, formatTimeOnly, parseDurationToHours } from '../../utils/format';

interface Props {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
  hideHeader?: boolean;
  collapseThresholdDays?: number;
}

// [New] 증감률 표시 컴포넌트 (심플 버전)
const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
  if (!previous || previous === 0) return null;
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  const isPositive = diff > 0;
  
  if (diff === 0) return null;

  return (
    <span className={`text-[10px] font-bold ml-1.5 flex items-center ${isPositive ? 'text-green-500' : 'text-rose-500'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(percent).toFixed(1)}%
    </span>
  );
};

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
    // 날짜 내림차순 정렬
    return Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].battle_date).getTime() - new Date(a[0].battle_date).getTime()
    );
  }, [reports]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderItem = (report: BattleMain) => {
    const durationHours = parseDurationToHours(report.real_time);
    const cellsPerHour = durationHours > 0 ? report.cells_earned / durationHours : 0;

    const utilityKeywords = ['오브', '블랙홀'];
    const mainDamages = (report.top_damages || [])
      .filter(d => !utilityKeywords.includes(d.name))
      .slice(0, 3);

    return (
      <div 
        key={report.battle_date}
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
             <span className="text-slate-600 text-[10px]">•</span>
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
              {mainDamages.map((dmg, idx) => (
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
  };

  return (
    <>
      {!hideHeader && (
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800 text-center select-none items-end pb-2">
          <div className="col-span-2 text-xs font-bold text-slate-300">Time / Wave</div>
          <div className="col-span-2 text-xs font-bold text-slate-300">Coins</div>
          <div className="col-span-1 text-xs font-bold text-slate-400">Coin/h</div>
          <div className="col-span-1 text-xs font-bold text-cyan-400">Cell/h</div>
          <div className="col-span-1 text-xs font-bold text-slate-400">Res.</div>
          <div className="col-span-3 text-left pl-4">
            <span className="text-xs font-bold text-rose-400">Damage & Killer</span>
            <span className="text-[10px] text-slate-500 font-normal ml-1 block leading-none mt-0.5">(오브, 블랙홀 제외)</span>
          </div>
          <div className="col-span-2 text-xs font-bold text-slate-400">Memo</div>
        </div>
      )}

      <div className="space-y-6 mt-4">
        {groupedReports.map(([dateHeader, groupItems], index) => {
          const reportDate = new Date(groupItems[0].battle_date);
          reportDate.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - reportDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const isOld = diffDays >= collapseThresholdDays;
          const isExpanded = expandedDates[dateHeader];
          
          // [New] 현재 날짜의 합계 계산
          const totalCoins = groupItems.reduce((acc, r) => acc + r.coin_earned, 0);
          const totalCells = groupItems.reduce((acc, r) => acc + r.cells_earned, 0);
          const totalShards = groupItems.reduce((acc, r) => acc + r.reroll_shards_earned, 0);

          // [New] 전일 데이터 가져오기 (groupedReports가 내림차순이므로 index+1이 과거)
          const prevGroup = groupedReports[index + 1];
          let prevCoins = 0;
          let prevCells = 0;
          
          if (prevGroup) {
            const prevItems = prevGroup[1];
            prevCoins = prevItems.reduce((acc, r) => acc + r.coin_earned, 0);
            prevCells = prevItems.reduce((acc, r) => acc + r.cells_earned, 0);
          }

          if (isOld) {
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
                    <div className="flex items-center gap-4 text-xs">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                        {groupItems.length} Games
                      </span>
                      <div className="h-4 w-px bg-slate-800"></div>
                      
                      {/* Coins + Trend */}
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(totalCoins)}</span>
                        <TrendIndicator current={totalCoins} previous={prevCoins} />
                      </span>

                      {/* Cells + Trend */}
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Zap size={14} className="text-cyan-500"/> 
                        <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(totalCells)}</span>
                        <TrendIndicator current={totalCells} previous={prevCells} />
                      </span>

                      {/* Shards */}
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Layers size={14} className="text-green-500"/> 
                        <span className="text-green-500 font-mono font-bold text-base">{formatNumber(totalShards)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-500 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-950/30 animate-fade-in border-t border-slate-800/30 pt-4">
                    {groupItems.map(report => renderItem(report))}
                  </div>
                )}
              </div>
             );
          }

          // [Modified] 최근 일별 리스트에도 헤더 정보(합계+증감률) 표시
          return (
            <div key={dateHeader} className="animate-fade-in">
              <div className="flex items-center justify-between gap-4 mb-3 px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold text-base whitespace-nowrap">
                        {dateHeader.split(' ').slice(0, 3).join(' ')}
                        <span className="text-slate-500 text-xs font-normal ml-2">
                            {dateHeader.split(' ').slice(3).join(' ')}
                        </span>
                    </h3>
                    
                    <span className="text-xs text-slate-500 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {groupItems.length} Games
                    </span>

                    {/* 일별 헤더에도 증감률 표시 (최근 리스트용) */}
                    <div className="hidden sm:flex items-center gap-3 text-xs ml-2 border-l border-slate-800 pl-3">
                         <span className="flex items-center gap-1">
                            <span className="text-yellow-500 font-mono font-bold">{formatNumber(totalCoins)}</span>
                            <TrendIndicator current={totalCoins} previous={prevCoins} />
                         </span>
                         <span className="flex items-center gap-1">
                            <Zap size={12} className="text-cyan-500"/>
                            <span className="text-cyan-500 font-mono font-bold">{formatNumber(totalCells)}</span>
                            <TrendIndicator current={totalCells} previous={prevCells} />
                         </span>
                    </div>
                </div>
                
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <div className="flex flex-col gap-1">
                {groupItems.map(report => renderItem(report))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}