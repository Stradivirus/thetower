import { useState, useMemo } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import type { BattleMain } from '../types/report';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';

interface MainPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function MainPage({ reports, onSelectReport }: MainPageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어에 따라 리스트 필터링
  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    
    const lowerTerm = searchTerm.toLowerCase(); // 대소문자 무시
    
    return reports.filter(report => {
      // 1. 기존 검색 (메모, 처치자, 티어)
      const noteMatch = report.notes?.toLowerCase().includes(lowerTerm);
      const killerMatch = report.killer?.toLowerCase().includes(lowerTerm);
      const tierMatch = report.tier?.toLowerCase().includes(lowerTerm);
      
      // 2. [New] 날짜 검색 추가
      const dateObj = new Date(report.battle_date);
      // 포맷 A: "11월 30일" 형태 (한글 검색 지원)
      const dateStrKr = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
      // 포맷 B: "11/30" 형태 (슬래시 검색 지원)
      const dateStrSlash = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      const dateMatch = dateStrKr.includes(lowerTerm) || dateStrSlash.includes(lowerTerm);
      
      return noteMatch || killerMatch || tierMatch || dateMatch;
    });
  }, [reports, searchTerm]);

  return (
    <>
      {/* 1. 상단 통계 대시보드 (전체 데이터 기준) */}
      <Dashboard reports={reports} />

      {/* 2. 검색 및 타이틀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> 전투 기록
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
            // [수정] placeholder에 날짜 예시 추가
            placeholder="메모, 티어, 킬러, 날짜(11, 11/30)" 
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

      {/* 3. 리스트 (필터링된 데이터 전달) */}
      {filteredReports.length > 0 ? (
        <ReportList reports={filteredReports} onSelectReport={onSelectReport} />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </>
  );
}