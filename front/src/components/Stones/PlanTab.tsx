/**
 * 파일명: thetower/front/src/components/Stones/PlanTab.tsx
 * 용도: 스톤 계산기 페이지의 '계획표(Plan)' 탭 컨텐츠
 * 기능: 단계별(분할 허용) 스톤 업그레이드 계획 목록 표시, 개별/누적 필요 스톤 계산, 순서 변경, 달성(실제 진행도 반영) 및 삭제
 */
import { ClipboardList, ArrowUp, ArrowDown, Check, Trash2, PlusCircle, RotateCcw, Save } from 'lucide-react';
import { stoneStyles as styles, formatNum } from './StoneShared';
import type { EvaluatedPlanItem } from '../../utils/stonePlanCalculations';
import { useGameData } from '../../contexts/GameDataContext';

interface Props {
  evaluatedItems: EvaluatedPlanItem[];
  totalPlanStones: number;
  isPlanChanged: boolean;
  isSaving: boolean;
  onSavePlan: () => void;
  onMovePlanItem: (id: string, direction: 'up' | 'down') => void;
  onRemovePlanItem: (id: string) => void;
  onCompletePlanItem: (id: string) => void;
  onClearPlan: () => void;
  onStartPlanning: () => void;
}

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  'Unlock': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Base UW': 'bg-green-500/10 text-green-400 border-green-500/30',
  'UW+': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  'Card': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Module': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export default function PlanTab({
  evaluatedItems,
  totalPlanStones,
  isPlanChanged,
  isSaving,
  onSavePlan,
  onMovePlanItem,
  onRemovePlanItem,
  onCompletePlanItem,
  onClearPlan,
  onStartPlanning,
}: Props) {
  const { isLoggedIn } = useGameData();

  return (
    <div className="animate-fade-in">
      <div className={styles.card}>
        {/* 상단 요약 헤더 */}
        <div className="bg-slate-800/80 px-4 py-3 text-white font-bold text-sm border-b border-slate-700 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-purple-400" />
              <span className="text-base">Stone Upgrade Roadmap</span>
              <span className="text-xs font-normal text-slate-400">
                ({evaluatedItems.length} Steps)
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">총 필요 스톤:</span>
              <span className="text-base font-mono font-bold text-yellow-400">
                {formatNum(totalPlanStones)}
              </span>
              {isPlanChanged && (
                <span className="text-amber-400 font-bold ml-1.5">(미저장 변경사항)</span>
              )}
            </div>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <button
                onClick={onSavePlan}
                disabled={isSaving || !isPlanChanged}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isPlanChanged
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/60 text-slate-500 border-slate-700/70 cursor-default'
                }`}
                title="계획표를 서버에 저장합니다."
              >
                <Save size={13} />
                {isSaving ? '저장 중...' : isPlanChanged ? '계획표 저장*' : '계획표 저장됨'}
              </button>
              <button
                onClick={onStartPlanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 transition-all"
              >
                <PlusCircle size={13} /> 계획 더 담기
              </button>
              {evaluatedItems.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('계획표를 모두 비우시겠습니까? (실제 내 스톤 진행도는 유지됩니다)')) {
                      onClearPlan();
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-rose-400 border border-slate-700 hover:border-rose-500/50 transition-all"
                >
                  <RotateCcw size={12} /> 전체 비우기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 빈 상태 안내 */}
        {evaluatedItems.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-purple-400/60">
              <ClipboardList size={32} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-300 mb-1">등록된 스톤 사용 계획이 없습니다.</p>
              <p className="text-xs text-slate-500">
                상단의 <span className="text-purple-400 font-bold">[📌 계획 담기]</span> 모드를 켜고 각 탭(Unlock, Base Stats, UW+, Cards, Modules)에서 목표 단계를 클릭해 순서대로 담아보세요!
              </p>
            </div>
            {isLoggedIn && (
              <button
                onClick={onStartPlanning}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition-all"
              >
                <PlusCircle size={15} /> 계획 담기 시작하기
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th className={`${styles.th} w-14 text-center`}>순위</th>
                    <th className={`${styles.th} w-24`}>분류</th>
                    <th className={styles.th}>목표 항목</th>
                    <th className={styles.th}>단계</th>
                    <th className={styles.th}>수치 변화</th>
                    <th className={`${styles.th} text-right`}>필요 스톤</th>
                    <th className={`${styles.th} text-right`}>누적 필요 스톤</th>
                    {isLoggedIn && <th className={`${styles.th} text-center w-44 whitespace-nowrap`}>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {evaluatedItems.map((item, idx) => {
                    const badgeClass = CATEGORY_BADGE_STYLE[item.categoryLabel] || 'bg-slate-800 text-slate-300 border-slate-700';
                    const isFirst = idx === 0;
                    const isLast = idx === evaluatedItems.length - 1;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-400">
                          #{item.index}
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeClass}`}>
                            {item.categoryLabel}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 font-bold text-white whitespace-nowrap text-sm">
                          {item.title}
                        </td>
                        <td className="px-2 py-2.5 font-mono text-cyan-400 font-bold whitespace-nowrap">
                          {item.stepDesc}
                        </td>
                        <td className="px-2 py-2.5 font-mono text-slate-300 max-w-[260px] truncate" title={item.valueDesc}>
                          {item.valueDesc}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono font-bold text-yellow-400 text-sm whitespace-nowrap">
                          {formatNum(item.cost)}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono font-bold text-purple-300 text-sm whitespace-nowrap">
                          {formatNum(item.cumulativeCost)}
                        </td>
                        {isLoggedIn && (
                          <td className="px-2 py-2.5 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onMovePlanItem(item.id, 'up')}
                                disabled={isFirst}
                                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
                                title="위로 이동"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                onClick={() => onMovePlanItem(item.id, 'down')}
                                disabled={isLast}
                                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
                                title="아래로 이동"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                onClick={() => onCompletePlanItem(item.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 font-bold text-[11px] transition-colors ml-1 whitespace-nowrap shrink-0"
                                title="내 실제 스톤 기록에 반영 및 완료 처리"
                              >
                                <Check size={13} className="shrink-0" /> 완료
                              </button>
                              <button
                                onClick={() => onRemovePlanItem(item.id)}
                                className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-colors shrink-0"
                                title="계획에서 삭제"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className={styles.tfootTd} colSpan={5}>
                      Total Planned Stones ({evaluatedItems.length} Steps)
                    </td>
                    <td className={`${styles.tfootTd} text-right text-yellow-400 font-mono text-base`}>
                      {formatNum(totalPlanStones)}
                    </td>
                    <td className={`${styles.tfootTd} text-right text-purple-300 font-mono text-base`}>
                      {formatNum(totalPlanStones)}
                    </td>
                    {isLoggedIn && <td className={styles.tfootTd}></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 모바일 카드 리스트 뷰 */}
            <div className="md:hidden divide-y divide-slate-800">
              {evaluatedItems.map((item, idx) => {
                const badgeClass = CATEGORY_BADGE_STYLE[item.categoryLabel] || 'bg-slate-800 text-slate-300 border-slate-700';
                const isFirst = idx === 0;
                const isLast = idx === evaluatedItems.length - 1;

                return (
                  <div key={item.id} className="p-3.5 space-y-2.5 bg-slate-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400">#{item.index}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeClass}`}>
                          {item.categoryLabel}
                        </span>
                        <span className="font-bold text-sm text-white truncate">{item.title}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                        {item.stepDesc}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800/70">
                      <div className="text-slate-400 font-mono truncate mr-2">
                        {item.valueDesc}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 mr-1">비용</span>
                          <span className="text-yellow-400 font-bold">{formatNum(item.cost)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 mr-1">누적</span>
                          <span className="text-purple-300 font-bold">{formatNum(item.cumulativeCost)}</span>
                        </div>
                      </div>
                    </div>

                    {isLoggedIn && (
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => onMovePlanItem(item.id, 'up')}
                          disabled={isFirst}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 disabled:opacity-30"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => onMovePlanItem(item.id, 'down')}
                          disabled={isLast}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => onCompletePlanItem(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs whitespace-nowrap shrink-0"
                        >
                          <Check size={14} className="shrink-0" /> 완료
                        </button>
                        <button
                          onClick={() => onRemovePlanItem(item.id)}
                          className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
