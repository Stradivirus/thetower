import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Trophy, Loader2, LayoutList, FolderOpen, Filter, StickyNote } from 'lucide-react';
import type { BattleMain } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getAllReports } from '../api/reports';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import HistoryMonthGroup from '../components/History/HistoryMonthGroup';

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

// 3단 필터 타입 정의
type TournamentFilterMode = 'all' | 'include' | 'exclude';

export default function HistoryPage() {
  const navigate = useNavigate();
  
  const [allReports, setAllReports] = useState<BattleMain[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  
  // 뷰 모드 및 필터 상태
  const [viewMode, setViewMode] = useState<'group' | 'list'>('group');
  
  // 토너먼트 필터 (all -> include -> exclude 순환)
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilterMode>('all');
  const [onlyMemo, setOnlyMemo] = useState(false);
  
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

  // 토너먼트 버튼 클릭 핸들러 (순환 로직)
  const cycleTournamentFilter = () => {
    setTournamentFilter(prev => {
      if (prev === 'all') return 'include';
      if (prev === 'include') return 'exclude';
      return 'all';
    });
  };

  // 통합 필터링 로직
  const filteredReports = useMemo(() => {
    let result = allReports;

    // 1. 텍스트 검색
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.notes?.toLowerCase().includes(lower) || 
        r.killer?.toLowerCase().includes(lower) || 
        r.tier?.toLowerCase().includes(lower) ||
        r.battle_date.includes(searchTerm)
      );
    }

    // 2. 토너먼트 필터 (3단)
    if (tournamentFilter === 'include') {
      result = result.filter(r => r.notes?.includes('토너'));
    } else if (tournamentFilter === 'exclude') {
      result = result.filter(r => !r.notes?.includes('토너'));
    }

    // 3. 메모만 보기
    if (onlyMemo) {
      result = result.filter(r => r.notes && r.notes.trim().length > 0);
    }

    return result;
  }, [allReports, searchTerm, tournamentFilter, onlyMemo]);

  // 최근 7일 데이터 (필터 없을 때만)
  const recentReports = useMemo(() => {
    // 필터가 하나라도 걸려있으면 최근 기록 섹션 숨김
    if (searchTerm || tournamentFilter !== 'all' || onlyMemo || viewMode === 'list') return [];
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return filteredReports.filter(r => new Date(r.battle_date) >= oneWeekAgo);
  }, [filteredReports, searchTerm, tournamentFilter, onlyMemo, viewMode]);

  // 월별 그룹화 (리스트 모드일 땐 계산 생략)
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
  
  // [수정 1] !!searchTerm을 사용하여 boolean 타입으로 강제 변환 (타입 에러 해결)
  const isFilterActive = !!searchTerm || tournamentFilter !== 'all' || onlyMemo;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> 기록 보관소
          <span className="text-sm font-normal text-slate-500 ml-2">
            (총 {totalCount}개)
          </span>
        </h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* 검색창 */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="기록 검색..." 
              className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 w-full transition-all" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {/* 뷰 모드 토글 */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                    onClick={() => setViewMode('group')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'group' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="월별 그룹 보기"
                >
                    <FolderOpen size={16} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    title="전체 리스트 보기"
                >
                    <LayoutList size={16} />
                </button>
            </div>

            <div className="w-px h-8 bg-slate-800 mx-1"></div>

            {/* 토너먼트 3단 버튼 */}
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
                  {tournamentFilter === 'include' ? '토너만' : 
                   tournamentFilter === 'exclude' ? '토너 제외' : '토너 필터'}
                </span>
            </button>

            {/* [수정 2] 메모만 보기 버튼 클릭 시 -> 리스트 뷰로 자동 전환 */}
            <button
                onClick={() => {
                   const nextOnlyMemo = !onlyMemo;
                   setOnlyMemo(nextOnlyMemo);
                   // 메모 필터를 켜는 순간, 사용자가 편하게 볼 수 있도록 리스트 뷰로 전환
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
                <span>메모만</span>
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
          <p>모든 기록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 그룹 뷰 */}
          {viewMode === 'group' && (
              <>
                {recentReports.length > 0 && !isFilterActive && (
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
                    {!isFilterActive && <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
                        월별 기록
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

          {/* 리스트 뷰 */}
          {viewMode === 'list' && (
              <div className="animate-fade-in">
                  <div className="text-xs font-bold text-slate-500 mb-3 px-1 flex items-center gap-2">
                        <Filter size={12} />
                        전체 리스트 보기 ({filteredReports.length})
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
              <p>조건에 맞는 기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}