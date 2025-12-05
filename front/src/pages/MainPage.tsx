import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // [Added]
import { Calendar, Search, X, List } from 'lucide-react';
import type { BattleMain } from '../types/report';
import Dashboard from '../components/Main/Dashboard';
import ReportList from '../components/Main/ReportList';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { fetchProgress } from '../api/progress';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';

interface MainPageProps {
  reports: BattleMain[];
  // onSelectReport prop 제거됨 (내부에서 처리)
}

export default function MainPage({ reports }: MainPageProps) {
  const navigate = useNavigate(); // [Added]
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{progress: any, modules: any}>({ progress: {}, modules: {} });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 리포트 클릭 시 상세 페이지로 이동
  const handleSelectReport = (date: string) => {
    navigate(`/report/${date}`);
  };

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

  const handleOpenSummary = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    setLoadingSummary(true);
    try {
        const [prog, modRes] = await Promise.all([
            fetchProgress().catch(() => ({})),
            fetchWithAuth(`${API_BASE_URL}/modules/`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            }).catch(() => null)
        ]);

        let modData = {};
        if (modRes && modRes.ok) {
            const json = await modRes.json();
            modData = json.modules_json || {};
        }

        setSummaryData({
            progress: prog,
            modules: modData
        });
        setIsSummaryOpen(true);
    } catch (e) {
        console.error("Failed to load summary data", e);
        alert("데이터를 불러오는데 실패했습니다.");
    } finally {
        setLoadingSummary(false);
    }
  };

  return (
    <>
      <Dashboard reports={reports} />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-slate-500" /> 전투 기록
          <span className="text-sm font-normal text-slate-500 ml-2">
            (총 {filteredReports.length}개)
          </span>
        </h2>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메모, 티어, 킬러, 날짜..." 
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

          <button 
            onClick={handleOpenSummary}
            disabled={loadingSummary}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all border text-sm bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 whitespace-nowrap"
            title="내 궁극 무기 및 모듈 세팅 보기"
          >
            {loadingSummary ? (
                <span className="animate-pulse">Loading...</span>
            ) : (
                <>
                    <List size={16} /> 
                    <span className="hidden sm:inline">궁무 및 모듈</span>
                </>
            )}
          </button>
        </div>
      </div>

      {filteredReports.length > 0 ? (
        <ReportList reports={filteredReports} onSelectReport={handleSelectReport} />
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={summaryData.progress}
        modulesState={summaryData.modules}
      />
    </>
  );
}