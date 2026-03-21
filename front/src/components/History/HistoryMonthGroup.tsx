/**
 * 파일명: thetower/front/src/components/History/HistoryMonthGroup.tsx
 * 용도: 히스토리 페이지에서 월별로 그룹화된 리포트 카드 표시
 * 기능: 월별 요약 통계(게임 수, 코인, 셀, 리롤) 표시 및 리포트 리스트 확장/축소 토글
 */
import { Calendar, ChevronDown, ChevronUp, Zap, Coins, Layers } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber } from '../../utils/format';
import ReportList from '../Main/ReportList';
import { T } from '../../locales'; 

interface MonthlyGroup {
  monthKey: string;      // "YYYY-MM" 형식의 키
  reports: BattleMain[]; // 해당 월의 리포트 목록
  summary: {
    count: number;
    total_coins: number;
    total_cells: number;
    total_shards: number;
    avg_coins_per_game: number;
    avg_coins_per_day: number;
  };
}

interface Props {
  group: MonthlyGroup;
  isExpanded: boolean;
  onToggle: (monthKey: string) => void;
  onSelectReport: (date: string) => void;
}

export default function HistoryMonthGroup({ group, isExpanded, onToggle, onSelectReport }: Props) {
  const Text = T.history.MONTH_GROUP;

  /** 월 키를 읽기 쉬운 한글 형식으로 변환 */
  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}${Text.FORMAT_YEAR} ${parseInt(month)}${Text.FORMAT_MONTH}`;
  };

  /** 모바일 전용 헤더 레이아웃 (세로형 요약) */
  const MobileHeader = () => (
    <div className="md:hidden w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-lg flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          {formatMonthKey(group.monthKey)}
        </span>
        
        <div className="flex items-center gap-2">
           <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs border border-slate-700 font-medium">
              {group.summary.count} {Text.GAMES}
           </span>
           <div className="text-slate-500">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-800/50 pt-2 px-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-yellow-500"/>
            <span className="text-yellow-400 font-mono font-bold text-lg">{formatNumber(group.summary.total_coins)}</span>
            </div>
            <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-cyan-400"/>
            <span className="text-cyan-400 font-mono font-bold text-base">{formatNumber(group.summary.total_cells)}</span>
            </div>
            {group.summary.total_shards > 0 && (
                <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-green-500"/>
                <span className="text-green-400 font-mono font-bold text-base">{formatNumber(group.summary.total_shards)}</span>
                </div>
            )}
        </div>
        
        <div className="flex items-center gap-3 text-[10px] text-slate-500 border-t border-slate-800/30 pt-1 mt-0.5">
            <div className="flex items-center gap-1">
                <span>{Text.AVG_PER_GAME}</span>
                <span className="text-slate-400 font-mono">{formatNumber(group.summary.avg_coins_per_game)}</span>
            </div>
            <div className="flex items-center gap-1">
                <span>{Text.AVG_PER_DAY}</span>
                <span className="text-slate-400 font-mono">{formatNumber(group.summary.avg_coins_per_day)}</span>
            </div>
        </div>
      </div>
    </div>
  );

  /** 데스크탑 전용 헤더 레이아웃 (가로형 상세 정보) */
  const DesktopHeader = () => (
    <div className="hidden md:flex w-full items-center justify-between">
       <div className="flex items-center gap-6">
           <span className="text-white font-bold text-lg flex items-center gap-2 min-w-[120px]">
              <Calendar size={18} className="text-slate-500" />
              {formatMonthKey(group.monthKey)}
           </span>

           <div className="flex items-center gap-4">
              <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700 font-medium whitespace-nowrap">
                 {group.summary.count} {Text.GAMES}
              </span>
              
              <div className="h-4 w-px bg-slate-800"></div>

              <div className="flex items-center gap-4 text-sm">
                 <span className="flex items-center gap-1.5" title="Total Coins">
                    <Coins size={14} className="text-yellow-500"/>
                    <span className="text-yellow-400 font-mono font-bold text-base">{formatNumber(group.summary.total_coins)}</span>
                 </span>
                 <span className="flex items-center gap-1.5" title="Total Cells">
                    <Zap size={14} className="text-cyan-400"/>
                    <span className="text-cyan-400 font-mono font-bold">{formatNumber(group.summary.total_cells)}</span>
                 </span>
                 {group.summary.total_shards > 0 && (
                     <span className="flex items-center gap-1.5" title="Total Reroll Shards">
                        <Layers size={14} className="text-green-500"/>
                        <span className="text-green-400 font-mono font-bold">{formatNumber(group.summary.total_shards)}</span>
                     </span>
                 )}
              </div>
           </div>
       </div>

       <div className="flex items-center gap-6 ml-auto mr-4">
          <div className="flex items-center gap-5 text-sm">
             <div className="flex items-center gap-1.5">
                <span className="text-yellow-500/50 font-medium text-xs">{Text.AVG_PER_DAY}</span>
                <span className="text-yellow-400 font-mono font-bold">{formatNumber(group.summary.avg_coins_per_day)}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="text-yellow-500/50 font-medium text-xs">{Text.AVG_PER_GAME}</span>
                <span className="text-yellow-400 font-mono font-bold">{formatNumber(group.summary.avg_coins_per_game)}</span>
             </div>
          </div>

          <div className="text-slate-500 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
       </div>
    </div>
  );

  return (
    <div className="mb-3 animate-fade-in">
      {/* 월별 요약 버튼 (클릭 시 토글) */}
      <button
        onClick={() => onToggle(group.monthKey)}
        className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 transition-all group"
      >
        <MobileHeader />
        <DesktopHeader />
      </button>

      {/* 확장된 리포트 목록 */}
      {isExpanded && (
        <div className="mt-2 border-slate-800">
           <ReportList 
             reports={group.reports} 
             onSelectReport={onSelectReport}
             hideHeader={true}
             collapseThresholdDays={0}
           />
        </div>
      )}
    </div>
  );
}