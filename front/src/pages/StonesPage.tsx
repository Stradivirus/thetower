import { useState, useEffect } from 'react';
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box, List } from 'lucide-react'; // List 아이콘 추가
import UnlockTab from '../components/Stones/UnlockTab';
import UwStatsTab from '../components/Stones/UwStatsTab';
import CardTab from '../components/Stones/CardTab';
import ModuleTab from '../components/Stones/ModuleTab';
import UwSummaryModal from '../components/Stones/UwSummaryModal'; // [New] 모달 임포트
import baseStats from '../data/uw_base_stats.json';
import plusStats from '../data/uw_plus_stats.json';

interface Props {
  onBack: () => void;
}

type TabType = 'unlock' | 'base' | 'plus' | 'card' | 'module';

export default function StonesPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [selectedUw, setSelectedUw] = useState<string>('death_wave'); // [New] 상태 Lift
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false); // [New] 모달 상태

  useEffect(() => {
    const saved = localStorage.getItem('thetower_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const updateProgress = (key: string, level: number) => {
    const newProgress = { ...progress, [key]: level };
    setProgress(newProgress);
    localStorage.setItem('thetower_progress', JSON.stringify(newProgress));
  };

  const resetCards = () => {
    const newProg = { ...progress };
    Object.keys(newProg).forEach(k => { if(k.startsWith('card_')) delete newProg[k]; });
    setProgress(newProg);
    localStorage.setItem('thetower_progress', JSON.stringify(newProg));
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
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Triangle className="text-green-400 fill-green-400/20" size={20} /> Resource Costs
            </h1>
          </div>

          {/* [New] 모바일에서도 접근 가능한 요약 버튼 (Base/Plus 탭일 때만 표시) */}
          {(activeTab === 'base' || activeTab === 'plus') && (
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="md:hidden p-2 text-cyan-400 hover:bg-slate-800 rounded-full border border-cyan-500/30 bg-cyan-500/10"
            >
              <List size={20} />
            </button>
          )}
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

          {/* [New] 데스크탑용 요약 버튼 (Base/Plus 탭일 때만 표시) */}
          {(activeTab === 'base' || activeTab === 'plus') && (
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-bold text-sm"
            >
              <List size={16} /> Summary
            </button>
          )}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        {activeTab === 'unlock' && <UnlockTab progress={progress} updateProgress={updateProgress} />}
        
        {/* [Updated] Pass selectedUw and setter */}
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

      {/* [New] 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        uwName={selectedUw}
        statsData={activeTab === 'base' ? (baseStats as any)[selectedUw] : activeTab === 'plus' ? (plusStats as any)[selectedUw] : null}
        progress={progress}
        category={activeTab === 'base' ? 'base' : 'plus'}
      />
    </div>
  );
}