/**
 * 파일명: thetower/front/src/components/Layout/ReportInput/ReportQuickNotes.tsx
 * 용도: 리포트 입력 모달 우측 포스트잇(퀵 메모) 사이드바 컴포넌트
 * 기능: 현재 포커스된 슬롯(#N)에 토너먼트/테스트/불협화음 프리셋 메모를 즉시 입력
 */
import { Trophy, Zap, Beaker } from 'lucide-react';
import { T } from '../../../locales';

interface ReportQuickNotesProps {
  activeIndex: number;
  loading: boolean;
  onSelectNote: (noteValue: string) => void;
}

export default function ReportQuickNotes({
  activeIndex,
  loading,
  onSelectNote,
}: ReportQuickNotesProps) {
  const Text = T.detail;

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

  return (
    <div className="hidden xl:flex absolute top-4 -right-24 flex-col gap-1.5 w-[88px]">
      <div className="text-center text-sm font-extrabold text-blue-400 bg-slate-900/95 border border-blue-500/40 rounded-lg py-1.5 mb-0.5 shadow-md">
        #{activeIndex + 1} 메모
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => onSelectNote(Text.BTN_TOURNAMENT)}
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
          onClick={() => onSelectNote(sub.value)}
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
          onClick={() => onSelectNote(sub.value)}
          className="w-full py-1.5 bg-slate-800 hover:bg-purple-500/20 border border-slate-600 hover:border-purple-500/50 rounded-lg text-slate-300 hover:text-purple-300 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
        >
          {sub.label}
        </button>
      ))}
    </div>
  );
}
