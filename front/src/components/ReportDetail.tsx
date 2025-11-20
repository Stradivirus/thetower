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

type TabType = 'overview' | 'combat' | 'utility' | 'enemy' | 'bot';

export default function ReportDetail({ battleDate, onBack }: ReportDetailProps) {
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded">
          돌아가기
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: '개요' },
    { id: 'combat' as TabType, label: '전투' },
    { id: 'utility' as TabType, label: '유틸리티' },
    { id: 'enemy' as TabType, label: '적' },
    { id: 'bot' as TabType, label: '봇/가디언' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        ← 목록으로
      </button>

      <h2 className="text-2xl font-bold mb-4">
        {new Date(report.battle_report.battle_date).toLocaleString('ko-KR')}
      </h2>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid gap-4">
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="font-semibold text-lg mb-3">전투 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">게임 시간:</span> {report.battle_report.game_time}
                </div>
                <div>
                  <span className="text-gray-600">실시간:</span> {report.battle_report.real_time}
                </div>
                <div>
                  <span className="text-gray-600">티어:</span> {report.battle_report.tier}
                </div>
                <div>
                  <span className="text-gray-600">웨이브:</span> {report.battle_report.wave}
                </div>
                <div>
                  <span className="text-gray-600">처치자:</span> {report.battle_report.killer}
                </div>
                <div>
                  <span className="text-gray-600">보석 블록 탭:</span> {report.battle_report.gem_block_tap}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <h3 className="font-semibold text-lg mb-3">획득</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">코인 획득:</span> {report.battle_report.coin_earned}
                </div>
                <div>
                  <span className="text-gray-600">시간당 코인:</span> {report.battle_report.coin_per_hour}
                </div>
                <div>
                  <span className="text-gray-600">캐시 획득:</span> {report.battle_report.cash_earned}
                </div>
                <div>
                  <span className="text-gray-600">이익 획득:</span> {report.battle_report.profit_earned}
                </div>
                <div>
                  <span className="text-gray-600">획득한 셀:</span> {report.battle_report.cells_earned}
                </div>
                <div>
                  <span className="text-gray-600">다시 뽑기 파편:</span> {report.battle_report.reroll_shards_earned}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && <CombatStats stats={report.combat_stats} />}
        {activeTab === 'utility' && <UtilityStats stats={report.utility_stats} />}
        {activeTab === 'enemy' && <EnemyStats stats={report.enemy_stats} />}
        {activeTab === 'bot' && <BotGuardianStats stats={report.bot_guardian_stats} />}
      </div>
    </div>
  );
}