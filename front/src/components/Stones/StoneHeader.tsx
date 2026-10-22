/**
 * 파일명: thetower/front/src/components/Stones/StoneHeader.tsx
 * 용도: 스톤 계산기 페이지(StonesPage) 상단 스티키 헤더 및 탭 네비게이션 컴포넌트
 * 기능: 총 사용 스톤 표시, 5개 기본 탭 + Plan 탭 전환, 계획 담기 핀 토글, Reset / Save & Summary 제어
 */
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box, List, RotateCcw, ClipboardList, Pin } from 'lucide-react';
import { formatNum } from './StoneShared';

export type StoneTabType = 'unlock' | 'base' | 'plus' | 'card' | 'module' | 'plan';

interface Props {
  token: string | null;
  activeTab: StoneTabType;
  setActiveTab: (tab: StoneTabType) => void;
  totalStonesUsed: number;
  tabStonesUsed: Record<string, number>;
  totalPlanStones: number;
  planStepsCount: number;
  isPlanMode: boolean;
  setIsPlanMode: (val: boolean) => void;
  isAllBaseUnlocked: boolean;
  unlockedBaseCount: number;
  totalWeaponsCount: number;
  isProgressChanged: boolean;
  isSaving: boolean;
  onNavigateBack: () => void;
  onResetAll: () => void;
  onSaveAndSummary: () => void;
}

const MAIN_TABS = [
  { id: 'unlock', icon: Lock, label: 'Unlock' },
  { id: 'base', icon: Zap, label: 'Base Stats' },
  { id: 'plus', icon: PlusCircle, label: 'UW+ Stats' },
  { id: 'card', icon: Layers, label: 'Cards' },
  { id: 'module', icon: Box, label: 'Modules' },
] as const;

export default function StoneHeader({
  token,
  activeTab,
  setActiveTab,
  totalStonesUsed,
  tabStonesUsed,
  totalPlanStones,
  planStepsCount,
  isPlanMode,
  setIsPlanMode,
  isAllBaseUnlocked,
  unlockedBaseCount,
  totalWeaponsCount,
  isProgressChanged,
  isSaving,
  onNavigateBack,
  onResetAll,
  onSaveAndSummary,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sticky top-0 bg-slate-950/90 backdrop-blur-md py-3 z-20 border-b border-slate-800 gap-4">
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onNavigateBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
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

        {/* 모바일용 요약 버튼 */}
        <button
          onClick={onSaveAndSummary}
          className="md:hidden p-2 text-cyan-400 hover:bg-slate-800 rounded-full border border-cyan-500/30 bg-cyan-500/10 disabled:opacity-50"
          disabled={isSaving}
        >
          <List size={20} />
        </button>
      </div>

      {/* 탭 네비게이션 및 액션 버튼 */}
      <div className="flex items-center gap-3 self-stretch md:self-auto">
        {/* 모바일 탭 레이아웃 (3행) */}
        <div className="md:hidden flex flex-col gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-1">
          {/* 1행: Unlock, Plan */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('unlock')}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'unlock' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium"><Lock size={13} /> Unlock</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'unlock' ? 'text-yellow-400' : 'text-slate-400'}`}>
                {formatNum(tabStonesUsed['unlock'] || 0)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'plan' ? 'bg-purple-900/40 text-purple-200 shadow-sm border border-purple-500/50' : 'text-purple-400 hover:text-purple-200'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium"><ClipboardList size={13} /> Plan</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'plan' ? 'text-purple-300' : 'text-slate-400'}`}>
                {formatNum(totalPlanStones)}
              </span>
            </button>
          </div>
          {/* 2행: Base Stats, UW+ Stats */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('base')}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'base' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium"><Zap size={13} /> Base Stats</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'base' ? 'text-yellow-400' : 'text-slate-400'}`}>
                {formatNum(tabStonesUsed['base'] || 0)}
              </span>
            </button>
            <button
              onClick={() => {
                if (isAllBaseUnlocked) setActiveTab('plus');
              }}
              disabled={!isAllBaseUnlocked}
              title={!isAllBaseUnlocked ? `Requires all Ultimate Weapons (${unlockedBaseCount}/${totalWeaponsCount})` : undefined}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                !isAllBaseUnlocked
                  ? 'opacity-40 cursor-not-allowed text-slate-600 border border-slate-800/80'
                  : activeTab === 'plus'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">{!isAllBaseUnlocked ? <Lock size={13} /> : <PlusCircle size={13} />} UW+ Stats</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'plus' ? 'text-yellow-400' : 'text-slate-400'}`}>
                {formatNum(tabStonesUsed['plus'] || 0)}
              </span>
            </button>
          </div>
          {/* 3행: Cards, Modules */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'card' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium"><Layers size={13} /> Cards</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'card' ? 'text-yellow-400' : 'text-slate-400'}`}>
                {formatNum(tabStonesUsed['card'] || 0)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('module')}
              className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'module' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium"><Box size={13} /> Modules</span>
              <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'module' ? 'text-yellow-400' : 'text-slate-400'}`}>
                {formatNum(tabStonesUsed['module'] || 0)}
              </span>
            </button>
          </div>
        </div>

        {/* 데스크톱 기본 5개 탭 레이아웃 (1행) */}
        <div className="hidden md:flex flex-wrap gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-1 justify-start">
          {MAIN_TABS.map(tab => {
            const isTabDisabled = tab.id === 'plus' && !isAllBaseUnlocked;
            const Icon = isTabDisabled ? Lock : tab.icon;
            const stones = tabStonesUsed[tab.id] || 0;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isTabDisabled) setActiveTab(tab.id);
                }}
                disabled={isTabDisabled}
                title={isTabDisabled ? `Requires all Ultimate Weapons (${unlockedBaseCount}/${totalWeaponsCount})` : `${tab.label}: ${formatNum(stones)} Stones`}
                className={`px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 flex-none min-w-[80px] border ${
                  isTabDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-600 border-slate-800/80'
                    : activeTab === tab.id
                      ? 'bg-slate-800 text-white shadow-sm border-slate-700'
                      : 'text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </div>
                <span className={`text-sm font-mono font-bold leading-tight ${
                  activeTab === tab.id ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {formatNum(stones)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 데스크톱 Plan 탭 영역 (기존 Reset 자리의 남는 공간에 배치: 위 Plan / 아래 예상 스톤 개수) */}
        <div className="hidden md:flex items-stretch gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('plan')}
            title={`Plan (${planStepsCount} Steps): ${formatNum(totalPlanStones)} Stones`}
            className={`px-4 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 min-w-[96px] border ${
              activeTab === 'plan'
                ? 'bg-purple-900/40 text-purple-200 shadow-sm border-purple-500/50'
                : 'text-purple-400 hover:text-purple-200 border-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <ClipboardList size={13} />
              <span>Plan</span>
            </div>
            <span className={`text-sm font-mono font-bold leading-tight ${
              activeTab === 'plan' ? 'text-purple-300' : 'text-slate-400'
            }`}>
              {formatNum(totalPlanStones)}
            </span>
          </button>

          {/* 계획 담기 모드 빠른 핀 토글 (로그인 시에만 표시) */}
          {token && (
            <button
              onClick={() => setIsPlanMode(!isPlanMode)}
              className={`px-2 rounded-lg transition-all flex items-center justify-center border ${
                isPlanMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/30'
                  : 'bg-purple-500/10 text-purple-400 border-transparent hover:border-purple-500/30 hover:bg-purple-500/20'
              }`}
              title={isPlanMode ? '계획 담기 모드 끄기' : '계획 담기 모드 켜기 (각 탭에서 클릭 시 계획표에 추가)'}
            >
              <Pin size={14} className={isPlanMode ? 'fill-white' : ''} />
            </button>
          )}
        </div>

        {/* 데스크톱 우측 액션 버튼 2단 배치 (1단: Reset / 2단: Save & Summary) */}
        <div className="hidden md:flex flex-col gap-1 min-w-[148px]">
          {token && (
            <button
              onClick={onResetAll}
              className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all font-bold text-xs"
              title="Reset All Progress"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          <button
            onClick={onSaveAndSummary}
            className={`flex items-center justify-center gap-1.5 px-3 ${token ? 'py-1 text-xs' : 'py-2 text-sm'} rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isSaving}
          >
            <List size={token ? 13 : 16} /> {!token ? 'Summary' : isSaving ? 'Saving...' : (isProgressChanged ? 'Save & Summary*' : 'Save & Summary')}
          </button>
        </div>
      </div>
    </div>
  );
}
