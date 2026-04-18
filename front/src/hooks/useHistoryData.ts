/**
 * 파일명: thetower/front/src/hooks/useHistoryData.ts
 * 용도: 히스토리 페이지의 데이터 로딩, 필터링 및 통계 계산 로직 관리 (커스텀 훅)
 * 기능: 전체 리포트/주간 통계 로드, 월별 및 최근 7일 데이터 그룹화, 다양한 필터 상태 관리
 */
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { BattleMain } from '../types/report';
import type { MonthlyGroup, TournamentFilterMode } from '../types/history';
import { getWeeklyStats } from '../api/reports';
import type { WeeklyStatsResponse } from '../api/reports';
import { useReports } from '../contexts/ReportContext';

export function useHistoryData() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { reports: allReports, isLoading: reportsLoading } = useReports();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // 상태 관리: 뷰 모드, 필터, 확장 여부
  const [viewMode, setViewMode] = useState<'group' | 'list'>('group');
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilterMode>('all');
  const [onlyMemo, setOnlyMemo] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const tierFilter = searchParams.get('tier');

  // 데이터 초기 로드
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const statsData = await getWeeklyStats();
        setWeeklyStats(statsData);
      } catch (error) {
        console.error("Failed to load history stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  const isLoading = reportsLoading || statsLoading;

  // 티어 필터 시 자동 리스트 모드 전환
  useEffect(() => {
    if (tierFilter) setViewMode('list');
  }, [tierFilter]);

  /** 특정 월 토글 핸들러 */
  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  /** 토너먼트 필터 순환 핸들러 */
  const cycleTournamentFilter = () => {
    setTournamentFilter(prev => {
      if (prev === 'all') return 'include';
      if (prev === 'include') return 'exclude';
      return 'all';
    });
  };

  /** 리포트 상세 이동 핸들러 */
  const handleSelectReport = (date: string) => {
    navigate(`/report/${date}`);
  };

  /** 모든 필터가 적용된 리포트 목록 */
  const filteredReports = useMemo(() => {
    let result = allReports;
    if (tournamentFilter === 'include') {
      result = result.filter(r => r.notes?.includes('토너'));
    } else if (tournamentFilter === 'exclude') {
      result = result.filter(r => !r.notes?.includes('토너'));
    }
    if (onlyMemo) {
      result = result.filter(r => r.notes && r.notes.trim().length > 0);
    }
    if (tierFilter) {
      result = result.filter(r => String(r.tier) === tierFilter);
    }
    return result;
  }, [allReports, tournamentFilter, onlyMemo, tierFilter]);

  /** 최근 7일 그룹 데이터 계산 */
  const recentGroup = useMemo((): MonthlyGroup | null => {
    if (tournamentFilter !== 'all' || onlyMemo || tierFilter || viewMode === 'list') return null;
    
    // 오늘 포함 7일 전 00:00:00 설정 (예: 21일이면 15일 00시부터)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6); 
    
    const recent = filteredReports.filter(r => new Date(r.battle_date) >= startDate);
    
    if (recent.length === 0) return null;

    const summary = { count: 0, total_coins: 0, total_cells: 0, total_shards: 0, avg_coins_per_game: 0, avg_coins_per_day: 0 };
    const uniqueDays = new Set<string>();
    recent.forEach(r => {
      summary.count += 1;
      summary.total_coins += r.coin_earned;
      summary.total_cells += r.cells_earned;
      summary.total_shards += r.reroll_shards_earned;
      uniqueDays.add(r.battle_date.split('T')[0]);
    });
    summary.avg_coins_per_game = Math.round(summary.total_coins / summary.count);
    summary.avg_coins_per_day = Math.round(summary.total_coins / uniqueDays.size);

    return { monthKey: 'recent', reports: recent, summary };
  }, [filteredReports, tournamentFilter, onlyMemo, tierFilter, viewMode]);

  /** 월별 그룹 데이터 계산 */
  const monthlyGroups = useMemo(() => {
    if (viewMode === 'list') return [];

    const groups: Record<string, { 
        monthKey: string, reports: BattleMain[], 
        summary: { count: number, total_coins: number, total_cells: number, total_shards: number },
        uniqueDays: Set<string>
    }> = {};

    filteredReports.forEach(report => {
      const date = new Date(report.battle_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey, reports: [],
          summary: { count: 0, total_coins: 0, total_cells: 0, total_shards: 0 },
          uniqueDays: new Set()
        };
      }
      groups[monthKey].reports.push(report);
      groups[monthKey].summary.count += 1;
      groups[monthKey].summary.total_coins += report.coin_earned;
      groups[monthKey].summary.total_cells += report.cells_earned;
      groups[monthKey].summary.total_shards += report.reroll_shards_earned;
      groups[monthKey].uniqueDays.add(report.battle_date.split('T')[0]);
    });

    return Object.values(groups).map(g => ({
        monthKey: g.monthKey, reports: g.reports,
        summary: {
            ...g.summary,
            avg_coins_per_game: Math.round(g.summary.total_coins / g.summary.count),
            avg_coins_per_day: Math.round(g.summary.total_coins / g.uniqueDays.size)
        }
    })).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredReports, viewMode]);

  return {
    isLoading,
    weeklyStats,
    viewMode, setViewMode,
    tournamentFilter, cycleTournamentFilter,
    onlyMemo, setOnlyMemo,
    tierFilter, searchParams, setSearchParams,
    expandedMonths, toggleMonth,
    handleSelectReport,
    filteredReports,
    recentGroup,
    monthlyGroups,
    totalCount: filteredReports.length,
    isFilterActive: tournamentFilter !== 'all' || onlyMemo || !!tierFilter
  };
}
