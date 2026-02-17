/**
 * 파일명: thetower/front/src/pages/HistoryPage.tsx
 * 용도: 과거 전투 기록 관리 및 성과 분석 페이지
 * 기능: 일간/주간/월간 성장 차트 표시, 월별 기록 그룹화, 다양한 필터링(토너먼트, 메모, 티어) 기능
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, Trophy, Loader2, LayoutList, FolderOpen, Filter, StickyNote, X } from 'lucide-react';
import type { BattleMain } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getAllReports } from '../api/reports';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import HistoryMonthGroup from '../components/History/HistoryMonthGroup';
import { T } from '../locales'; 

/** 
 * 월별 그룹화된 데이터 인터페이스 
 */
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
  const [searchParams, setSearchParams] = useSearchParams();
  const Text = T.history; 
  
  const [allReports, setAllReports] = useState<BattleMain[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  
  // 뷰 모드 및 필터 상태
  const [viewMode, setViewMode] = useState<'group' | 'list'>('group');
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilterMode>('all');
  const [onlyMemo, setOnlyMemo] = useState(false);
  
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // URL 쿼리 파라미터에서 티어 필터 추출 (위젯 연동용)
  const tierFilter = searchParams.get('tier');

  // 초기 데이터 로드 (전체 리포트 및 주간 통계)
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

  // 티어 필터가 활성화되면 자동으로 리스트 보기 모드로 전환하여 가독성 확보
  useEffect(() => {
    if (tierFilter) {
      setViewMode('list');
    }
  }, [tierFilter]);

  /** 리포트 상세 페이지로 이동 */
  const handleSelectReport = (date: string) => {
    navigate(`/report/${date}`);
  };

  /** 특정 월의 그룹 접기/펼치기 토글 */
  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  /** 토너먼트 필터 순환 전환 (전체 -> 포함 -> 제외) */
  const cycleTournamentFilter = () => {
    setTournamentFilter(prev => {
      if (prev === 'all') return 'include';
      if (prev === 'include') return 'exclude';
      return 'all';
    });
  };

  /** 
   * 설정된 모든 필터를 적용하여 표시할 리포트 목록 계산
   */
  const filteredReports = useMemo(() => {
    let result = allReports;

    // 1. 토너먼트 키워드 필터
    if (tournamentFilter === 'include') {
      result = result.filter(r => r.notes?.includes('토너'));
    } else if (tournamentFilter === 'exclude') {
      result = result.filter(r => !r.notes?.includes('토너'));
    }

    // 2. 메모 존재 여부 필터
    if (onlyMemo) {
      result = result.filter(r => r.notes && r.notes.trim().length > 0);
    }

    // 3. 티어 필터
    if (tierFilter) {
      result = result.filter(r => String(r.tier) === tierFilter);
    }

    return result;
  }, [allReports, tournamentFilter, onlyMemo, tierFilter]);

  /** 
   * '최근 7일' 섹션에 표시할 데이터 필터링
   * - 필터가 활성화되어 있거나 리스트 모드일 때는 표시하지 않음
   */
  const recentReports = useMemo(() => {
    if (tournamentFilter !== 'all' || onlyMemo || tierFilter || viewMode === 'list') return [];
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    return filteredReports.filter(r => new Date(r.battle_date) >= oneWeekAgo);
  }, [filteredReports, tournamentFilter, onlyMemo, tierFilter, viewMode]);

  /** 
   * 데이터를 월별(YYYY-MM)로 그룹화 및 요약 정보 계산
   */
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
  const isFilterActive = tournamentFilter !== 'all' || onlyMemo || !!tierFilter;

  return (
    <>
      {/* 페이지 헤더 및 필터 컨트롤 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> {Text.PAGE.TITLE}
          <span className="text-sm font-normal text-slate-500 ml-2">
            {Text.PAGE.TOTAL_COUNT.replace('{n}', String(totalCount))}
          </span>
        </h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar ml-auto">
            
            {/* 티어 필터 활성화 배지 */}
            {tierFilter && (
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 rounded-lg px-3 py-1.5 mr-2">
                    <span className="text-blue-400 text-xs font-bold">Tier {tierFilter}</span>
                    <button 
                        onClick={() => {
                            searchParams.delete('tier');
                            setSearchParams(searchParams);
                        }}
                        className="text-blue-400 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* 뷰 모드 전환 버튼 (그룹 / 리스트) */}
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

            {/* 토너먼트 필터 버튼 */}
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

            {/* 메모 있는 기록만 보기 버튼 */}
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

      {/* 성장 분석 차트 (필터 미적용 및 그룹 뷰일 때만 표시) */}
      {!isFilterActive && viewMode === 'group' && (
        <div className="mb-6">
           <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
        </div>
      )}

      {/* 데이터 표시 영역 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>{Text.PAGE.LOADING}</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 그룹 뷰 모드 */}
          {viewMode === 'group' && (
              <>
                {/* 최근 7일 상세 기록 섹션 */}
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

                {/* 월별 기록 그룹 섹션 */}
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

          {/* 전체 리스트 뷰 모드 */}
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

          {/* 검색 결과 없음 안내 */}
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