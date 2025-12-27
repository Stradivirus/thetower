import { Calendar, ChevronDown, ChevronUp, Zap, Coins, Layers } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber } from '../../utils/format';
import ReportList from '../Main/ReportList';

interface MonthlyGroup {
  monthKey: string;
  reports: BattleMain[];
  summary: {
    count: number;
    total_coins: number;
    total_cells: number;
    total_shards: number;
  };
}

interface Props {
  group: MonthlyGroup;
  isExpanded: boolean;
  onToggle: (monthKey: string) => void;
  onSelectReport: (date: string) => void;
}

export default function HistoryMonthGroup({ group, isExpanded, onToggle, onSelectReport }: Props) {
  
  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  // --------------------------------------------------------------------------
  // [Mobile Header] 
  // - 1행: 날짜 + 게임 수(우측 상단)
  // - 2행: 코인 / 셀 / 리롤 (큼직하게!)
  // --------------------------------------------------------------------------
  const MobileHeader = () => (
    <div className="md:hidden w-full flex flex-col gap-3">
      {/* 1행 */}
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-lg flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          {formatMonthKey(group.monthKey)}
        </span>
        
        <div className="flex items-center gap-2">
           <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs border border-slate-700 font-medium">
              {group.summary.count} Games
           </span>
           <div className="text-slate-500">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
           </div>
        </div>
      </div>

      {/* 2행: 자원 정보 */}
      <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 px-1">
        <div className="flex items-center gap-1.5">
           <Coins size={14} className="text-yellow-500"/>
           <span className="text-yellow-400 font-mono font-bold text-base">{formatNumber(group.summary.total_coins)}</span>
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
    </div>
  );

  // --------------------------------------------------------------------------
  // [Desktop Header] 수정됨: 자원 정보를 날짜 옆(왼쪽)으로 이동
  // --------------------------------------------------------------------------
  const DesktopHeader = () => (
    <div className="hidden md:flex w-full items-center justify-between">
       {/* 왼쪽 그룹: 날짜 + 게임수 + 자원 정보 */}
       <div className="flex items-center gap-6">
           <span className="text-white font-bold text-lg flex items-center gap-2 min-w-[120px]">
              <Calendar size={18} className="text-slate-500" />
              {formatMonthKey(group.monthKey)}
           </span>

           <div className="flex items-center gap-4">
              <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700 font-medium whitespace-nowrap">
                 {group.summary.count} Games
              </span>
              
              <div className="h-4 w-px bg-slate-800"></div>

              <div className="flex items-center gap-4 text-sm">
                 <span className="flex items-center gap-1.5" title="Coins">
                    <Coins size={14} className="text-yellow-500"/>
                    <span className="text-yellow-400 font-mono font-bold">{formatNumber(group.summary.total_coins)}</span>
                 </span>
                 <span className="flex items-center gap-1.5" title="Cells">
                    <Zap size={14} className="text-cyan-400"/>
                    <span className="text-cyan-400 font-mono font-bold">{formatNumber(group.summary.total_cells)}</span>
                 </span>
                 {group.summary.total_shards > 0 && (
                     <span className="flex items-center gap-1.5" title="Reroll Shards">
                        <Layers size={14} className="text-green-500"/>
                        <span className="text-green-400 font-mono font-bold">{formatNumber(group.summary.total_shards)}</span>
                     </span>
                 )}
              </div>
           </div>
       </div>

       {/* 오른쪽 그룹: 화살표 */}
       <div className="text-slate-500 ml-2 group-hover:text-white transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
       </div>
    </div>
  );

  return (
    <div className="mb-3 animate-fade-in">
      <button
        onClick={() => onToggle(group.monthKey)}
        className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 transition-all group"
      >
        <MobileHeader />
        <DesktopHeader />
      </button>

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