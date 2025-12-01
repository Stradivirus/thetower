import { Calendar, Search } from 'lucide-react';
import type { BattleMain } from '../types/report';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';

interface MainPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function MainPage({ reports, onSelectReport }: MainPageProps) {
  
  return (
    <>
      {/* 1. 상단 통계 대시보드 */}
      <Dashboard reports={reports} />

      {/* 2. 검색 및 타이틀 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> 전투 기록
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="메모 검색..." 
            className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600 w-64" 
          />
        </div>
      </div>

      {/* 3. 리스트 */}
      <ReportList reports={reports} onSelectReport={onSelectReport} />
    </>
  );
}