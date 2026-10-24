/**
 * 파일명: thetower/front/src/components/Detail/ReportInputModal.tsx
 * 용도: 새로운 전투 리포트 텍스트를 입력받아 서버로 전송하는 모달 (3슬롯 동시 입력 지원)
 * 기능: 3개 입력창 나란히 제공(최소 1개만 입력해도 저장 가능), 포커스 슬롯 연동 퀵 메모, 엔터키 즉시 저장(Shift+Enter는 줄바꿈), API 연동
 */
import { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Trophy, Zap, Beaker, CheckCircle2 } from 'lucide-react';
import { createReport } from '../../api/reports';
import { useReports } from '../../contexts/ReportContext';
import { useStatsCache } from '../../contexts/StatsCacheContext';
import useEscKey from '../../hooks/useEscKey';
import { T } from '../../locales';

interface Props {
  onClose: () => void;
}

interface ReportSlot {
  text: string;
  notes: string;
  saved?: boolean;
}

const SLOT_COUNT = 3;

export default function ReportInputModal({ onClose }: Props) {
  const [slots, setSlots] = useState<ReportSlot[]>(() =>
    Array.from({ length: SLOT_COUNT }, () => ({ text: '', notes: '', saved: false }))
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const notesInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { refreshReports, addReportToState } = useReports();
  const { invalidateStatsCache } = useStatsCache();

  const Text = T.detail;
  const Common = T.common;

  // ESC 키로 모달 닫기 지원
  useEscKey(onClose, !loading && !isCompleted);

  // 1. 모달 오픈 시 첫 번째 리포트 입력창에 자동 포커스
  useEffect(() => {
    textareaRefs.current[0]?.focus();
  }, []);

  // 테스트 서브 메뉴 데이터
  const TEST_SUBS = [
    { key: 'card',     label: Text.BTN_CARD,     value: 'Test - Card'     },
    { key: 'workshop', label: Text.BTN_WORKSHOP, value: 'Test - Workshop' },
    { key: 'module',   label: Text.BTN_MODULE,   value: 'Test - Module'   },
  ];

  // 불협화음 서브 메뉴 데이터
  const DISSONANT_SUBS = [
    { key: 'attack',  label: Text.BTN_ATTACK,  value: 'Dissonant - Attack'  },
    { key: 'defense', label: Text.BTN_DEFENSE, value: 'Dissonant - Defense' },
    { key: 'util',    label: Text.BTN_UTILITY, value: 'Dissonant - Utility' },
    { key: 'ult',     label: Text.BTN_ULTIMATE, value: 'Dissonant - Ultimate' },
  ];

  const updateSlot = (index: number, field: 'text' | 'notes', value: string) => {
    setSlots((prev) =>
      prev.map((slot, idx) =>
        idx === index ? { ...slot, [field]: value, saved: false } : slot
      )
    );
  };

  // 최소 1개 이상의 슬롯에 텍스트가 입력되어 있는지 확인
  const filledCount = slots.filter((s) => s.text.trim().length > 0).length;
  const hasValidInput = filledCount > 0;

  const handleSubmit = async () => {
    if (!hasValidInput || loading || isCompleted) return;
    setLoading(true);
    setError(null);

    let anySaved = false;
    const nextSlots = [...slots];

    try {
      for (let i = 0; i < nextSlots.length; i++) {
        const trimmedText = nextSlots[i].text.trim();
        if (!trimmedText || nextSlots[i].saved) continue;

        try {
          const savedReport = await createReport(trimmedText, nextSlots[i].notes);
          anySaved = true;
          // 즉시 로컬 상태에 추가하여 화면에 바로 반영
          addReportToState(savedReport);
          // 저장 성공 표시 (일부 실패 시에도 이미 저장된 슬롯은 재전송 방지)
          nextSlots[i] = { ...nextSlots[i], saved: true };
          setSlots([...nextSlots]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : Text.ERR_SAVE_FAIL;
          throw new Error(`[#${i + 1}] ${msg}`);
        }
      }

      if (anySaved) {
        invalidateStatsCache(); // 통계 전역 캐시 무효화
        // 전체 목록 동기화는 백그라운드에서 비동기로 수행 (모달 닫힘을 막지 않음)
        refreshReports().catch(() => {});
      }

      // 저장 완료 표시 후 0.5초 대기 뒤 모달 닫기
      setLoading(false);
      setIsCompleted(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
    } catch (err) {
      if (anySaved) {
        invalidateStatsCache();
        refreshReports().catch(() => {});
      }
      setLoading(false);
      setError(err instanceof Error ? err.message : Text.ERR_SAVE_FAIL);
    }
  };

  // 포스트잇(퀵 메모) 클릭 시: 현재 활성 슬롯의 메모 텍스트 채운 뒤 해당 메모 입력창으로 포커스 이동
  const handleQuickNote = (noteValue: string) => {
    updateSlot(activeIndex, 'notes', noteValue);
    notesInputRefs.current[activeIndex]?.focus();
  };

  // 엔터키 감지 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative my-auto">

        {/* 모달 본체: 3개 입력창을 가로로 나란히 배치 */}
        <div className="bg-slate-900 border border-slate-700 w-[92vw] max-w-[1140px] rounded-2xl shadow-2xl p-6 animate-fade-in">

          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 flex-wrap">
              <FileText className="text-blue-500" /> {Text.INPUT_TITLE}
              <span className="text-xs font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                최소 1개는 입력 필요
              </span>
              {filledCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {filledCount} / {SLOT_COUNT}
                </span>
              )}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X />
            </button>
          </div>

          {/* 3열 입력창 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slots.map((slot, index) => {
              const isActive = activeIndex === index;
              const isFilled = slot.text.trim().length > 0;
              const isSaved = !!slot.saved;

              return (
                <div
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`flex flex-col rounded-xl p-3 border transition-colors ${
                    isSaved
                      ? 'bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                      : isActive
                      ? 'bg-slate-900/90 border-blue-500/60 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-extrabold px-2.5 py-0.5 rounded-md tracking-tight ${
                          isSaved
                            ? 'bg-emerald-600 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : isFilled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      {isSaved && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 animate-fade-in">
                          <CheckCircle2 size={14} /> 저장 완료
                        </span>
                      )}
                    </div>
                    {slot.text && !isSaved && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSlot(index, 'text', '');
                          updateSlot(index, 'notes', '');
                          textareaRefs.current[index]?.focus();
                        }}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        초기화
                      </button>
                    )}
                  </div>

                  {/* 리포트 텍스트 영역 */}
                  <div className="relative group w-full">
                    <textarea
                      ref={(el) => {
                        textareaRefs.current[index] = el;
                      }}
                      value={slot.text}
                      disabled={loading || isSaved}
                      onFocus={() => setActiveIndex(index)}
                      onChange={(e) => updateSlot(index, 'text', e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={Text.INPUT_PLACEHOLDER}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none custom-scrollbar disabled:opacity-60"
                      style={{ height: '340px' }}
                    />

                    {/* 저장 완료 오버레이 */}
                    {isSaved && (
                      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center gap-2 pointer-events-none animate-fade-in">
                        <CheckCircle2 size={44} className="text-emerald-400" />
                        <span className="text-base font-extrabold text-emerald-400 tracking-tight">
                          저장 완료!
                        </span>
                      </div>
                    )}

                    {/* 엔터키 안내 문구 */}
                    {!slot.text && !isSaved && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity px-2 text-center">
                        <span className="text-lg font-black text-slate-400 uppercase tracking-tighter">
                          {Text.INPUT_HELP}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 개별 notes 입력 */}
                  <input
                    ref={(el) => {
                      notesInputRefs.current[index] = el;
                    }}
                    type="text"
                    value={slot.notes}
                    disabled={loading || isSaved}
                    onFocus={() => setActiveIndex(index)}
                    onChange={(e) => updateSlot(index, 'notes', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={Text.NOTE_PLACEHOLDER}
                    className="w-full mt-2.5 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                </div>
              );
            })}
          </div>

          {error && <p className="text-red-500 text-sm mt-3 animate-shake">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={loading || isCompleted}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-bold disabled:opacity-50"
            >
              {Common.CANCEL}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || isCompleted || !hasValidInput}
              className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-bold transition-all shadow-lg text-sm ${
                isCompleted
                  ? 'bg-emerald-600 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 size={18} />
                  저장 완료!
                </>
              ) : loading ? (
                Common.SAVING
              ) : (
                <>
                  <Save size={18} />
                  {Common.SAVE}
                  {filledCount > 1 ? ` (${filledCount})` : ''}
                </>
              )}
            </button>
          </div>
        </div>

        {/* 포스트잇 사이드바 (현재 포커스된 #슬롯에 메모 적용) */}
        <div className="hidden xl:flex absolute top-4 -right-24 flex-col gap-1.5 w-[88px]">
          <div className="text-center text-sm font-extrabold text-blue-400 bg-slate-900/95 border border-blue-500/40 rounded-lg py-1.5 mb-0.5 shadow-md">
            #{activeIndex + 1} 메모
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleQuickNote(Text.BTN_TOURNAMENT)}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-yellow-500/20 border border-slate-600 hover:border-yellow-500/50 rounded-lg text-yellow-400 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
          >
            <Trophy size={12} className="text-yellow-500" />
            {Text.BTN_TOURNAMENT}
          </button>

          <div className="border-t border-slate-700 my-1" />

          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400 py-1">
            <Beaker size={11} />
            {Text.LBL_TEST}
          </div>

          {TEST_SUBS.map((sub) => (
            <button
              key={sub.key}
              type="button"
              disabled={loading}
              onClick={() => handleQuickNote(sub.value)}
              className="w-full py-1.5 bg-slate-800 hover:bg-emerald-500/20 border border-slate-600 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-emerald-300 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
            >
              {sub.label}
            </button>
          ))}

          <div className="border-t border-slate-700 my-1" />

          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-purple-400 py-1">
            <Zap size={11} />
            {Text.LBL_DISSONANT}
          </div>

          {DISSONANT_SUBS.map((sub) => (
            <button
              key={sub.key}
              type="button"
              disabled={loading}
              onClick={() => handleQuickNote(sub.value)}
              className="w-full py-1.5 bg-slate-800 hover:bg-purple-500/20 border border-slate-600 hover:border-purple-500/50 rounded-lg text-slate-300 hover:text-purple-300 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
            >
              {sub.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
