/**
 * 파일명: thetower/front/src/pages/StonesPage.tsx
 * 용도: 게임 재화인 '스톤(Stones)'의 총 사용량 계산 및 관리 페이지
 * 기능: UW 해금/스탯, 카드, 모듈 등 각 카테고리별 스톤 소모량 계산 및 서버 동기화
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin, Save } from 'lucide-react';
import StoneHeader, { type StoneTabType } from '../components/Stones/StoneHeader';
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

export default function StonesPage({ token }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StoneTabType>('unlock');
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

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 상단 스티키 헤더 및 탭 네비게이션 */}
      <StoneHeader
        token={token}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStonesUsed={totalStonesUsed}
        tabStonesUsed={tabStonesUsed}
        totalPlanStones={totalPlanStones}
        planStepsCount={evaluatedItems.length}
        isPlanMode={isPlanMode}
        setIsPlanMode={setIsPlanMode}
        isAllBaseUnlocked={isAllBaseUnlocked}
        unlockedBaseCount={unlockedBaseCount}
        totalWeaponsCount={allWeaponKeys.length}
        isProgressChanged={isProgressChanged}
        isSaving={isSaving}
        onNavigateBack={() => navigate(-1)}
        onResetAll={resetAll}
        onSaveAndSummary={handleSaveAndSummary}
      />

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
