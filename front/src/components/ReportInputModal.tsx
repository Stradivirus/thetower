// [New] src/components/ReportInputModal.tsx
import { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { createReport } from '../api/reports';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportInputModal({ onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createReport(text, notes);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> 전투 기록 입력
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="여기에 전투 기록 텍스트를 붙여넣으세요 (Ctrl+V)..."
          className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
        />

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모를 입력하세요 (예: 신규 모듈 테스트)"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-blue-500 mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : <><Save size={18} /> 저장하기</>}
          </button>
        </div>
      </div>
    </div>
  );
}