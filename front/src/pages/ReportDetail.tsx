// src/pages/ReportDetailPage.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Skull, Shield } from 'lucide-react';
import { getFullReport } from '../api/reports';
import type { FullReport } from '../types/report';
import { formatDate } from '../utils/format';

// 분리된 컴포넌트들 임포트
import BattleSummary from '../components/BattleSummary';
import CombatAnalysis from '../components/CombatAnalysis';
import StatGrid from '../components/StatGrid';

interface Props {
  battleDate: string;
  onBack: () => void;
}

export default function ReportDetailPage({ battleDate, onBack }: Props) {
  const [data, setData] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFullReport(battleDate).then(setData).finally(() => setLoading(false));
  }, [battleDate]);

  if (loading) return <div className="text-center text-slate-400 py-20">로딩 중...</div>;
  if (!data) return null;

  const { main, detail } = data;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> 목록으로
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-white">{formatDate(main.battle_date)}</h1>
          <p className="text-slate-500 text-sm">Tier {main.tier} • Wave {main.wave}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 상단: 요약 + 전투 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <BattleSummary main={main} />
          </div>
          <div className="lg:col-span-2">
            <CombatAnalysis combatJson={detail.combat_json} />
          </div>
        </div>

        {/* 하단: 나머지 통계 (가로 배치) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <StatGrid title="유틸리티" icon={Activity} color="text-blue-500" data={detail.utility_json} defaultOpen={false} />
          <StatGrid title="적 통계" icon={Skull} color="text-orange-500" data={detail.enemy_json} defaultOpen={false} />
          <StatGrid title="봇 & 가디언" icon={Shield} color="text-purple-500" data={detail.bot_json} defaultOpen={false} />
        </div>
      </div>
    </div>
  );
}