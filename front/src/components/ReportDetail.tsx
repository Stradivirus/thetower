import { useState, useEffect } from 'react';
import type{ FullReport } from '../types/report';
import { getFullReport } from '../api/reports';
import CombatStats from './CombatStats.tsx';
import UtilityStats from './UtilityStats.tsx';
import EnemyStats from './EnemyStats.tsx';
import BotGuardianStats from './BotGuardianStats.tsx';

interface ReportDetailProps {
  battleDate: string;
  onBack: () => void;
}

export default function ReportDetail({ battleDate, onBack }: ReportDetailProps) {
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [battleDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getFullReport(battleDate);
      setReport(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || '보고서를 찾을 수 없습니다.'}</p>
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 overflow-y-auto h-screen">
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-gray-100 py-4 z-10">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← 목록으로
        </button>
        <h2 className="text-2xl font-bold">
          {new Date(report.battle_report.battle_date).toLocaleString('ko-KR')}
        </h2>
      </div>

      <div className="space-y-6">
        {/* 전투 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-blue-600">⚔️ 전투 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">게임 시간</div>
              <div className="font-semibold">{report.battle_report.game_time}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">실시간</div>
              <div className="font-semibold">{report.battle_report.real_time}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">티어</div>
              <div className="font-semibold">{report.battle_report.tier}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">웨이브</div>
              <div className="font-semibold">{report.battle_report.wave}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">처치자</div>
              <div className="font-semibold">{report.battle_report.killer}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">보석 블록 탭</div>
              <div className="font-semibold">{report.battle_report.gem_block_tap}</div>
            </div>
          </div>
        </div>

        {/* 획득 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-green-600">💰 획득</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">코인 획득</div>
              <div className="font-semibold text-green-700">{report.battle_report.coin_earned}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">시간당 코인</div>
              <div className="font-semibold text-green-700">{report.battle_report.coin_per_hour}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">캐시 획득</div>
              <div className="font-semibold text-green-700">{report.battle_report.cash_earned}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">이익 획득</div>
              <div className="font-semibold text-green-700">{report.battle_report.profit_earned}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">획득한 셀</div>
              <div className="font-semibold text-green-700">{report.battle_report.cells_earned}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm text-gray-600 mb-1">다시 뽑기 파편</div>
              <div className="font-semibold text-green-700">{report.battle_report.reroll_shards_earned}</div>
            </div>
          </div>
        </div>

        {/* 전투 통계 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-red-600">🗡️ 전투 통계</h3>
          <CombatStats stats={report.combat_stats} />
        </div>

        {/* 유틸리티 통계 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-purple-600">🛠️ 유틸리티</h3>
          <UtilityStats stats={report.utility_stats} />
        </div>

        {/* 적 통계 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-orange-600">👾 적 통계</h3>
          <EnemyStats stats={report.enemy_stats} />
        </div>

        {/* 봇/가디언 통계 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-indigo-600">🤖 봇/가디언</h3>
          <BotGuardianStats stats={report.bot_guardian_stats} />
        </div>
      </div>
    </div>
  );
}