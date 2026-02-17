/**
 * 파일명: thetower/front/src/components/Main/ReportListItem.tsx
 * 용도: 전투 기록 목록의 개별 항목을 표시하는 컴포넌트
 * 기능: 모바일/데스크탑 반응형 뷰 제공, 주요 자원 및 킬 비율, 딜 순위, 처치자 요약 정보 표시
 */
import React from 'react';
import { Zap, RefreshCw, Skull, Layers, Coins } from 'lucide-react';
import type { BattleMain } from '../../types/report'; 
import { formatNumber, formatTimeOnly, parseDurationToHours } from '../../utils/format';
import { T } from '../../locales'; 

interface Props {
  report: BattleMain;                   // 표시할 리포트 데이터
  onSelectReport: (date: string) => void; // 클릭 시 상세 페이지 이동 핸들러
  hideHeader?: boolean;
}

const ReportListItem = React.memo<Props>(({ report, onSelectReport }) => {
  const Text = T.main.ITEM;

  // --- 공통 데이터 처리 로직 ---
  const durationHours = parseDurationToHours(report.real_time);
  const cellsPerHour = durationHours > 0 ? report.cells_earned / durationHours : 0;

  // 딜 순위에서 제외할 유틸리티성 키워드
  const utilityKeywords = ['오브', '블랙홀', '데스 페널티', '안티 큐브'];
  
  // 유틸 키워드 제외 후 상위 3개 딜러 추출
  const mainDamages = (report.top_damages || [])
    .filter((name: string) => !utilityKeywords.includes(name)) 
    .slice(0, 3);

  /** 
   * [1. Mobile View] 세로형 카드 레이아웃
   */
  const MobileView = () => (
    <div 
      onClick={() => onSelectReport(report.battle_date)}
      className="group relative bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-800/60 p-4 rounded-xl cursor-pointer transition-all mb-3 shadow-sm md:hidden block"
    >
      {/* 1행: 시간, 티어, 웨이브 정보 */}
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

      {/* 2행: 코인, 셀, 리롤 파편 획득량 */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        {/* 코인 정보 */}
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

        {/* 셀 정보 */}
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

        {/* 리롤 파편 정보 */}
        <div className="flex items-center gap-2">
             <div className="p-1 bg-green-500/10 rounded border border-green-500/20">
                <RefreshCw size={12} className="text-green-400"/>
             </div>
             <span className="text-green-400 font-bold font-mono text-base">
                 {formatNumber(report.reroll_shards_earned)}
             </span>
             <span className="text-slate-600 text-xs ml-auto">{Text.SHARDS}</span>
        </div>
      </div>

      {/* 3행: 킬 비율, 주요 딜러, 처치자(Killer) 정보 */}
      <div className="pt-2 border-t border-slate-800/50">
          <div className="grid grid-cols-3 gap-2">
              
              {/* 1. 비율 데이터 */}
              <div className="flex flex-col justify-center items-center gap-0.5">
                <div className="text-[11px] leading-tight whitespace-nowrap">
                    <span className="text-purple-400 font-bold mr-1">{Text.LABEL_DW}</span>
                    <span className="text-slate-300">{report.death_wave_ratio || '-'}</span>
                </div>
                <div className="text-[11px] leading-tight whitespace-nowrap">
                    <span className="text-emerald-400 font-bold mr-1">{Text.LABEL_SL}</span>
                    <span className="text-slate-300">{report.spotlight_ratio || '-'}</span>
                </div>
                <div className="text-[11px] leading-tight whitespace-nowrap">
                    <span className="text-yellow-400 font-bold mr-1">{Text.LABEL_GB}</span>
                    <span className="text-slate-300">{report.golden_bot_ratio || '-'}</span>
                </div>
              </div>

              {/* 2. 주요 딜러 데이터 */}
              <div className="flex flex-col justify-center min-w-0 border-l border-slate-800/50 pl-2">
                {mainDamages.length > 0 ? (
                    mainDamages.map((name: string, idx: number) => (
                        <div key={idx} className="flex items-center min-w-0">
                            <span className={`text-[10px] font-bold mr-1 ${idx === 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                {idx + 1}.
                            </span>
                            <span className={`${idx === 0 ? 'text-rose-400' : 'text-slate-500'} text-[10px] truncate`}>
                                {name}
                            </span>
                        </div>
                    ))
                ) : (
                    <span className="text-slate-700 text-[10px]">-</span>
                )}
              </div>

              {/* 3. 킬러 데이터 */}
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
          
          {/* 메모 섹션 (존재 시에만) */}
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

  /** 
   * [2. Desktop View] 12그리드 가로 레이아웃
   */
  const DesktopView = () => (
    <div 
      onClick={() => onSelectReport(report.battle_date)}
      className="hidden md:grid group bg-slate-900/40 border border-slate-800/60 hover:border-blue-500/30 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid-cols-12 gap-2 items-center mb-2"
    >
      {/* 시간 및 웨이브 정보 (col-2) */}
      <div className="col-span-2 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2">
           <span className="text-white font-bold text-sm">{report.real_time}</span>
           <span className="text--[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 leading-none">T{report.tier}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
           <span className="text-slate-500 text-xs">{formatTimeOnly(report.battle_date)}</span>
           <span className="text-slate-600 text-[10px]">・</span>
           <span className="text-slate-400 text-xs">W {report.wave}</span>
        </div>
      </div>

      {/* 총 코인 (col-2) */}
      <div className="col-span-2 text-center">
        <div className="text-yellow-400 font-bold font-mono text-lg truncate">{formatNumber(report.coin_earned)}</div>
      </div>

      {/* 시간당 코인 (col-1) */}
      <div className="col-span-1 text-center">
          <div className="text-slate-300 font-mono font-medium text-sm truncate">{formatNumber(report.coins_per_hour)}/h</div>
      </div>

      {/* 시간당 셀 (col-1) */}
      <div className="col-span-1 text-center">
          <div className="text-cyan-300 font-mono font-bold text-sm truncate">
            {formatNumber(Math.round(cellsPerHour))}/h
          </div>
      </div>

      {/* 획득 자원 상세 (col-1) */}
      <div className="col-span-1 flex flex-col items-center gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1.5" title="Cells">
           <span className="text-cyan-400 font-mono font-medium text-xs truncate">{formatNumber(report.cells_earned)}</span>
           <Zap size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
        <div className="flex items-center gap-1.5" title={Text.SHARDS}>
           <span className="text-green-400 font-mono font-medium text-xs truncate">{formatNumber(report.reroll_shards_earned)}</span>
           <Layers size={10} className="text-slate-600 flex-shrink-0"/>
        </div>
      </div>

      {/* 킬 소스 비율 (col-1) */}
      <div className="col-span-1 flex flex-col justify-center items-center gap-0.5 border-l border-slate-800/50 pl-1 h-full">
         <div className="text-xs leading-tight whitespace-nowrap cursor-help" title={Text.TOOLTIP_DW}>
            <span className="text-purple-400 font-bold mr-1">{Text.LABEL_DW}</span>
            <span className="text-slate-300">{report.death_wave_ratio || '-'}</span>
         </div>
         <div className="text-xs leading-tight whitespace-nowrap cursor-help" title={Text.TOOLTIP_SL}>
            <span className="text-emerald-400 font-bold mr-1">{Text.LABEL_SL}</span>
            <span className="text-slate-300">{report.spotlight_ratio || '-'}</span>
         </div>
         <div className="text-xs leading-tight whitespace-nowrap cursor-help" title={Text.TOOLTIP_GB}>
            <span className="text-yellow-400 font-bold mr-1">{Text.LABEL_GB}</span>
            <span className="text-slate-300">{report.golden_bot_ratio || '-'}</span>
         </div>
      </div>

      {/* 주요 딜러 및 처치자 (col-2) */}
      <div className="col-span-2 flex items-center justify-between border-l border-slate-800/50 pl-3 h-full py-0.5 gap-2 min-w-0">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {mainDamages.length > 0 ? (
            mainDamages.map((name: string, idx: number) => (
              <div key={idx} className="flex items-center min-w-0">
                <span className={`text-[10px] font-bold mr-1 ${idx === 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  {idx + 1}.
                </span>
                <span className={`text-[10px] truncate ${idx === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {name}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500">{Text.NO_DATA}</div>
          )}
        </div>

        <div className="flex items-center justify-end min-w-0 pl-1 border-l border-slate-800/30">
            {report.killer ? (
                 <div className="flex flex-col items-center justify-center gap-0.5" title={Text.TOOLTIP_KILLER}>
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

      {/* 메모 표시 영역 (col-2) */}
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