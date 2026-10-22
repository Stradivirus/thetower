/**
 * 파일명: thetower/front/src/pages/StonesPage.tsx
 * 용도: 게임 재화인 '스톤(Stones)'의 총 사용량 계산 및 관리 페이지
 * 기능: UW 해금/스탯, 카드, 모듈 등 각 카테고리별 스톤 소모량 계산 및 서버 동기화
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Triangle, Lock, Zap, PlusCircle, Layers, Box, List, RotateCcw, ClipboardList, Pin, Save } from 'lucide-react';
import UnlockTab from '../components/Stones/UnlockTab';
import UwStatsTab from '../components/Stones/UwStatsTab';
import CardTab from '../components/Stones/CardTab';
import ModuleTab from '../components/Stones/ModuleTab';
import PlanTab from '../components/Stones/PlanTab';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { formatNum } from '../components/Stones/StoneShared';
import { useStonesData } from '../hooks/useStonesData'; 
import baseStats from '../data/uw_base_stats.json';

interface Props {
  token: string | null;
}

// 탭 종류 타입 정의
type TabType = 'unlock' | 'base' | 'plus' | 'card' | 'module' | 'plan';

export default function StonesPage({ token }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('unlock');
  const [selectedUw, setSelectedUw] = useState<string>('death_wave'); // 선택된 궁극 무기
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // 전용 커스텀 훅을 통한 상태 및 로직 주입
  const {
    progress,
    displayProgress,
    totalStonesUsed,
    tabStonesUsed,
    isPlanMode,
    setIsPlanMode,
    evaluatedItems,
    totalPlanStones,
    movePlanItem,
    removePlanItem,
    completePlanItem,
    clearPlan,
    isSaving,
    isProgressChanged,
    isPlanChanged,
    updateProgress,
    updateBatch,
    resetCards,
    resetAll,
    saveToServer
  } = useStonesData(token);

  const allWeaponKeys = Object.keys(baseStats);
  const unlockedBaseCount = Array.isArray(displayProgress['unlocked_weapons']) ? displayProgress['unlocked_weapons'].length : 0;
  const isAllBaseUnlocked = unlockedBaseCount === allWeaponKeys.length;

  // 기본 무기가 9종 미만으로 초기화되면 UW+ Stats 탭에서 자동으로 Unlock 탭으로 전환
  useEffect(() => {
    if (activeTab === 'plus' && !isAllBaseUnlocked) {
      setActiveTab('unlock');
    }
  }, [activeTab, isAllBaseUnlocked]);

  /** 
   * [저장 및 요약] 변경 사항이 있으면 서버에 저장하고 요약 모달을 엽니다.
   */
  const handleSaveAndSummary = async () => {
    if (isProgressChanged && token) {
      await saveToServer();
    }
    setIsSummaryOpen(true);
  };

  // 기본 5개 탭 메뉴 설정 (Plan 탭은 우측 별도 영역에 배치)
  const tabs = [
    { id: 'unlock', icon: Lock, label: 'Unlock' },
    { id: 'base', icon: Zap, label: 'Base Stats' },
    { id: 'plus', icon: PlusCircle, label: 'UW+ Stats' },
    { id: 'card', icon: Layers, label: 'Cards' },
    { id: 'module', icon: Box, label: 'Modules' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 상단 스티키 헤더: 총 사용량 표시 및 제어 버튼 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sticky top-0 bg-slate-950/90 backdrop-blur-md py-3 z-20 border-b border-slate-800 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
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
            onClick={handleSaveAndSummary}
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
                <span className="flex items-center gap-1.5 text-xs font-medium"><Lock size={13}/> Unlock</span>
                <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'unlock' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {formatNum(tabStonesUsed['unlock'] || 0)}
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('plan')} 
                className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'plan' ? 'bg-purple-900/40 text-purple-200 shadow-sm border border-purple-500/50' : 'text-purple-400 hover:text-purple-200'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium"><ClipboardList size={13}/> Plan</span>
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
                <span className="flex items-center gap-1.5 text-xs font-medium"><Zap size={13}/> Base Stats</span>
                <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'base' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {formatNum(tabStonesUsed['base'] || 0)}
                </span>
              </button>
              <button 
                onClick={() => {
                  if (isAllBaseUnlocked) setActiveTab('plus');
                }} 
                disabled={!isAllBaseUnlocked}
                title={!isAllBaseUnlocked ? `Requires all Ultimate Weapons (${unlockedBaseCount}/${allWeaponKeys.length})` : undefined}
                className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
                  !isAllBaseUnlocked
                    ? 'opacity-40 cursor-not-allowed text-slate-600 border border-slate-800/80'
                    : activeTab === 'plus' 
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium">{!isAllBaseUnlocked ? <Lock size={13} /> : <PlusCircle size={13}/>} UW+ Stats</span>
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
                <span className="flex items-center gap-1.5 text-xs font-medium"><Layers size={13}/> Cards</span>
                <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'card' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {formatNum(tabStonesUsed['card'] || 0)}
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('module')} 
                className={`flex-1 px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${activeTab === 'module' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium"><Box size={13}/> Modules</span>
                <span className={`text-sm font-mono font-bold leading-tight ${activeTab === 'module' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {formatNum(tabStonesUsed['module'] || 0)}
                </span>
              </button>
            </div>
          </div>

          {/* 데스크톱 기본 5개 탭 레이아웃 (1행) */}
          <div className="hidden md:flex flex-wrap gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex-1 justify-start">
            {tabs.map(tab => {
              const isTabDisabled = tab.id === 'plus' && !isAllBaseUnlocked;
              const Icon = isTabDisabled ? Lock : tab.icon;
              const stones = tabStonesUsed[tab.id] || 0;

              return (
                <button 
                  key={tab.id}
                  onClick={() => {
                    if (!isTabDisabled) setActiveTab(tab.id as TabType);
                  }} 
                  disabled={isTabDisabled}
                  title={isTabDisabled ? `Requires all Ultimate Weapons (${unlockedBaseCount}/${allWeaponKeys.length})` : `${tab.label}: ${formatNum(stones)} Stones`}
                  className={`px-3 py-1.5 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 flex-none min-w-[80px] border ${
                    isTabDisabled
                      ? 'opacity-40 cursor-not-allowed text-slate-600 border-slate-800/80'
                      : activeTab === tab.id
                        ? 'bg-slate-800 text-white shadow-sm border-slate-700'
                        : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Icon size={13}/> 
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
              title={`Plan (${evaluatedItems.length} Steps): ${formatNum(totalPlanStones)} Stones`}
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
                onClick={resetAll}
                className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all font-bold text-xs"
                title="Reset All Progress"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
            <button 
              onClick={handleSaveAndSummary}
              className={`flex items-center justify-center gap-1.5 px-3 ${token ? 'py-1 text-xs' : 'py-2 text-sm'} rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSaving}
            >
              <List size={token ? 13 : 16} /> {!token ? 'Summary' : isSaving ? 'Saving...' : (isProgressChanged ? 'Save & Summary*' : 'Save & Summary')}
            </button>
          </div>
        </div>
      </div>

      {/* 계획 담기 모드 안내 배너 */}
      {isPlanMode && activeTab !== 'plan' && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs md:text-sm text-purple-200">
            <Pin size={16} className="text-purple-400 shrink-0 fill-purple-400" />
            <span>
              <strong className="text-white">계획 담기 모드 활성화 중:</strong> 아래 표에서 원하는 레벨이나 항목을 클릭하면 내 실제 기록 대신 <strong className="text-purple-300">[Plan]</strong> 탭에 순서대로 추가됩니다. (총 <strong className="font-mono text-yellow-400">{evaluatedItems.length}</strong>단계 / <strong className="font-mono text-yellow-400">{formatNum(totalPlanStones)}</strong> Stones)
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {token && (
              <button
                onClick={saveToServer}
                disabled={isSaving || !isPlanChanged}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  isPlanChanged
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-500 border-slate-700/70 cursor-default'
                }`}
                title="계획표를 서버에 저장합니다."
              >
                <Save size={13} />
                {isSaving ? '저장 중...' : isPlanChanged ? '계획표 저장*' : '계획표 저장됨'}
              </button>
            )}
            <button
              onClick={() => setActiveTab('plan')}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            >
              계획표 보기 ({evaluatedItems.length})
            </button>
            <button
              onClick={() => setIsPlanMode(false)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 text-slate-300 border border-slate-700 hover:text-white transition-colors"
            >
              종료
            </button>
          </div>
        </div>
      )}

      {/* 탭 콘텐츠 영역 */}
      <div>
        {activeTab === 'unlock' && (
          <UnlockTab 
            progress={displayProgress} 
            updateProgress={updateProgress} 
            updateBatch={updateBatch} 
          />
        )}
        
        {(activeTab === 'base' || activeTab === 'plus') && (
          <UwStatsTab 
            category={activeTab} 
            progress={displayProgress} 
            updateProgress={updateProgress} 
            selectedUw={selectedUw} 
            onSelectUw={setSelectedUw} 
          />
        )}
        
        {activeTab === 'card' && <CardTab progress={displayProgress} updateProgress={updateProgress} resetCards={resetCards} />}
        {activeTab === 'module' && <ModuleTab progress={displayProgress} updateProgress={updateProgress} />}
        {activeTab === 'plan' && (
          <PlanTab
            evaluatedItems={evaluatedItems}
            totalPlanStones={totalPlanStones}
            isPlanChanged={isPlanChanged}
            isSaving={isSaving}
            onSavePlan={saveToServer}
            onMovePlanItem={movePlanItem}
            onRemovePlanItem={removePlanItem}
            onCompletePlanItem={completePlanItem}
            onClearPlan={clearPlan}
            onStartPlanning={() => {
              setIsPlanMode(true);
              setActiveTab('base');
            }}
          />
        )}
      </div>

      {/* 결과 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />
    </div>
  );
}