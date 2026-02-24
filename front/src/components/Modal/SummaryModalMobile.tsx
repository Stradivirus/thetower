/**
 * 모바일 전용 요약 모달
 * - 상단 헤더 고정
 * - 탭으로 "모듈" / "카드+궁무" 전환
 */
import { useState } from 'react';
import { X, Puzzle, Trophy } from 'lucide-react';
import SummaryModules from './SummaryModules';
import { SummaryCards } from './SummaryCards';
import { SummaryWeapons } from './SummaryWeapons';
import useEscKey from '../../hooks/useEscKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  progress: Record<string, any>;
}

type TabKey = 'modules' | 'cardsWeapons';

export default function SummaryModalMobile({ isOpen, onClose, progress }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('modules');

  useEscKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md">
      {/* 상단 헤더 */}
      <header className="relative flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/90">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            SUMMARY
          </span>
          <span className="text-sm font-bold text-slate-100">
            Build overview
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-slate-200 hover:bg-slate-700 active:bg-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </header>

      {/* 탭 스위처 */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-900 bg-slate-950/90">
        <div className="flex gap-2 rounded-full bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'modules'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Puzzle size={14} />
            <span>Modules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cardsWeapons')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'cardsWeapons'
                ? 'bg-purple-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Trophy size={14} />
            <span>Cards &amp; UW</span>
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 custom-scrollbar">
        {activeTab === 'modules' ? (
          <div className="space-y-3">
            <SummaryModules />
          </div>
        ) : (
          <div className="space-y-4">
            <SummaryCards progress={progress} />
            <SummaryWeapons progress={progress} />
          </div>
        )}
      </div>
    </div>
  );
}

