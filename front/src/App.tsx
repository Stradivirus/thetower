import { useState } from 'react';
import ReportForm from './components/ReportForm.tsx'; // 확장자 명시
import ReportList from './components/ReportList.tsx'; // 확장자 명시
import ReportDetail from './components/ReportDetail.tsx'; // 확장자 명시

// 메인 앱 컴포넌트
export default function App() {
  // 현재 화면 상태를 관리합니다: 'form', 'list', 'detail'
  const [view, setView] = useState<'form' | 'list' | 'detail'>('form');
  // 상세 보기할 보고서의 battle_date (Primary Key)를 저장합니다.
  const [selectedBattleDate, setSelectedBattleDate] = useState<string | null>(null);
  // 보고서 목록 새로고침을 위한 트리거입니다. Form 제출 성공 시 숫자를 증가시킵니다.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 보고서 제출 성공 시 호출되어 목록을 새로고침하고 목록 뷰로 전환합니다.
  const handleReportSubmitSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setView('list');
  };
  
  // 보고서 목록에서 항목 클릭 시 호출되어 상세 뷰로 전환합니다.
  const handleSelectReport = (battleDate: string) => {
    setSelectedBattleDate(battleDate);
    setView('detail');
  };

  // 상세 뷰에서 목록으로 돌아갈 때 호출됩니다.
  const handleBackToList = () => {
    setSelectedBattleDate(null);
    setView('list');
  };

  // 현재 뷰에 따라 적절한 컴포넌트를 렌더링합니다.
  const renderView = () => {
    switch (view) {
      case 'form':
        return (
          <>
            <ReportForm onSuccess={handleReportSubmitSuccess} />
            <div className="mt-8 text-center">
              <button 
                onClick={() => setView('list')} 
                className="px-6 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                전투 기록 목록 보기 →
              </button>
            </div>
          </>
        );
      case 'list':
        return (
          <>
            <ReportList 
              onSelectReport={handleSelectReport} 
              refreshTrigger={refreshTrigger} 
            />
            <div className="mt-8 text-center">
              <button 
                onClick={() => setView('form')} 
                className="px-6 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← 보고서 새로 입력하기
              </button>
            </div>
          </>
        );
      case 'detail':
        // selectedBattleDate가 null일 때를 대비한 안전 장치
        if (!selectedBattleDate) {
          setView('list'); 
          return null;
        }
        return (
          <ReportDetail 
            battleDate={selectedBattleDate} 
            onBack={handleBackToList} 
          />
        );
      default:
        return <ReportForm onSuccess={handleReportSubmitSuccess} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="text-center mb-10 p-4 bg-white shadow-md rounded-lg">
        <h1 className="text-4xl font-extrabold text-gray-900">
          The Tower <span className="text-blue-600">전투 기록 분석</span>
        </h1>
        <p className="text-gray-500 mt-1">
          FastAPI & React & PostgreSQL 기반 리포트 대시보드
        </p>
      </header>
      
      <main className="pb-10">
        {renderView()}
      </main>
      
      <footer className="text-center text-sm text-gray-500 mt-10 p-4 border-t">
        &copy; 2025 The Tower Report Analyzer
      </footer>
    </div>
  );
}