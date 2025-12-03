import { useState, useMemo } from 'react';
import { Archive, Search, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { BattleMain } from '../types/report';
import ReportList from '../components/Main/ReportList';
import { formatNumber } from '../utils/format';


interface HistoryPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function HistoryPage({ reports, onSelectReport }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // 리포트를 최근/월별로 분류
  const categorizedReports = useMemo(() => {
    const now = new Date();
    // [Modified] 2주(14일) -> 1주(7일)로 변경
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recent: BattleMain[] = [];
    const byMonth: Map<string, BattleMain[]> = new Map();
    
    reports.forEach(report => {
      const reportDate = new Date(report.battle_date);
      
      // [Modified] 비교 기준을 oneWeekAgo로 변경
      if (reportDate > oneWeekAgo) {
        recent.push(report);
      } else {
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth.has(monthKey)) {
          byMonth.set(monthKey, []);
        }
        byMonth.get(monthKey)!.push(report);
      }
    });
    
    return { recent, byMonth };
  }, [reports]);

  // 검색 필터링
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return categorizedReports;
    
    const lowerTerm = searchTerm.toLowerCase();
    
    const filterReports = (reports: BattleMain[]) => {
      return reports.filter(report => {
        const noteMatch = report.notes?.toLowerCase().includes(lowerTerm);
        const killerMatch = report.killer?.toLowerCase().includes(lowerTerm);
        const tierMatch = report.tier?.toLowerCase().includes(lowerTerm);
        
        const dateObj = new Date(report.battle_date);
        const dateStrKr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
        const dateStrSlash = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        
        const dateMatch = dateStrKr.includes(lowerTerm) || dateStrSlash.includes(lowerTerm);
        
        return noteMatch || killerMatch || tierMatch || dateMatch;
      });
    };

    const filteredRecent = filterReports(categorizedReports.recent);
    const filteredByMonth = new Map<string, BattleMain[]>();
    
    categorizedReports.byMonth.forEach((reports, monthKey) => {
      const filtered = filterReports(reports);
      if (filtered.length > 0) {
        filteredByMonth.set(monthKey, filtered);
      }
    });

    return { recent: filteredRecent, byMonth: filteredByMonth };
  }, [categorizedReports, searchTerm]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  const totalCount = filteredData.recent.length + 
    Array.from(filteredData.byMonth.values()).reduce((sum, reports) => sum + reports.length, 0);

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

      {/* [Modified] 최근 1주: 날짜별 아코디언 */}
      {filteredData.recent.length > 0 && (
        <div className="mb-8">
          <ReportList 
            reports={filteredData.recent} 
            onSelectReport={onSelectReport}
            hideHeader={true}
            collapseThresholdDays={3}
          />
        </div>
      )}

      {/* 월별 아카이브 (1주 이상) */}
      {Array.from(filteredData.byMonth.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([monthKey, monthReports]) => {
          const isExpanded = expandedMonths.has(monthKey);
          
          // 월별 합계 계산
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
                    <div className="h-4 w-px bg-slate-800"></div>
                    <span className="text-yellow-500 font-mono font-bold">
                        {formatNumber(totalCoins)} Coins
                    </span>
                    <span className="text-cyan-500 font-mono font-bold">
                      {formatNumber(totalCells)} Cells
                    </span>
                    <span className="text-green-500 font-mono font-bold">
                      {formatNumber(totalShards)} Shards
                    </span>
                  </div>
                </div>

                <div className="text-slate-500 group-hover:text-white transition-colors">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              {/* 월별 펼쳤을 때: 날짜별 아코디언으로 표시 */}
              {isExpanded && (
                <div className="mt-2 pl-4">
                  <ReportList 
                    reports={monthReports} 
                    onSelectReport={onSelectReport}
                    hideHeader={true}
                    collapseThresholdDays={0}
                  />
                </div>
              )}
            </div>
          );
        })}

      {totalCount === 0 && (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
          <p>보관된 기록이 없습니다.</p>
        </div>
      )}
    </>
  );
}