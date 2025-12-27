import { useMemo, useState } from 'react';
import { Zap, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader } from '../../utils/format'; 
import ReportListItem from './ReportListItem'; 

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
    // 날짜 내림차순 정렬
    return Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].battle_date).getTime() - new Date(a[0].battle_date).getTime()
    );
  }, [reports]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        {groupedReports.map(([dateHeader, groupItems]) => {
          const reportDate = new Date(groupItems[0].battle_date);
          reportDate.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - reportDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const isOld = diffDays >= collapseThresholdDays;
          const isExpanded = expandedDates[dateHeader];
          
          // 현재 날짜의 합계 계산
          const totalCoins = groupItems.reduce((acc, r) => acc + r.coin_earned, 0);
          const totalCells = groupItems.reduce((acc, r) => acc + r.cells_earned, 0);
          const totalShards = groupItems.reduce((acc, r) => acc + r.reroll_shards_earned, 0);

          if (isOld) {
             return (
              <div key={dateHeader} className="border-b border-slate-800/50">
                <div 
                  onClick={() => toggleDate(dateHeader)}
                  className="flex items-center justify-between py-4 px-4 hover:bg-slate-900/50 cursor-pointer transition-colors group select-none"
                >
                  {/* [New] 모바일 뷰: 2줄 레이아웃 (md:hidden) */}
                  <div className="md:hidden flex flex-col gap-3 flex-1 mr-4">
                      {/* 1열: 일자 + 게임수 */}
                      <div className="flex items-center justify-between">
                          <h3 className="text-slate-200 font-bold text-sm">
                             {dateHeader.split(' ').slice(0, 3).join(' ')}
                          </h3>
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium text-xs whitespace-nowrap">
                             {groupItems.length} Games
                          </span>
                      </div>
                      
                      {/* 2열: 코인 | 셀 | 리롤 합산들 */}
                      <div className="flex items-center justify-between pr-2">
                           <div className="flex items-center gap-1.5 text-yellow-500">
                               <span className="font-bold text-xs border border-yellow-500/30 px-1 rounded">C</span>
                               <span className="font-mono font-bold text-sm">{formatNumber(totalCoins)}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-cyan-400">
                               <Zap size={14} fill="currentColor"/>
                               <span className="font-mono font-bold text-sm">{formatNumber(totalCells)}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-green-500">
                               <Layers size={14} />
                               <span className="font-mono font-bold text-sm">{formatNumber(totalShards)}</span>
                           </div>
                      </div>
                  </div>

                  {/* [Existing] 데스크톱 뷰: 기존 디자인 유지 (hidden md:flex) */}
                  <div className="hidden md:flex items-center gap-6">
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
                      
                      {/* Coins */}
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(totalCoins)}</span>
                      </span>

                      {/* Cells */}
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Zap size={14} className="text-cyan-500"/> 
                        <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(totalCells)}</span>
                      </span>

                      {/* Shards */}
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Layers size={14} className="text-green-500"/> 
                        <span className="text-green-500 font-mono font-bold text-base">{formatNumber(totalShards)}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* 접기/펼치기 아이콘 (공통) */}
                  <div className="text-slate-500 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 bg-slate-950/30 animate-fade-in border-t border-slate-800/30 pt-4">
                    {groupItems.map(report => (
                      <ReportListItem 
                        key={report.battle_date} 
                        report={report} 
                        onSelectReport={onSelectReport} 
                      />
                    ))}
                  </div>
                )}
              </div>
             );
          }

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
                </div>
                
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <div className="flex flex-col gap-1">
                {groupItems.map(report => (
                  <ReportListItem 
                    key={report.battle_date} 
                    report={report} 
                    onSelectReport={onSelectReport} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}