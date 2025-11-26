import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Zap, Skull, Coins, Sword, Shield, Activity } from 'lucide-react';
import type { FullReport } from '../types/report';
import { getFullReport } from '../api/reports';
import { formatNumber, formatDate } from '../utils/format';

interface Props {
  battleDate: string;
  onBack: () => void;
}

export default function ReportDetail({ battleDate, onBack }: Props) {
  const [data, setData] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFullReport(battleDate).then(setData).finally(() => setLoading(false));
  }, [battleDate]);

  if (loading) return <div className="text-center text-slate-400 py-20">로딩 중...</div>;
  if (!data) return null;

  const { main, detail } = data;

  // JSON 데이터를 렌더링하기 편하게 변환하는 헬퍼
  const StatGrid = ({ data, icon: Icon, title, color }: any) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${color}`}>
        <Icon size={20} /> {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <div className="text-xs text-slate-500 mb-0.5">{key}</div>
            <div className="text-slate-200 font-medium font-mono text-sm truncate" title={String(value)}>
              {String(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-10 border-b border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> 목록으로
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-white">{formatDate(main.battle_date)}</h1>
          <p className="text-slate-500 text-sm">Tier {main.tier} • Wave {main.wave}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 메인 요약 (Main Table Data) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">전투 요약</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Clock size={16}/> 게임 시간</span>
                <span className="text-white font-mono">{main.game_time}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Coins size={16}/> 코인 획득</span>
                <span className="text-yellow-400 font-bold font-mono text-lg">{formatNumber(main.coin_earned)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Zap size={16}/> 셀 획득</span>
                <span className="text-cyan-400 font-bold font-mono">{main.cells_earned}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Skull size={16}/> 처치자</span>
                <span className="text-rose-400">{main.killer}</span>
              </div>
            </div>

            {main.notes && (
              <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">메모</div>
                <div className="text-slate-300 text-sm">{main.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 상세 정보 (JSON Data) - 하이브리드 로딩 */}
        <div className="lg:col-span-2 space-y-6">
          <StatGrid title="전투 통계" icon={Sword} color="text-rose-500" data={detail.combat_json} />
          <StatGrid title="유틸리티" icon={Activity} color="text-blue-500" data={detail.utility_json} />
          <StatGrid title="적 통계" icon={Skull} color="text-orange-500" data={detail.enemy_json} />
          <StatGrid title="봇 & 가디언" icon={Shield} color="text-purple-500" data={detail.bot_json} />
        </div>
      </div>
    </div>
  );
}