import { useState, useEffect } from 'react';
import type { BattleReport } from '../types/report';
import { getReports, createReport } from '../api/reports';

interface ReportManagerProps {
  onSelectReport?: (battleDate: string) => void;
}

export default function ReportManager({ onSelectReport }: ReportManagerProps) {
  const [reports, setReports] = useState<BattleReport[]>([]);
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setListLoading(true);
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createReport(reportText);
      setSuccess(true);
      setReportText('');
      await fetchReports();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 왼쪽: 입력 폼 */}
      <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">전투 보고서 입력</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
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

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">단위 표기</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
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

      {/* 오른쪽: 리스트 */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">전투 기록</h2>
        
        {listLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            저장된 보고서가 없습니다.
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <div
                key={report.battle_date}
                onClick={() => onSelectReport?.(report.battle_date)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {new Date(report.battle_date).toLocaleString('ko-KR')}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">티어:</span> {report.tier}
                      </div>
                      <div>
                        <span className="text-gray-600">웨이브:</span> {report.wave}
                      </div>
                      <div>
                        <span className="text-gray-600">코인:</span> {report.coin_earned}
                      </div>
                      <div>
                        <span className="text-gray-600">처치자:</span> {report.killer}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    플레이 시간: {report.real_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}