import { useState } from 'react';
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box, List, RotateCcw } from 'lucide-react';
import UnlockTab from '../components/Stones/UnlockTab';
import UwStatsTab from '../components/Stones/UwStatsTab';
import CardTab from '../components/Stones/CardTab';
import ModuleTab from '../components/Stones/ModuleTab';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { formatNum } from '../components/Stones/StoneShared';
import { useStonesData } from '../hooks/useStonesData'; 

interface Props {
  onBack: () => void;
  token: string | null;
}

type TabType = 'unlock' | 'base' | 'plus' | 'card' | 'module';

export default function StonesPage({ onBack, token }: Props) {
  // UI 관련 상태는 여전히 여기서 관리
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [selectedUw, setSelectedUw] = useState<string>('death_wave');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // [Optimization] 데이터 로직은 훅에서 한 방에 가져옴
  const {
    progress,
    // [Fix] modulesState 안쓰므로 제거
    totalStonesUsed,
    isSaving,
    isProgressChanged,
    updateProgress,
    updateBatch,
    resetCards,
    resetAll,
    saveToServer
  } = useStonesData(token);

  // 저장 및 요약 핸들러 (UI 로직)
  const handleSaveAndSummary = async () => {
    if (isProgressChanged && token) {
      await saveToServer();
    }
    setIsSummaryOpen(true);
  };

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
                  {isProgressChanged && <span className="text-rose-400 ml-2 font-bold">(Unsaved Changes)</span>}
              </div>
            </h1>
          </div>

          <button 
            onClick={handleSaveAndSummary}
            className="md:hidden p-2 text-cyan-400 hover:bg-slate-800 rounded-full border border-cyan-500/30 bg-cyan-500/10 disabled:opacity-50"
            disabled={isSaving}
          >
            <List size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
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

          <button 
            onClick={resetAll}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all font-bold text-sm"
            title="Reset All Progress"
          >
            <RotateCcw size={16} /> Reset
          </button>

          <button 
            onClick={handleSaveAndSummary}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || !token}
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
        
        {(activeTab === 'base' || activeTab === 'plus') && (
          <UwStatsTab 
            category={activeTab} 
            progress={progress} 
            updateProgress={updateProgress} 
            selectedUw={selectedUw} 
            onSelectUw={setSelectedUw} 
          />
        )}
        
        {activeTab === 'card' && <CardTab progress={progress} updateProgress={updateProgress} resetCards={resetCards} />}
        {activeTab === 'module' && <ModuleTab progress={progress} updateProgress={updateProgress} />}
      </div>

      {/* [Fix] modulesState prop 제거 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />
    </div>
  );
}