import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, X, Calendar, ChevronDown, ChevronUp, Loader2, Layers } from 'lucide-react';
import type { BattleMain } from '../types/report';
import ReportList from '../components/Main/ReportList';
import { formatNumber } from '../utils/format';
import { getHistoryReports } from '../api/reports';

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
    
    // [Fix 1] 메인(3일) + 리스트(7일) = 총 10일 전까지는 리스트로 보여줌
    // 시간차 등을 고려해 넉넉하게 10일 전으로 설정
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
    const monthly: Map<string, BattleMain[]> = new Map();

    reports.forEach(report => {
      if (!isMatch(report)) return;

      const reportDate = new Date(report.battle_date);
      
      // 10일 이내 데이터는 리스트로 (백엔드에서 이미 3일 전 데이터부터 옴)
      if (reportDate >= historyListLimit) {
        recent.push(report);
      } else {
        // 그 이전 데이터는 월별로 묶음
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly.has(monthKey)) {
          monthly.set(monthKey, []);
        }
        monthly.get(monthKey)!.push(report);
      }
    });

    return { recentWeekReports: recent, monthlyGroups: monthly };
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
    Array.from(monthlyGroups.values()).reduce((sum, list) => sum + list.length, 0);

  return (
    <>
      {/* 헤더 & 검색창 */}
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
          
          {/* 1. 최근 7일치 리스트 (3일 제외한 나머지) */}
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

          {/* 2. 월별 아카이브 */}
          <div>
            {Array.from(monthlyGroups.entries())
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([monthKey, monthReports]) => {
                const isExpanded = expandedMonths.has(monthKey);
                
                const totalGames = monthReports.length;
                const totalCoins = monthReports.reduce((sum, r) => sum + r.coin_earned, 0);
                const totalCells = monthReports.reduce((sum, r) => sum + r.cells_earned, 0);
                const totalShards = monthReports.reduce((sum, r) => sum + r.reroll_shards_earned, 0);
                
                return (
                  <div key={monthKey} className="mb-4 animate-fade-in">
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 border border-slate-800 rounded-lg px-4 py-3 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-white font-medium flex items-center gap-2">
                          <Calendar size={16} className="text-slate-500" />
                          {formatMonthKey(monthKey)}
                        </span>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 font-medium">
                            {totalGames} Games
                          </span>
                          
                          <div className="hidden sm:block h-4 w-px bg-slate-800"></div>
                          
                          <span className="hidden sm:inline text-yellow-500 font-mono font-bold">
                              {formatNumber(totalCoins)} Coins
                          </span>
                          
                          <span className="hidden sm:inline text-cyan-500 font-mono font-bold">
                            {formatNumber(totalCells)} Cells
                          </span>

                          {/* [Fix 2] 샤드(Shards) 표시 추가 */}
                          <span className="hidden sm:inline text-green-500 font-mono font-bold flex items-center gap-1">
                            {formatNumber(totalShards)} Shards
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
                          reports={monthReports} 
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