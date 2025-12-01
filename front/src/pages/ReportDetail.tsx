import { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Skull, Shield, Clock, FileText } from 'lucide-react';
import { getFullReport } from '../api/reports';
import type { FullReport } from '../types/report';
import { formatDate } from '../utils/format';
import CombatAnalysis from '../components/Detail/CombatAnalysis';
import StatGrid from '../components/Detail/StatGrid';
import styles from './ReportDetail.module.css';

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
    <div className={styles.container}>
      {/* === 헤더 === */}
      <div className={styles.headerBar}>
        
        {/* 왼쪽: 뒤로가기 + 날짜/티어 정보 */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={styles.pageTitle}>
              {formatDate(main.battle_date)}
              <span className={styles.tierBadge}>Tier {main.tier}</span>
            </h1>
            <div className={styles.subInfo}>
               <span className="flex items-center gap-1"><Clock size={14}/> {main.real_time}</span>
               <span>•</span>
               <span>Wave {main.wave}</span>
            </div>
          </div>
        </div>

        {/* 오른쪽: 메모 표시 */}
        {main.notes && (
          <div className={styles.memoContainer}>
             <div className={styles.memoBox}>
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
        <div className={styles.gridSection}>
          <StatGrid title="유틸리티" icon={Activity} color="text-blue-500" data={detail.utility_json} defaultOpen={true} />
          <StatGrid title="적 통계" icon={Skull} color="text-orange-500" data={detail.enemy_json} defaultOpen={true} />
          <StatGrid title="봇 & 가디언" icon={Shield} color="text-purple-500" data={detail.bot_json} defaultOpen={true} />
        </div>
      </div>
    </div>
  );
}