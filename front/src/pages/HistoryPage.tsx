// src/pages/HistoryPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Calendar, ChevronDown, ChevronUp, Loader2, Zap, Trophy } from 'lucide-react';
import type { BattleMain } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getAllReports } from '../api/reports'; // [Modified] getAllReports 사용
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import { formatNumber } from '../utils/format';

// 월별 그룹 데이터 타입 정의
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

export default function HistoryPage() {
  const navigate = useNavigate();
  
  // [Modified] 전체 리포트 데이터를 저장
  const [allReports, setAllReports] = useState<BattleMain[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  
  // UI 상태
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 데이터 로드 (페이지 진입 시 한 번에 전체 로드)
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

  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  // 2. 검색 필터링 (전체 데이터 대상)
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

  // 3. 최근 7일 데이터 분리 (검색 없을 때만 표시)
  const recentReports = useMemo(() => {
    if (searchTerm) return []; // 검색 중일 땐 최근 기록 섹션 숨김 (월별 리스트에서 확인)
    
    // 최근 7일 기준 계산
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0); // 시간 초기화
    
    return filteredReports.filter(r => new Date(r.battle_date) >= oneWeekAgo);
  }, [filteredReports, searchTerm]);

  // 4. 월별 그룹화 및 통계 계산 (핵심 로직: 클라이언트에서 직접 그룹핑)
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

    // 최신 월이 위로 오도록 정렬
    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredReports]);


  // 총 개수
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
        
        {/* 검색 및 필터 버튼 영역 */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="기록 검색 (전체 기간)..." 
              className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full md:w-72 transition-all" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
            )}
          </div>

          <button
            onClick={() => setSearchTerm('토너')}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-full text-xs transition-all whitespace-nowrap shadow-sm ${
              searchTerm === '토너' 
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="토너먼트 기록만 보기"
          >
            <Trophy size={14} className={searchTerm === '토너' ? "text-yellow-400" : "text-yellow-500"} />
            <span className="font-medium">토너</span>
          </button>
        </div>
      </div>

      {!searchTerm && (
        <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>모든 기록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 최근 7일 기록 (검색 중이 아닐 때만 표시) */}
          {recentReports.length > 0 && !searchTerm && (
            <div className="animate-fade-in mb-6">
              <div className="text-xs font-bold text-slate-500 mb-2 px-1">최근 7일 기록</div>
              <ReportList 
                reports={recentReports} 
                onSelectReport={handleSelectReport}
                hideHeader={true}
                collapseThresholdDays={0}
              />
            </div>
          )}

          {/* 월별 아카이브 (검색 결과도 여기 포함됨) */}
          <div>
            {monthlyGroups.map((group) => {
                // 검색 중일 때는 사용자가 결과를 바로 보고 싶어 하므로 자동으로 펼쳐줍니다.
                const isExpanded = expandedMonths.has(group.monthKey) || !!searchTerm; 
                
                return (
                  <div key={group.monthKey} className="mb-4 animate-fade-in">
                    <button
                      onClick={() => toggleMonth(group.monthKey)}
                      className="w-full flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-3 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-white font-medium flex items-center gap-2">
                          <Calendar size={16} className="text-slate-500" />
                          {formatMonthKey(group.monthKey)}
                        </span>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                            {group.summary.count} Games
                          </span>
                          
                          {/* 모바일에서는 숨기고 PC에서만 보이게 하거나, 공간 부족시 조정 */}
                          <div className="hidden sm:flex items-center gap-4">
                            <div className="h-4 w-px bg-slate-800"></div>
                            
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(group.summary.total_coins)}</span>
                            </span>

                            <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                              <Zap size={14} className="text-cyan-500"/>
                              <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(group.summary.total_cells)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-500 group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-2 md:pl-4 border-l-2 border-slate-800 ml-4">
                         <ReportList 
                           reports={group.reports} 
                           onSelectReport={handleSelectReport}
                           hideHeader={true}
                           collapseThresholdDays={0}
                         />
                      </div>
                    )}
                  </div>
                );
              })}
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