import { useMemo, useState } from 'react';
import { Zap, Layers, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader, formatTimeOnly } from '../../utils/format';

interface Props {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
  hideHeader?: boolean;
  collapseThresholdDays?: number; // 며칠 이상 지났을 때 아코디언으로 접을지 (기본값: 3)
}

export default function ReportList({ reports, onSelectReport, hideHeader = false, collapseThresholdDays = 3 }: Props) {
  // 아코디언 토글 상태 관리
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // 날짜별 그룹화 및 정렬
  const groupedReports = useMemo(() => {
    const groups: Record<string, BattleMain[]> = {};
    reports.forEach(report => {
      const dateKey = formatDateHeader(report.battle_date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(report);
    });
    // 날짜 내림차순 정렬 (최신순)
    return Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].battle_date).getTime() - new Date(a[0].battle_date).getTime()
    );
  }, [reports]);

  // 오늘 날짜 기준점 (시간 제거)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 리스트 아이템 렌더링 함수 (재사용)
  const renderItem = (report: BattleMain) => (
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
  );

  return (
    <>
      {/* 테이블 헤더: hideHeader가 false일 때만 표시 */}
      {!hideHeader && (
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
      )}

      {/* 리스트 본문 */}
      <div className="space-y-0">
        {groupedReports.map(([dateHeader, groupItems]) => {
          // 날짜 차이 계산
          const reportDate = new Date(groupItems[0].battle_date);
          reportDate.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - reportDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // collapseThresholdDays를 기준으로 아코디언 여부 결정
          const isOld = diffDays >= collapseThresholdDays;
          const isExpanded = expandedDates[dateHeader];

          // 요약 데이터 계산
          const totalCoins = groupItems.reduce((acc, r) => acc + r.coin_earned, 0);
          const totalCells = groupItems.reduce((acc, r) => acc + r.cells_earned, 0);
          const totalShards = groupItems.reduce((acc, r) => acc + r.reroll_shards_earned, 0);

          // [Case 1] 기준일 미만: 펼쳐서 표시
          if (!isOld) {
            return (
              <div key={dateHeader} className="flex flex-col md:flex-row gap-6 border-b border-slate-800/50 py-6 last:border-0 animate-fade-in">
                {/* 날짜 섹션 */}
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
                {/* 아이템 리스트 */}
                <div className="flex-1 space-y-2">
                  {groupItems.map(report => renderItem(report))}
                </div>
              </div>
            );
          }

          // [Case 2] 기준일 이상: 아코디언 요약 표시
          return (
            <div key={dateHeader} className="border-b border-slate-800/50">
              <div 
                onClick={() => toggleDate(dateHeader)}
                className="flex items-center justify-between py-4 px-4 hover:bg-slate-900/50 cursor-pointer transition-colors group select-none"
              >
                <div className="flex items-center gap-6">
                  {/* 날짜 */}
                  <div className="w-32 flex-shrink-0">
                    <h3 className="text-slate-400 group-hover:text-slate-200 font-bold text-sm transition-colors">
                      {dateHeader.split(' ').slice(0, 3).join(' ')}
                    </h3>
                  </div>
                  
                  {/* 요약 뱃지들 */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                      {groupItems.length} Games
                    </span>
                    <div className="h-4 w-px bg-slate-800"></div>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Coins size={12} className="text-yellow-500"/> 
                      <span className="text-yellow-500 font-mono font-bold">{formatNumber(totalCoins)}</span> Total
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                      <Zap size={12} className="text-cyan-500"/> 
                      <span className="text-cyan-500 font-mono font-bold">{totalCells.toLocaleString()}</span> Cells
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                      <Layers size={12} className="text-green-500"/> 
                      <span className="text-green-500 font-mono font-bold">{formatNumber(totalShards)}</span> Shards
                    </span>
                  </div>
                </div>

                <div className="text-slate-500 group-hover:text-white transition-colors">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* 펼쳤을 때 내용물 */}
              {isExpanded && (
                <div className="pl-4 pr-4 pb-6 pt-2 flex flex-col md:flex-row gap-6 bg-slate-950/30 animate-fade-in border-t border-slate-800/30">
                  <div className="hidden md:block w-32 flex-shrink-0"></div> {/* 여백 맞춤용 */}
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