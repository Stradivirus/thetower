import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Zap, Layers, Skull } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber } from '../../utils/format';
import styles from './Dashboard.module.css';

interface Props {
  reports: BattleMain[];
}

export default function Dashboard({ reports }: Props) {
  // === 통계 계산 로직 ===
  const todayDate = new Date();
  const today = todayDate.toDateString();
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toDateString();

  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const threeDaysAgoTimestamp = twoDaysAgoDate.setHours(0,0,0,0);

  const todayStats = reports.filter(r => new Date(r.battle_date).toDateString() === today);
  const yesterdayStats = reports.filter(r => new Date(r.battle_date).toDateString() === yesterday);

  const todayCoins = todayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const yesterdayCoins = yesterdayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const coinDiff = todayCoins - yesterdayCoins;

  const todayCells = todayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  const yesterdayCells = yesterdayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);

  const todayShards = todayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);
  const yesterdayShards = yesterdayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);

  const recentKillers = useMemo(() => {
    const recentReports = reports.filter(r => {
      const reportDate = new Date(r.battle_date).setHours(0,0,0,0);
      return reportDate >= threeDaysAgoTimestamp;
    });

    const counts: Record<string, number> = {};
    recentReports.forEach(r => {
      counts[r.killer] = (counts[r.killer] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3);
    const total = recentReports.length || 1; 

    return sorted.map(([name, count]) => ({
      name,
      count,
      percent: (count / total) * 100
    }));
  }, [reports, threeDaysAgoTimestamp]);

  return (
    <div className={styles.dashboardGrid}>
      {/* 1. 오늘 코인 */}
      <div className={`${styles.summaryCard} group flex flex-col justify-center`}>
        <div className={`${styles.cardBgEffect} bg-yellow-500/10 group-hover:bg-yellow-500/20`}></div>
        <h3 className={styles.cardTitle}>오늘 획득 코인</h3>
        <div className="flex justify-between items-end">
          <div className="text-3xl font-bold text-white leading-none mb-1">{formatNumber(todayCoins)}</div>
          <div className="text-right flex flex-col gap-1">
            <div className={`flex items-center justify-end gap-1 font-medium text-sm ${coinDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coinDiff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{formatNumber(Math.abs(coinDiff))}</span>
            </div>
            <div className="text-slate-600 text-xs">어제: {formatNumber(yesterdayCoins)}</div>
          </div>
        </div>
      </div>

      {/* 2. 주요 자원 */}
      <div className={`${styles.summaryCard} group flex flex-col justify-center`}>
        <div className={`${styles.cardBgEffect} bg-cyan-500/10 group-hover:bg-cyan-500/20`}></div>
        <h3 className={styles.cardTitle}>오늘 주요 자원</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-cyan-500/20 rounded text-cyan-400"><Zap size={14}/></div>
              <span className="text-slate-400 text-xs font-medium">셀</span>
            </div>
            <div className="text-xl font-bold text-white leading-none">{todayCells.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">어제: {yesterdayCells.toLocaleString()}</div>
          </div>
          <div className="flex flex-col gap-1 border-l border-slate-800 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 bg-green-500/20 rounded text-green-400"><Layers size={14}/></div>
              <span className="text-slate-400 text-xs font-medium">리롤</span>
            </div>
            <div className="text-xl font-bold text-white leading-none">{formatNumber(todayShards)}</div>
            <div className="text-[10px] text-slate-500">어제: {formatNumber(yesterdayShards)}</div>
          </div>
        </div>
      </div>

      {/* 3. 최근 위협 */}
      <div className={`${styles.summaryCard} group`}>
        <div className={`${styles.cardBgEffect} bg-rose-500/10 group-hover:bg-rose-500/20`}></div>
        <h3 className={`${styles.cardTitle} flex items-center gap-2`}>
          <Skull size={16} className="text-rose-500"/> 최근 3일간의 위협
        </h3>
        {recentKillers.length > 0 ? (
          <div className="space-y-3">
            {recentKillers.map((killer, idx) => (
              <div key={killer.name} className="flex justify-between items-center relative z-10 border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-4 h-4 flex items-center justify-center rounded ${idx === 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 font-medium">{killer.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-rose-400 font-bold text-lg mr-1">{killer.count}회</span>
                  <span className="text-slate-500 text-xs font-medium">({Math.round(killer.percent)}%)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-600 text-sm mt-4 text-center">아직 데이터가 충분하지 않습니다.</div>
        )}
      </div>
    </div>
  );
}