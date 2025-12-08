import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Calendar, ChevronDown, ChevronUp, Loader2, Zap, Layers, TrendingUp, TrendingDown } from 'lucide-react';
import type { BattleMain } from '../types/report';
import ReportList from '../components/Main/ReportList';
import { formatNumber } from '../utils/format';
import { getHistoryReports } from '../api/reports';

// [New] 증감률 표시 컴포넌트
const TrendIndicator = ({ current, previous }: { current: number, previous: number }) => {
  if (!previous || previous === 0) return null;
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  const isPositive = diff > 0;
  if (diff === 0) return null;

  return (
    <span className={`text-[10px] font-bold ml-1.5 flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-rose-400'}`}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<BattleMain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await getHistoryReports(0, 1000);
        setReports(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSelectReport = (date: string) => {
    navigate(`/report/${date}`);
  };

  const { recentWeekReports, monthlyGroups } = useMemo(() => {
    const now = new Date();
    // 10일 전 자정 계산
    const historyListLimit = new Date(now);
    historyListLimit.setDate(now.getDate() - 10); 
    historyListLimit.setHours(0, 0, 0, 0);

    const lowerTerm = searchTerm.toLowerCase();

    const isMatch = (r: BattleMain) => {
      if (!lowerTerm) return true;
      const noteMatch = r.notes?.toLowerCase().includes(lowerTerm);
      const killerMatch = r.killer?.toLowerCase().includes(lowerTerm);
      const tierMatch = r.tier?.toLowerCase().includes(lowerTerm);
      const dateObj = new Date(r.battle_date);
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      return noteMatch || killerMatch || tierMatch || dateStr.includes(lowerTerm);
    };

    const recent: BattleMain[] = [];
    const monthlyMap = new Map<string, { monthKey: string, coins: number, cells: number, shards: number, count: number, reports: BattleMain[] }>();

    reports.forEach(report => {
      if (!isMatch(report)) return;

      const reportDate = new Date(report.battle_date);
      
      // 1. 최근 10일치 리스트
      if (reportDate >= historyListLimit) {
        recent.push(report);
      } else {
        // 2. 월별 집계
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { monthKey, coins: 0, cells: 0, shards: 0, count: 0, reports: [] });
        }
        const data = monthlyMap.get(monthKey)!;
        data.coins += report.coin_earned;
        data.cells += report.cells_earned;
        data.shards += report.reroll_shards_earned;
        data.count += 1;
        data.reports.push(report);
      }
    });

    // 월별 데이터 정렬 (최신순)
    const sortedMonths = Array.from(monthlyMap.values())
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    // 전월 대비 증감률 계산을 위해 데이터 가공
    const finalMonthlyGroups = sortedMonths.map((group, index) => {
        const prevMonth = sortedMonths[index + 1]; // 다음 인덱스 = 더 과거 달
        return {
            ...group,
            prevCoins: prevMonth ? prevMonth.coins : 0,
            prevCells: prevMonth ? prevMonth.cells : 0
        };
    });

    return { recentWeekReports: recent, monthlyGroups: finalMonthlyGroups };
  }, [reports, searchTerm]);

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

  const totalCount = recentWeekReports.length + 
    monthlyGroups.reduce((sum, g) => sum + g.count, 0);

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
            placeholder="과거 기록 검색..." 
            className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full md:w-72 transition-all" 
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
          <p>과거 기록을 불러오는 중입니다...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. 최근 10일치 리스트 */}
          {recentWeekReports.length > 0 && (
            <div className="animate-fade-in mb-6">
              <ReportList 
                reports={recentWeekReports} 
                onSelectReport={handleSelectReport}
                hideHeader={true}
                collapseThresholdDays={0}
              />
            </div>
          )}

          {/* 2. 월별 아카이브 (증감률 추가) */}
          <div>
            {monthlyGroups.map((group) => {
                const isExpanded = expandedMonths.has(group.monthKey);
                
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
                            {group.count} Games
                          </span>
                          <div className="h-4 w-px bg-slate-800"></div>
                          
                          {/* Coins + Trend */}
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-yellow-500 font-mono font-bold text-base">{formatNumber(group.coins)}</span>
                            <TrendIndicator current={group.coins} previous={group.prevCoins} />
                          </span>

                          {/* Cells + Trend */}
                          <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                            <Zap size={14} className="text-cyan-500"/>
                            <span className="text-cyan-500 font-mono font-bold text-base">{formatNumber(group.cells)}</span>
                            <TrendIndicator current={group.cells} previous={group.prevCells} />
                          </span>

                          {/* Shards */}
                          <span className="flex items-center gap-1.5 text-slate-400 ml-2">
                            <Layers size={14} className="text-green-500"/> 
                            <span className="text-green-500 font-mono font-bold text-base">{formatNumber(group.shards)}</span>
                          </span>
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
              <p>보관된 기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}