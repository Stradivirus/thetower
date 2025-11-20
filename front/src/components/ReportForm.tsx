import { useState } from 'react';
import { createReport } from '../api/reports';

interface ReportFormProps {
  onSuccess: () => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createReport(reportText);
      setSuccess(true);
      setReportText('');
      onSuccess();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">전투 보고서 입력</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="전투 보고서를 여기에 붙여넣으세요..."
          className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
          disabled={loading}
        />
        
        <div className="mt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || !reportText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
          
          {success && (
            <span className="text-green-600 font-medium">✓ 저장되었습니다!</span>
          )}
          
          {error && (
            <span className="text-red-600">{error}</span>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">단위 표기</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div><span className="font-mono">K</span> = 천 (1,000)</div>
          <div><span className="font-mono">M</span> = 백만 (1,000,000)</div>
          <div><span className="font-mono">B</span> = 10억 (10⁹)</div>
          <div><span className="font-mono">T</span> = 1조 (10¹²)</div>
          <div><span className="font-mono">q</span> = 10¹⁵</div>
          <div><span className="font-mono">Q</span> = 10¹⁸</div>
          <div><span className="font-mono">s</span> = 10²¹</div>
          <div><span className="font-mono">S</span> = 10²⁴</div>
        </div>
      </div>
    </div>
  );
}