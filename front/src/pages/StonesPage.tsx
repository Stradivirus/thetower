import { useState, useEffect } from 'react';
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box, List, RotateCcw } from 'lucide-react';
import UnlockTab from '../components/Stones/UnlockTab';
import UwStatsTab from '../components/Stones/UwStatsTab';
import CardTab from '../components/Stones/CardTab';
import ModuleTab from '../components/Stones/ModuleTab';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { fetchProgress, saveProgress } from '../api/progress';
import { formatNum } from '../components/Stones/StoneShared';
import { useTotalStones } from '../utils/stoneCalculations';

interface Props {
  onBack: () => void;
  token: string | null;
}

type TabType = 'unlock' | 'base' | 'plus' | 'card' | 'module';

export default function StonesPage({ onBack, token }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [selectedUw, setSelectedUw] = useState<string>('death_wave');
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [lastSavedProgress, setLastSavedProgress] = useState<Record<string, any>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modulesState, setModulesState] = useState<Record<string, any>>({}); // [New] 모듈 상태 추가

  const totalStonesUsed = useTotalStones(progress);

  // 1. 초기 데이터 로드 (서버 동기화 및 로컬 스토리지)
  useEffect(() => {
    const loadData = async () => {
      let dataToLoad: Record<string, any> = {};

      if (token) {
        try {
          const serverData = await fetchProgress(token);
          if (serverData && typeof serverData === 'object') {
            dataToLoad = serverData;
          }
        } catch (e) {
          console.error("Failed to fetch progress", e);
        }
      }

      const saved = localStorage.getItem('thetower_progress');
      if (Object.keys(dataToLoad).length === 0 && saved) {
        try {
          dataToLoad = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved progress", e);
        }
      }
      
      setProgress(dataToLoad);
      setLastSavedProgress(dataToLoad);
      
      // [New] 모듈 데이터 로드
      const localModules = localStorage.getItem('thetower_modules');
      if (localModules) {
        try {
          setModulesState(JSON.parse(localModules));
        } catch (e) {
          console.error("Failed to parse modules", e);
        }
      }

      // [New] 서버에서 모듈 데이터 로드 (로그인 시)
      if (token) {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/modules/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.modules_json) {
            setModulesState(response.modules_json);
            localStorage.setItem('thetower_modules', JSON.stringify(response.modules_json));
          }
        } catch (e) {
          console.error("Failed to fetch modules", e);
        }
      }
    };
    
    loadData();
  }, [token]);

  // 2. 상태 업데이트 & 자동 저장 (로컬 저장 유지)
  const updateProgress = (key: string, value: any) => {
    const newProgress = { ...progress, [key]: value };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  // 일괄 업데이트 (리셋 기능 등에서 사용)
  const updateBatch = (updates: Record<string, any>) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  // 카드 리셋
  const resetCards = () => {
    const newProg = { ...progress };
    Object.keys(newProg).forEach(k => { if(k.startsWith('card_')) delete newProg[k]; });
    setProgress(newProg);
    setLastSavedProgress(newProg); 
    localStorage.setItem('thetower_progress', JSON.stringify(newProg));
  };

  // 전체 리셋
  const resetAll = () => {
    setProgress({});
    setLastSavedProgress({});
    localStorage.removeItem('thetower_progress');
    if (token) saveProgress({});
  };

  // progress가 lastSavedProgress와 다른지 확인
  const isProgressChanged = JSON.stringify(progress) !== JSON.stringify(lastSavedProgress);

  // [NEW] 요약 모달 열기 전용 핸들러
  const handleSummary = () => {
    setIsSummaryOpen(true);
  }

  // [NEW] 저장 전용 핸들러
  const handleSaveProgress = async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!isProgressChanged) {
        console.log("Progress is unchanged, skipping server save.");
        return;
    }

    setIsSaving(true);
    saveProgress(progress)
      .then(() => {
        console.log("Progress saved successfully in the background.");
        setLastSavedProgress(progress);
      })
      .catch((e) => {
        alert("백그라운드 저장 실패. 로그인 상태를 확인하거나 다시 시도해주세요.");
        console.error("Save failed:", e);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // [NEW] 데스크톱용: 저장 후 요약 모달 열기
  const handleSaveAndSummary = async () => {
    // 변경 사항이 있다면 저장 로직 실행
    if (isProgressChanged && token) {
      await handleSaveProgress();
    }
    // 요약 모달은 항상 엽니다.
    handleSummary();
  }

  const tabs = [
    { id: 'unlock', icon: Lock, label: 'Unlock' },
    { id: 'base', icon: Zap, label: 'Base Stats' },
    { id: 'plus', icon: PlusCircle, label: 'UW+ Stats' },
    { id: 'card', icon: Layers, label: 'Cards' },
    { id: 'module', icon: Box, label: 'Modules' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sticky top-0 bg-slate-950/90 backdrop-blur-md py-3 z-20 border-b border-slate-800 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                  <Triangle className="text-green-400 fill-green-400/20" size={20} /> 
                  <span className="text-xl">Stone Costs</span>
              </div>
              <div className="text-xs text-slate-400 font-medium ml-7 flex items-center gap-1">
                  Total Stones Used: 
                  <span className="text-yellow-400 font-bold font-mono ml-1">{formatNum(totalStonesUsed)}</span>
                  {/* 변경 상태 표시 */}
                  {isProgressChanged && <span className="text-rose-400 ml-2 font-bold">(Unsaved Changes)</span>}
              </div>
            </h1>
          </div>

          {/* 모바일 저장 및 요약 버튼 */}
          <button 
            onClick={handleSaveAndSummary} // 데스크톱과 동일하게 저장 + 요약 실행
            className="md:hidden p-2 text-cyan-400 hover:bg-slate-800 rounded-full border border-cyan-500/30 bg-cyan-500/10 disabled:opacity-50"
            disabled={isSaving} // 요약은 항상 가능하지만, 저장 중일 때는 비활성화
          >
            <List size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          {/* 탭 메뉴 */}
          <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-1 justify-center md:justify-start">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
              >
                <tab.icon size={14}/> {tab.label}
              </button>
            ))}
          </div>

          {/* 전체 초기화 버튼 */}
          <button 
            onClick={resetAll}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all font-bold text-sm"
            title="Reset All Progress"
          >
            <RotateCcw size={16} /> Reset
          </button>

          {/* 데스크탑 저장 및 요약 버튼 */}
          <button 
            onClick={handleSaveAndSummary}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || !token} // 저장 중이거나 토큰이 없으면 비활성화 (요약 기능은 항상 활성화)
          >
            <List size={16} /> {isSaving ? '저장 중...' : (isProgressChanged ? '저장 및 요약*' : '저장 및 요약')}
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        {activeTab === 'unlock' && (
          <UnlockTab 
            progress={progress} 
            updateProgress={updateProgress} 
            updateBatch={updateBatch} 
          />
        )}
        
        {activeTab === 'base' && (
          <UwStatsTab 
            category="base" 
            progress={progress} 
            updateProgress={updateProgress} 
            selectedUw={selectedUw} 
            onSelectUw={setSelectedUw} 
          />
        )}
        
        {activeTab === 'plus' && (
          <UwStatsTab 
            category="plus" 
            progress={progress} 
            updateProgress={updateProgress} 
            selectedUw={selectedUw} 
            onSelectUw={setSelectedUw} 
          />
        )}
        
        {activeTab === 'card' && <CardTab progress={progress} updateProgress={updateProgress} resetCards={resetCards} />}
        {activeTab === 'module' && <ModuleTab progress={progress} updateProgress={updateProgress} />}
      </div>

      {/* 통합 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
        modulesState={modulesState} // [Modified] 실제 모듈 데이터 전달
      />
    </div>
  );
}