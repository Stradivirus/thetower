/**
 * 파일명: thetower/front/src/components/Layout/ReportInput/ReportInputModal.tsx
 * 용도: 새로운 전투 리포트 텍스트를 입력받아 서버로 전송하는 모달 (모바일 1슬롯 / 데스크톱 기본 3슬롯 / 확장 8슬롯 지원)
 * 기능: 슬롯 상태 관리, 반응형 전환, 엔터키 즉시 저장(Shift+Enter는 줄바꿈), 서버 전송 및 캐시 무효화
 */
import { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { createReport } from '../../../api/reports';
import { useReports } from '../../../contexts/ReportContext';
import { useStatsCache } from '../../../contexts/StatsCacheContext';
import useEscKey from '../../../hooks/useEscKey';
import { T } from '../../../locales';
import ReportSlotCard, { type ReportSlot } from './ReportSlotCard';
import ReportQuickNotes from './ReportQuickNotes';

interface Props {
  onClose: () => void;
}

const DEFAULT_SLOT_COUNT = 3;
const EXPANDED_SLOT_COUNT = 8;

export default function ReportInputModal({ onClose }: Props) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [slots, setSlots] = useState<ReportSlot[]>(() =>
    Array.from({ length: EXPANDED_SLOT_COUNT }, () => ({ text: '', notes: '', saved: false }))
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const notesInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { refreshReports, addReportToState } = useReports();
  const { invalidateStatsCache } = useStatsCache();

  const visibleSlotCount = isMobile ? 1 : isExpanded ? EXPANDED_SLOT_COUNT : DEFAULT_SLOT_COUNT;
  const visibleSlots = slots.slice(0, visibleSlotCount);

  const Text = T.detail;
  const Common = T.common;

  // ESC 키로 모달 닫기 지원
  useEscKey(onClose, !loading && !isCompleted);

  // 뷰포트 리사이즈 감지 (모바일 <-> 데스크톱 전환 대응)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setActiveIndex(0);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모달 오픈 시 첫 번째 리포트 입력창에 자동 포커스
  useEffect(() => {
    textareaRefs.current[0]?.focus();
  }, []);

  // 확장/축소 토글 핸들러
  const handleToggleExpand = () => {
    if (loading || isCompleted) return;
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next && activeIndex >= DEFAULT_SLOT_COUNT) {
        setActiveIndex(0);
      }
      return next;
    });
  };

  const updateSlot = (index: number, field: 'text' | 'notes', value: string) => {
    setSlots((prev) =>
      prev.map((slot, idx) =>
        idx === index ? { ...slot, [field]: value, saved: false } : slot
      )
    );
  };

  const resetSlot = (index: number) => {
    setSlots((prev) =>
      prev.map((slot, idx) =>
        idx === index ? { text: '', notes: '', saved: false } : slot
      )
    );
    textareaRefs.current[index]?.focus();
  };

  // 최소 1개 이상의 슬롯에 텍스트가 입력되어 있는지 확인
  const filledCount = visibleSlots.filter((s) => s.text.trim().length > 0).length;
  const hasValidInput = filledCount > 0;

  const handleSubmit = async () => {
    if (!hasValidInput || loading || isCompleted) return;
    setLoading(true);
    setError(null);

    let anySaved = false;
    const nextSlots = [...slots];

    try {
      for (let i = 0; i < visibleSlotCount; i++) {
        const trimmedText = nextSlots[i].text.trim();
        if (!trimmedText || nextSlots[i].saved) continue;

        try {
          const savedReport = await createReport(trimmedText, nextSlots[i].notes);
          anySaved = true;
          addReportToState(savedReport);
          nextSlots[i] = { ...nextSlots[i], saved: true };
          setSlots([...nextSlots]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : Text.ERR_SAVE_FAIL;
          throw new Error(`[#${i + 1}] ${msg}`);
        }
      }

      if (anySaved) {
        invalidateStatsCache();
        refreshReports().catch(() => {});
      }

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

        {/* 모달 본체: 모바일 1개 / 데스크톱 기본 3열 / 확장 시 2x4 (8개) 그리드 배치 */}
        <div
          className={`bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-fade-in transition-all ${
            isMobile
              ? 'w-[92vw] max-w-[450px] p-5'
              : isExpanded
              ? 'w-[94vw] max-w-[1360px] p-5'
              : 'w-[92vw] max-w-[1140px] p-6'
          }`}
        >
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 flex-wrap">
              <FileText className="text-blue-500" /> {Text.INPUT_TITLE}
              {!isMobile && (
                <>
                  <span className="text-xs font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    최소 1개는 입력 필요
                  </span>
                  {filledCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {filledCount} / {visibleSlotCount}
                    </span>
                  )}
                </>
              )}
            </h2>

            <div className="flex items-center gap-3 shrink-0">
              {/* 3개 <-> 8개(2x4) 확장 토글 버튼 (데스크톱 전용) */}
              {!isMobile && (
                <button
                  type="button"
                  disabled={loading || isCompleted}
                  onClick={handleToggleExpand}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                    isExpanded
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 size={14} />
                      <span>기본 (3개)</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={14} />
                      <span>대량 입력 (8개)</span>
                    </>
                  )}
                </button>
              )}

              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X />
              </button>
            </div>
          </div>

          {/* 입력창 그리드 (모바일: 단일 / 데스크톱 기본: 1x3 / 확장: 2x4) */}
          <div
            className={
              isMobile
                ? 'grid grid-cols-1'
                : isExpanded
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'
                : 'grid grid-cols-1 md:grid-cols-3 gap-4'
            }
          >
            {visibleSlots.map((slot, index) => (
              <ReportSlotCard
                key={index}
                index={index}
                slot={slot}
                isActive={activeIndex === index}
                isMobile={isMobile}
                isExpanded={isExpanded}
                loading={loading}
                onActivate={setActiveIndex}
                onChange={updateSlot}
                onReset={resetSlot}
                onKeyDown={handleKeyDown}
                textareaRef={(el) => {
                  textareaRefs.current[index] = el;
                }}
                notesInputRef={(el) => {
                  notesInputRefs.current[index] = el;
                }}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mt-3 animate-shake">{error}</p>}

          {/* 하단 액션 버튼 */}
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

        {/* 우측 포스트잇 사이드바 */}
        <ReportQuickNotes
          activeIndex={activeIndex}
          loading={loading}
          onSelectNote={handleQuickNote}
        />
      </div>
    </div>
  );
}
