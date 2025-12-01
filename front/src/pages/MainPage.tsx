import { Calendar, Search } from 'lucide-react';
import type { BattleMain } from '../types/report';
import styles from './MainPage.module.css';
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
      <div className={styles.searchBarSection}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> 전투 기록
        </h2>
        <div className="relative">
          <Search className={styles.searchIcon} size={16} />
          <input 
            type="text" 
            placeholder="메모 검색..." 
            className={styles.searchInput} 
          />
        </div>
      </div>

      {/* 3. 리스트 */}
      <ReportList reports={reports} onSelectReport={onSelectReport} />
    </>
  );
}