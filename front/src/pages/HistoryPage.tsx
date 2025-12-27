import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Trophy, Loader2 } from 'lucide-react';
import type { BattleMain } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getAllReports } from '../api/reports';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import HistoryMonthGroup from '../components/History/HistoryMonthGroup'; // [New]

export interface MonthlyGroup {
  monthKey: string;
  reports: BattleMain[];
  summary: {
    count: number;
    total_coins: number;
    total_cells: number;
    total_shards: number;
  };
}

export default function HistoryPage() {
  const navigate = useNavigate();
  
  const [allReports, setAllReports] = useState<BattleMain[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [reportsData, statsData] = await Promise.all([
          getAllReports(),
          getWeeklyStats()
        ]);
        setAllReports(reportsData);
        setWeeklyStats(statsData);
      } catch (error) {
        console.error("Failed to load history data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectReport = (date: string) => {
    navigate(`/report/${date}`);
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  // 검색 필터링
  const filteredReports = useMemo(() => {
    if (!searchTerm) return allReports;
    const lower = searchTerm.toLowerCase();
    return allReports.filter(r => 
      r.notes?.toLowerCase().includes(lower) || 
      r.killer?.toLowerCase().includes(lower) ||
      r.tier?.toLowerCase().includes(lower) ||
      r.battle_date.includes(searchTerm)
    );
  }, [allReports, searchTerm]);

  // 최근 7일 데이터 (검색 없을 때만)
  const recentReports = useMemo(() => {
    if (searchTerm) return [];
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return filteredReports.filter(r => new Date(r.battle_date) >= oneWeekAgo);
  }, [filteredReports, searchTerm]);

  // 월별 그룹화
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, MonthlyGroup> = {};
    filteredReports.forEach(report => {
      const date = new Date(report.battle_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          reports: [],
          summary: { count: 0, total_coins: 0, total_cells: 0, total_shards: 0 }
        };
      }
      groups[monthKey].reports.push(report);
      groups[monthKey].summary.count += 1;
      groups[monthKey].summary.total_coins += report.coin_earned;
      groups[monthKey].summary.total_cells += report.cells_earned;
      groups[monthKey].summary.total_shards += report.reroll_shards_earned;
    });
    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredReports]);

  const totalCount = filteredReports.length;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> 기록 보관소
          <span className="text-sm font-normal text-slate-500 ml-2">
            (총 {totalCount}개)
          </span>
        </h2>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="기록 검색..." 
              className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full md:w-72 transition-all" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
            )}
          </div>

          <button
            onClick={() => setSearchTerm(prev => prev === '토너' ? '' : '토너')}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-full text-xs transition-all whitespace-nowrap shadow-sm ${
              searchTerm === '토너' 
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Trophy size={14} className={searchTerm === '토너' ? "text-yellow-400" : "text-yellow-500"} />
            <span className="font-medium">토너</span>
          </button>
        </div>
      </div>

      {!searchTerm && (
        <div className="mb-6">
           <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>모든 기록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {recentReports.length > 0 && !searchTerm && (
            <div className="animate-fade-in mb-8">
              <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                 <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                 최근 7일 기록
              </div>
              <ReportList 
                reports={recentReports} 
                onSelectReport={handleSelectReport}
                hideHeader={true}
                collapseThresholdDays={0}
              />
            </div>
          )}

          <div>
            {!searchTerm && <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
                월별 기록
            </div>}
            
            {monthlyGroups.map((group) => (
               <HistoryMonthGroup 
                 key={group.monthKey}
                 group={group}
                 isExpanded={expandedMonths.has(group.monthKey) || !!searchTerm}
                 onToggle={toggleMonth}
                 onSelectReport={handleSelectReport}
               />
            ))}
          </div>

          {!isLoading && totalCount === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
              <p>기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}