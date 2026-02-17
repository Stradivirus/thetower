/**
 * 파일명: thetower/front/src/components/Detail/ReportInputModal.tsx
 * 용도: 새로운 전투 리포트 텍스트를 입력받아 서버로 전송하는 모달
 * 기능: 텍스트 붙여넣기 폼 제공, 토너먼트 여부 등 메모 추가 기능, API 연동 및 전송 상태 피드백
 */
import { useState } from 'react';
import { X, Save, FileText, Trophy } from 'lucide-react';
import { createReport } from '../../api/reports';
import { T } from '../../locales'; 

interface Props {
  onClose: () => void;   // 모달 닫기 핸들러
  onSuccess: () => void; // 등록 성공 시 호출할 콜백 (데이터 새로고침 등)
}

export default function ReportInputModal({ onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Text = T.detail;
  const Common = T.common;

  /** 
   * 리포트 제출 핸들러
   * - 빈 텍스트 체크 후 서버 API 호출
   */
  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await createReport(text, notes);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : Text.ERR_SAVE_FAIL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-fade-in">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> {Text.INPUT_TITLE}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X />
          </button>
        </div>

        {/* 텍스트 입력 영역 (전투 리포트 복사본 붙여넣기) */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={Text.INPUT_PLACEHOLDER}
          className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none mb-4 custom-scrollbar"
        />

        {/* 메모/노트 입력 영역 */}
        <div className="flex gap-2 mb-4">
          {/* 토너먼트 퀵 버튼 */}
          <button
            type="button"
            onClick={() => setNotes(Text.BTN_TOURNAMENT)}
            className="flex items-center gap-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors whitespace-nowrap"
          >
            <Trophy size={16} className="text-yellow-500" />
            <span>{Text.BTN_TOURNAMENT}</span>
          </button>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={Text.NOTE_PLACEHOLDER}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 에러 메시지 */}
        {error && <p className="text-red-500 text-sm mb-4 animate-shake">{error}</p>}

        {/* 푸터 버튼 영역 */}
        <div className="flex justify-end gap-3">
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
    </div>
  );
}