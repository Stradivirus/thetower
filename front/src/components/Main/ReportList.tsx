/**
 * 파일명: thetower/front/src/components/Main/ReportList.tsx
 * 용도: 전투 기록 목록을 날짜별로 그룹화하여 표시하는 컴포넌트
 * 기능: 날짜별 그룹 접기/펼치기, 그룹별 총합 통계(코인, 셀, 리롤, 시간) 계산 및 가동률 표시
 */
import { useMemo, useState } from 'react';
import { Zap, Layers, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, formatDateHeader, parseDurationToHours } from '../../utils/format'; 
import ReportListItem from './ReportListItem'; 
import { T } from '../../locales'; 

interface Props {
  reports: BattleMain[];               // 표시할 리포트 목록
  onSelectReport: (date: string) => void; // 리포트 선택 시 실행할 콜백
  hideHeader?: boolean;                // 테이블 헤더 숨김 여부
  collapseThresholdDays?: number;      // 이 날짜보다 오래된 기록은 기본적으로 접어서 표시
}

export default function ReportList({ reports, onSelectReport, hideHeader = false, collapseThresholdDays = 3 }: Props) {
  // 날짜별 그룹의 확장 상태 관리
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const Text = T.main.LIST;

  /** 그룹 접기/펼치기 토글 */
  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  /** 
   * 리포트 데이터를 날짜별(Header 기준)로 그룹화합니다.
   */
  const groupedReports = useMemo(() => {
    const groups: Record<string, BattleMain[]> = {};
    reports.forEach(report => {
      const dateKey = formatDateHeader(report.battle_date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(report);
    });
    // 최신 날짜순으로 정렬
    return Object.entries(groups).sort(([, a], [, b]) => 
      new Date(b[0].battle_date).getTime() - new Date(a[0].battle_date).getTime()
    );
  }, [reports]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      {/* 데스크탑 전용 테이블 헤더 */}
      {!hideHeader && (
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-800 text-center select-none items-end pb-2">
          <div className="col-span-2 text-xs font-bold text-slate-300">{Text.COL_TIME}</div>
          <div className="col-span-2 text-xs font-bold text-slate-300">{Text.COL_COINS}</div>
          <div className="col-span-1 text-xs font-bold text-slate-400">{Text.COL_COIN_H}</div>
          <div className="col-span-1 text-xs font-bold text-cyan-400">{Text.COL_CELL_H}</div>
          <div className="col-span-1 text-xs font-bold text-slate-400">{Text.COL_RES}</div>
          <div className="col-span-1 text-xs font-bold text-slate-400">{Text.COL_RATIO}</div>
          <div className="col-span-2 text-left pl-4">
            <span className="text-xs font-bold text-rose-400">{Text.COL_DMG}</span>
          </div>
          <div className="col-span-2 text-xs font-bold text-slate-400">{Text.COL_MEMO}</div>
        </div>
      )}

      <div className="space-y-6 mt-4">
        {groupedReports.map(([dateHeader, groupItems]) => {
          // 날짜 차이 계산을 통해 오래된 기록인지 확인
          const reportDate = new Date(groupItems[0].battle_date);
          reportDate.setHours(0, 0, 0, 0);
          const diffTime = today.getTime() - reportDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const isOld = diffDays >= collapseThresholdDays;
          const isExpanded = expandedDates[dateHeader];
          
          // 해당 날짜의 총합 통계 계산
          const totalCoins = groupItems.reduce((acc, r) => acc + r.coin_earned, 0);
          const totalCells = groupItems.reduce((acc, r) => acc + r.cells_earned, 0);
          const totalShards = groupItems.reduce((acc, r) => acc + r.reroll_shards_earned, 0);

          // 플레이 시간 및 가동률(24시간 기준 %) 계산
          const totalHours = groupItems.reduce((acc, r) => acc + parseDurationToHours(r.real_time), 0);
          const totalMinutes = Math.round(totalHours * 60);
          const hoursInt = Math.floor(totalMinutes / 60);
          const minutesInt = totalMinutes % 60;
          const coveragePercent = Math.round((totalHours / 24) * 100);

          // 가동률에 따른 색상 설정
          let timeColor = "text-slate-500"; 
          if (totalHours >= 18) timeColor = "text-lime-400";       
          else if (totalHours >= 12) timeColor = "text-yellow-400"; 
          else if (totalHours >= 6) timeColor = "text-rose-500";    

          const timeDisplay = `${hoursInt}h ${minutesInt}m (${coveragePercent}%)`;

          // [Case 1] 접혀있는 오래된 기록 (요약 정보 표시)
          if (isOld) {
             return (
              <div key={dateHeader} className="border-b border-slate-800/50">
                <div 
                  onClick={() => toggleDate(dateHeader)}
                  className="flex items-center justify-between py-4 px-4 hover:bg-slate-900/50 cursor-pointer transition-colors group select-none"
                >
                  {/* 모바일 헤더: 날짜와 핵심 재화량 표시 */}
                  <div className="md:hidden flex flex-col gap-3 flex-1 mr-4">
                       <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1">
                              <h3 className="text-slate-200 font-bold text-sm">
                                 {dateHeader.split(' ').slice(0, 3).join(' ')}
                              </h3>
                              <span className={`text-xs font-bold ${timeColor}`}>
                                 {timeDisplay}
                              </span>
                          </div>
                          <div className="flex items-center">
                             <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium text-xs whitespace-nowrap">
                                {groupItems.length} Games
                             </span>
                          </div>
                      </div>
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

                  {/* 데스크탑 헤더: 가로형 배치로 상세 총합 정보 표시 */}
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
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(totalCoins)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Zap size={14} className="text-cyan-500"/> 
                        <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(totalCells)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                        <Layers size={14} className="text-green-500"/> 
                        <span className="text-green-500 font-mono font-bold text-base">{formatNumber(totalShards)}</span>
                      </span>
                      <div className="h-4 w-px bg-slate-800 ml-2"></div>
                      <span className={`flex items-center gap-1.5 font-mono font-bold text-base ${timeColor} ml-2`}>
                        <Clock size={14} className={timeColor} />
                        {timeDisplay}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-slate-500 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* 펼쳐졌을 때의 아이템 리스트 */}
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

          // [Case 2] 최신 기록 (기본적으로 펼쳐서 표시)
          return (
            <div key={dateHeader} className="animate-fade-in">
              <div className="mb-3 px-2">
                  <div className="md:hidden flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                          <h3 className="text-white font-bold text-base whitespace-nowrap">
                              {dateHeader.split(' ').slice(0, 3).join(' ')}
                              <span className="text-slate-500 text-xs font-normal ml-2">
                                  {dateHeader.split(' ').slice(3).join(' ')}
                              </span>
                          </h3>
                          <div className={`text-sm font-bold ${timeColor}`}>
                              {timeDisplay}
                          </div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap">
                          {groupItems.length} Games
                      </span>
                  </div>

                  <div className="hidden md:flex items-center justify-between gap-4">
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
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${timeColor}`}>
                        {timeDisplay}
                      </div>
                  </div>
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