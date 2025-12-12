// front/src/pages/HistoryPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Calendar, ChevronDown, ChevronUp, Loader2, Zap, Layers } from 'lucide-react';
import type { BattleMain, MonthlySummary } from '../types/report';
import type { WeeklyStatsResponse } from '../api/reports'; 
import { getWeeklyStats, getHistoryView, getReportsByMonth } from '../api/reports';
import ReportList from '../components/Main/ReportList';
import WeeklyStatsChart from '../components/History/WeeklyStatsChart';
import { formatNumber } from '../utils/format';

export default function HistoryPage() {
  const navigate = useNavigate();
  
  const [recentReports, setRecentReports] = useState<BattleMain[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsResponse | null>(null);
  
  const [monthlyDetails, setMonthlyDetails] = useState<Record<string, BattleMain[]>>({});
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [viewData, statsData] = await Promise.all([
          getHistoryView(),
          getWeeklyStats()
        ]);
        
        setRecentReports(viewData.recent_reports);
        setMonthlySummaries(viewData.monthly_summaries);
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

  const toggleMonth = async (monthKey: string) => {
    const isExpanding = !expandedMonths.has(monthKey);

    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });

    if (isExpanding && !monthlyDetails[monthKey]) {
      setLoadingMonths(prev => new Set(prev).add(monthKey));
      try {
        const data = await getReportsByMonth(monthKey);
        setMonthlyDetails(prev => ({ ...prev, [monthKey]: data }));
      } catch (err) {
        console.error("Failed to load monthly reports", err);
      } finally {
        setLoadingMonths(prev => {
          const next = new Set(prev);
          next.delete(monthKey);
          return next;
        });
      }
    }
  };

  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  const totalCount = recentReports.length + monthlySummaries.reduce((acc, cur) => acc + cur.count, 0);

  // [Optimization] useMemo로 검색 필터링 캐싱
  const filteredRecent = useMemo(() => {
    if (!searchTerm) return recentReports;
    const lower = searchTerm.toLowerCase();
    return recentReports.filter(r => 
      r.notes?.toLowerCase().includes(lower) || 
      r.killer?.toLowerCase().includes(lower) ||
      r.tier?.toLowerCase().includes(lower)
    );
  }, [recentReports, searchTerm]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> 기록 보관소
          <span className="text-sm font-normal text-slate-500 ml-2">
            (총 {totalCount}개)
          </span>
        </h2>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="최근 기록 검색..." 
            className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full md:w-72 transition-all" 
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>
          )}
        </div>
      </div>

      {!searchTerm && (
        <WeeklyStatsChart data={weeklyStats} loading={isLoading} />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>기록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {filteredRecent.length > 0 && (
            <div className="animate-fade-in mb-6">
              <div className="text-xs font-bold text-slate-500 mb-2 px-1">최근 7일 기록</div>
              <ReportList 
                reports={filteredRecent} 
                onSelectReport={handleSelectReport}
                hideHeader={true}
                collapseThresholdDays={0}
              />
            </div>
          )}

          <div>
            {monthlySummaries.map((summary) => {
                const isExpanded = expandedMonths.has(summary.month_key);
                const isLoadingMonth = loadingMonths.has(summary.month_key);
                
                let details = monthlyDetails[summary.month_key] || [];
                if (searchTerm) {
                  const lower = searchTerm.toLowerCase();
                  details = details.filter(r => 
                    r.notes?.toLowerCase().includes(lower) || 
                    r.killer?.toLowerCase().includes(lower) ||
                    r.tier?.toLowerCase().includes(lower)
                  );
                }

                if (searchTerm && details.length === 0 && !isExpanded) return null;

                return (
                  <div key={summary.month_key} className="mb-4 animate-fade-in">
                    <button
                      onClick={() => toggleMonth(summary.month_key)}
                      className="w-full flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-3 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-white font-medium flex items-center gap-2">
                          <Calendar size={16} className="text-slate-500" />
                          {formatMonthKey(summary.month_key)}
                        </span>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                            {summary.count} Games
                          </span>
                          <div className="h-4 w-px bg-slate-800"></div>
                          
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(summary.total_coins)}</span>
                          </span>

                          <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                            <Zap size={14} className="text-cyan-500"/>
                            <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(summary.total_cells)}</span>
                          </span>

                          <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                            <Layers size={14} className="text-green-500"/> 
                            <span className="text-green-500 font-mono font-bold text-base">{formatNumber(summary.total_shards)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-500 group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-2 md:pl-4 border-l-2 border-slate-800 ml-4">
                        {isLoadingMonth ? (
                           <div className="py-4 text-center text-slate-500 flex justify-center items-center gap-2">
                             <Loader2 size={16} className="animate-spin text-blue-500"/> 상세 기록을 가져오는 중입니다...
                           </div>
                        ) : (
                           <ReportList 
                             reports={details} 
                             onSelectReport={handleSelectReport}
                             hideHeader={true}
                             collapseThresholdDays={0}
                           />
                        )}
                        {!isLoadingMonth && details.length === 0 && (
                          <div className="py-2 text-sm text-slate-600 px-2">
                            표시할 기록이 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {!isLoading && totalCount === 0 && (
            <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
              <p>보관된 기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}