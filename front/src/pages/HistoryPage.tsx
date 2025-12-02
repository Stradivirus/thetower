import { useState, useMemo } from 'react';
import { Archive, Search, X } from 'lucide-react';
import type { BattleMain } from '../types/report';
import ReportList from '../components/Main/ReportList';

interface HistoryPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function HistoryPage({ reports, onSelectReport }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 필터링 로직
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    
    const lowerTerm = searchTerm.toLowerCase();
    
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
  }, [reports, searchTerm]);

  return (
    <>
      {/* 헤더 & 검색창 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 animate-fade-in">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Archive className="text-slate-500" /> 기록 보관소
          <span className="text-sm font-normal text-slate-500 ml-2">
            (총 {filteredReports.length}개)
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

      {/* [수정] hideHeader={true} 전달 */}
      {filteredReports.length > 0 ? (
        <ReportList 
          reports={filteredReports} 
          onSelectReport={onSelectReport} 
          hideHeader={true} 
        />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-fade-in">
          <p>보관된 기록이 없습니다.</p>
        </div>
      )}
    </>
  );
}