import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Trophy, Loader2, LayoutList, FolderOpen, Filter, StickyNote } from 'lucide-react';
import type { BattleMain } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getAllReports } from '../api/reports';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import HistoryMonthGroup from '../components/History/HistoryMonthGroup';
import { T } from '../locales'; // 언어팩

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

type TournamentFilterMode = 'all' | 'include' | 'exclude';

export default function HistoryPage() {
  const navigate = useNavigate();
  const Text = T.history; // 언어팩
  
  const [allReports, setAllReports] = useState<BattleMain[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  
  const [viewMode, setViewMode] = useState<'group' | 'list'>('group');
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilterMode>('all');
  const [onlyMemo, setOnlyMemo] = useState(false);
  
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const cycleTournamentFilter = () => {
    setTournamentFilter(prev => {
      if (prev === 'all') return 'include';
      if (prev === 'include') return 'exclude';
      return 'all';
    });
  };

  const filteredReports = useMemo(() => {
    let result = allReports;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.notes?.toLowerCase().includes(lower) || 
        r.killer?.toLowerCase().includes(lower) || 
        r.tier?.toLowerCase().includes(lower) ||
        r.battle_date.includes(searchTerm)
      );
    }

    if (tournamentFilter === 'include') {
      result = result.filter(r => r.notes?.includes('토너'));
    } else if (tournamentFilter === 'exclude') {
      result = result.filter(r => !r.notes?.includes('토너'));
    }

    if (onlyMemo) {
      result = result.filter(r => r.notes && r.notes.trim().length > 0);
    }

    return result;
  }, [allReports, searchTerm, tournamentFilter, onlyMemo]);

  const recentReports = useMemo(() => {
    if (searchTerm || tournamentFilter !== 'all' || onlyMemo || viewMode === 'list') return [];
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return filteredReports.filter(r => new Date(r.battle_date) >= oneWeekAgo);
  }, [filteredReports, searchTerm, tournamentFilter, onlyMemo, viewMode]);

  const monthlyGroups = useMemo(() => {
    if (viewMode === 'list') return [];

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
  }, [filteredReports, viewMode]);

  const totalCount = filteredReports.length;
  const isFilterActive = !!searchTerm || tournamentFilter !== 'all' || onlyMemo;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> {Text.PAGE.TITLE}
          <span className="text-sm font-normal text-slate-500 ml-2">
            {Text.PAGE.TOTAL_COUNT.replace('{n}', String(totalCount))}
          </span>
        </h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={Text.PAGE.SEARCH_PLACEHOLDER} 
              className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 w-full transition-all" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                    onClick={() => setViewMode('group')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'group' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title={Text.PAGE.TOOLTIP_GROUP}
                >
                    <FolderOpen size={16} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title={Text.PAGE.TOOLTIP_LIST}
                >
                    <LayoutList size={16} />
                </button>
            </div>

            <div className="w-px h-8 bg-slate-800 mx-1"></div>

            <button
                onClick={cycleTournamentFilter}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs transition-all whitespace-nowrap shadow-sm min-w-[90px] justify-center ${
                  tournamentFilter === 'include' 
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
                    : tournamentFilter === 'exclude'
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                }`}
            >
                <Trophy size={14} className={
                  tournamentFilter === 'include' ? "text-yellow-400" : 
                  tournamentFilter === 'exclude' ? "text-rose-400" : "text-slate-500"
                } />
                <span className="font-medium">
                  {tournamentFilter === 'include' ? Text.FILTER.TOURNAMENT_ONLY : 
                   tournamentFilter === 'exclude' ? Text.FILTER.TOURNAMENT_EXCLUDE : Text.FILTER.TOURNAMENT_ALL}
                </span>
            </button>

            <button
                onClick={() => {
                   const nextOnlyMemo = !onlyMemo;
                   setOnlyMemo(nextOnlyMemo);
                   if (nextOnlyMemo) {
                     setViewMode('list');
                   }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs transition-all whitespace-nowrap shadow-sm ${
                onlyMemo
                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                }`}
            >
                <StickyNote size={14} className={onlyMemo ? "text-blue-400" : "text-slate-500"} />
                <span>{Text.FILTER.MEMO_ONLY}</span>
            </button>
          </div>
        </div>
      </div>

      {!isFilterActive && viewMode === 'group' && (
        <div className="mb-6">
           <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>{Text.PAGE.LOADING}</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {viewMode === 'group' && (
              <>
                {recentReports.length > 0 && !isFilterActive && (
                    <div className="animate-fade-in mb-8">
                    <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        {Text.SECTION.RECENT_7DAYS}
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
                    {!isFilterActive && <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
                        {Text.SECTION.MONTHLY}
                    </div>}
                    
                    {monthlyGroups.map((group) => (
                    <HistoryMonthGroup 
                        key={group.monthKey}
                        group={group}
                        isExpanded={expandedMonths.has(group.monthKey) || isFilterActive}
                        onToggle={toggleMonth}
                        onSelectReport={handleSelectReport}
                    />
                    ))}
                </div>
              </>
          )}

          {viewMode === 'list' && (
              <div className="animate-fade-in">
                  <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <Filter size={12} />
                        {Text.SECTION.ALL_LIST.replace('{n}', String(filteredReports.length))}
                  </div>
                  <ReportList 
                      reports={filteredReports} 
                      onSelectReport={handleSelectReport}
                      hideHeader={false}
                      collapseThresholdDays={Infinity} 
                  />
              </div>
          )}

          {!isLoading && totalCount === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
              <p>{Text.PAGE.EMPTY_RESULT}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}