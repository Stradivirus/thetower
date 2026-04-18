/**
 * 파일명: thetower/front/src/components/Detail/ReportInputModal.tsx
 * 용도: 새로운 전투 리포트 텍스트를 입력받아 서버로 전송하는 모달
 * 기능: 텍스트 붙여넣기 폼 제공, 퀵 메모, 엔터키 즉시 저장(Shift+Enter는 줄바꿈), API 연동
 */
import { useState } from 'react';
import { X, Save, FileText, Trophy, Zap, Beaker } from 'lucide-react';
import { createReport } from '../../api/reports';
import { useReports } from '../../contexts/ReportContext';
import { T } from '../../locales';

interface Props {
  onClose: () => void;
}

export default function ReportInputModal({ onClose }: Props) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshReports } = useReports();

  const Text = T.detail;
  const Common = T.common;

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

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await createReport(text, notes);
      await refreshReports();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : Text.ERR_SAVE_FAIL);
    } finally {
      setLoading(false);
    }
  };

  // 엔터키 감지 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="relative">

        {/* [중요] 모달 본체: max-w-lg의 값인 512px로 너비를 고정하여 수축 방지 */}
        <div className="bg-slate-900 border border-slate-700 w-[450px] rounded-2xl shadow-2xl p-6 animate-fade-in">

          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-blue-500" /> {Text.INPUT_TITLE}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X />
            </button>
          </div>

          {/* 입력창 영역: w-full을 통해 부모의 512px을 꽉 채움 */}
          <div className="relative group w-full">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={Text.INPUT_PLACEHOLDER}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none custom-scrollbar"
              style={{ height: '400px' }}
            />
            
            {/* 엔터키 안내 문구 */}
            {!text && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                <span className="text-2xl font-black text-slate-400 uppercase tracking-tighter">
                  {Text.INPUT_HELP}
                </span>
              </div>
            )}
          </div>

          {/* notes 입력 */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={Text.NOTE_PLACEHOLDER}
            className="w-full mt-3 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          />

          {error && <p className="text-red-500 text-sm mt-3 animate-shake">{error}</p>}

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
            >
              {Common.CANCEL}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? Common.SAVING : <><Save size={18} /> {Common.SAVE}</>}
            </button>
          </div>
        </div>

        {/* 포스트잇 사이드바 */}
        <div className="absolute top-4 -right-24 flex flex-col gap-1.5 w-[88px]">
          <button
            type="button"
            onClick={() => setNotes(Text.BTN_TOURNAMENT)}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-800 hover:bg-yellow-500/20 border border-slate-600 hover:border-yellow-500/50 rounded-lg text-yellow-400 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a]"
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
              onClick={() => setNotes(sub.value)}
              className="w-full py-1.5 bg-slate-800 hover:bg-emerald-500/20 border border-slate-600 hover:border-emerald-500/50 rounded-lg text-slate-300 hover:text-emerald-300 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a]"
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
              onClick={() => setNotes(sub.value)}
              className="w-full py-1.5 bg-slate-800 hover:bg-purple-500/20 border border-slate-600 hover:border-purple-500/50 rounded-lg text-slate-300 hover:text-purple-300 transition-all text-[11px] font-medium shadow-[2px_2px_0_#0f172a]"
            >
              {sub.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
