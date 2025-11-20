import { useState } from 'react';
import ReportManager from './components/ReportManager.tsx';
import ReportDetail from './components/ReportDetail.tsx';

export default function App() {
  const [view, setView] = useState<'manager' | 'detail'>('manager');
  const [selectedBattleDate, setSelectedBattleDate] = useState<string | null>(null);

  const handleSelectReport = (battleDate: string) => {
    setSelectedBattleDate(battleDate);
    setView('detail');
  };

  const handleBackToManager = () => {
    setSelectedBattleDate(null);
    setView('manager');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="text-center py-6 bg-white shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-900">
          The Tower <span className="text-blue-600">전투 기록 분석</span>
        </h1>
        <p className="text-gray-500 mt-1">
          FastAPI & React & PostgreSQL 기반 리포트 대시보드
        </p>
      </header>
      
      <main>
        {view === 'manager' ? (
          <ReportManager onSelectReport={handleSelectReport} />
        ) : selectedBattleDate ? (
          <ReportDetail 
            battleDate={selectedBattleDate} 
            onBack={handleBackToManager} 
          />
        ) : null}
      </main>
      
      <footer className="text-center text-sm text-gray-500 py-4 border-t">
        &copy; 2025 The Tower Report Analyzer
      </footer>
    </div>
  );
}