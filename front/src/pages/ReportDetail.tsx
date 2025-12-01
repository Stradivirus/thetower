import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Skull, Shield, Clock, FileText } from 'lucide-react';
import { getFullReport } from '../api/reports';
import type { FullReport } from '../types/report';
import { formatDate } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import StatGrid from '../components/Detail/StatGrid';

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
      {/* === 헤더 === */}
      <div className="flex items-start justify-between mb-8 sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        
        {/* 왼쪽: 뒤로가기 + 날짜/티어 정보 */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              {formatDate(main.battle_date)}
              <span className="text-sm font-normal px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                Tier {main.tier}
              </span>
            </h1>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
               <span className="flex items-center gap-1"><Clock size={14}/> {main.real_time}</span>
               <span>•</span>
               <span>Wave {main.wave}</span>
            </div>
          </div>
        </div>

        {/* 오른쪽: 메모 표시 */}
        {main.notes && (
          <div className="hidden md:flex flex-col items-end max-w-md">
             <div className="flex items-start gap-2 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-sm text-slate-300 shadow-sm">
                <FileText size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="whitespace-pre-wrap leading-relaxed">{main.notes}</p>
             </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. 전투 통계 */}
        <div className="w-full">
            <CombatAnalysis combatJson={detail.combat_json} />
        </div>

        {/* 2. 하단 상세 데이터 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <StatGrid title="유틸리티" icon={Activity} color="text-blue-500" data={detail.utility_json} defaultOpen={false} />
          <StatGrid title="적 통계" icon={Skull} color="text-orange-500" data={detail.enemy_json} defaultOpen={false} />
          <StatGrid title="봇 & 가디언" icon={Shield} color="text-purple-500" data={detail.bot_json} defaultOpen={false} />
        </div>
      </div>
    </div>
  );
}