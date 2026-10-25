/**
 * 파일명: thetower/front/src/components/Layout/ReportInput/ReportSlotCard.tsx
 * 용도: 리포트 입력 모달 내 개별 입력 슬롯 카드 컴포넌트
 * 기능: 슬롯 번호/상태 배지, 초기화 버튼, 리포트 본문 textarea(저장 오버레이 및 안내 문구 포함), 개별 메모 input 렌더링
 */
import { CheckCircle2 } from 'lucide-react';
import { T } from '../../../locales';

export interface ReportSlot {
  text: string;
  notes: string;
  saved?: boolean;
}

interface ReportSlotCardProps {
  index: number;
  slot: ReportSlot;
  isActive: boolean;
  isMobile: boolean;
  isExpanded: boolean;
  loading: boolean;
  onActivate: (index: number) => void;
  onChange: (index: number, field: 'text' | 'notes', value: string) => void;
  onReset: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  notesInputRef: (el: HTMLInputElement | null) => void;
}

export default function ReportSlotCard({
  index,
  slot,
  isActive,
  isMobile,
  isExpanded,
  loading,
  onActivate,
  onChange,
  onReset,
  onKeyDown,
  textareaRef,
  notesInputRef,
}: ReportSlotCardProps) {
  const Text = T.detail;
  const isFilled = slot.text.trim().length > 0;
  const isSaved = !!slot.saved;
  const isGridExpanded = !isMobile && isExpanded;

  return (
    <div
      onClick={() => onActivate(index)}
      className={
        isMobile
          ? 'flex flex-col'
          : `flex flex-col rounded-xl ${isExpanded ? 'p-2.5' : 'p-3'} border transition-colors ${
              isSaved
                ? 'bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                : isActive
                ? 'bg-slate-900/90 border-blue-500/60 shadow-lg shadow-blue-500/5'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`
      }
    >
      {/* 데스크톱 전용 슬롯 헤더 (#번호, 저장 완료 배지, 초기화 버튼) */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`${isExpanded ? 'text-sm px-2 py-0.5' : 'text-base px-2.5 py-0.5'} font-extrabold rounded-md tracking-tight ${
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
                onReset(index);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* 리포트 텍스트 영역 */}
      <div className="relative group w-full">
        <textarea
          ref={textareaRef}
          value={slot.text}
          disabled={loading || isSaved}
          onFocus={() => onActivate(index)}
          onChange={(e) => onChange(index, 'text', e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={Text.INPUT_PLACEHOLDER}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none custom-scrollbar disabled:opacity-60"
          style={{ height: isGridExpanded ? '170px' : '340px' }}
        />

        {/* 저장 완료 오버레이 */}
        {isSaved && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center gap-2 pointer-events-none animate-fade-in">
            <CheckCircle2 size={isGridExpanded ? 34 : 44} className="text-emerald-400" />
            <span className="text-base font-extrabold text-emerald-400 tracking-tight">
              저장 완료!
            </span>
          </div>
        )}

        {/* 엔터키 안내 문구 */}
        {!slot.text && !isSaved && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity px-2 text-center">
            <span className={`${isGridExpanded ? 'text-sm' : 'text-lg'} font-black text-slate-400 uppercase tracking-tighter`}>
              {Text.INPUT_HELP}
            </span>
          </div>
        )}
      </div>

      {/* 개별 notes 입력 */}
      <input
        ref={notesInputRef}
        type="text"
        value={slot.notes}
        disabled={loading || isSaved}
        onFocus={() => onActivate(index)}
        onChange={(e) => onChange(index, 'notes', e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={Text.NOTE_PLACEHOLDER}
        className={`w-full ${isGridExpanded ? 'mt-2 p-2' : 'mt-2.5 p-2.5'} bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60`}
      />
    </div>
  );
}
