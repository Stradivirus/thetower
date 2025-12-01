import { useState, useEffect } from 'react';
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box } from 'lucide-react';
import UnlockTab from '../components/Stones/UnlockTab';
import UwStatsTab from '../components/Stones/UwStatsTab';
import CardTab from '../components/Stones/CardTab';
import ModuleTab from '../components/Stones/ModuleTab';

interface Props {
  onBack: () => void;
}

type TabType = 'unlock' | 'base' | 'plus' | 'card' | 'module';

export default function StonesPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [progress, setProgress] = useState<Record<string, number>>({});

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
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Triangle className="text-green-400 fill-green-400/20" size={20} /> Resource Costs
          </h1>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-stretch md:self-auto">
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
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        {activeTab === 'unlock' && <UnlockTab progress={progress} updateProgress={updateProgress} />}
        {activeTab === 'base' && <UwStatsTab category="base" progress={progress} updateProgress={updateProgress} />}
        {activeTab === 'plus' && <UwStatsTab category="plus" progress={progress} updateProgress={updateProgress} />}
        {activeTab === 'card' && <CardTab progress={progress} updateProgress={updateProgress} resetCards={resetCards} />}
        {activeTab === 'module' && <ModuleTab progress={progress} updateProgress={updateProgress} />}
      </div>
    </div>
  );
}