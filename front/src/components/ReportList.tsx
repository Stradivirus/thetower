import { useState, useEffect } from 'react';
import type { BattleReport } from '../types/report';
import { getReports } from '../api/reports';

interface ReportListProps {
  onSelectReport: (battleDate: string) => void;
  refreshTrigger: number;
}

export default function ReportList({ onSelectReport, refreshTrigger }: ReportListProps) {
  const [reports, setReports] = useState<BattleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReports();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        저장된 보고서가 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">전투 기록</h2>
      
      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.battle_date}
            onClick={() => onSelectReport(report.battle_date)}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {new Date(report.battle_date).toLocaleString('ko-KR')}
                </h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
    </div>
  );
}