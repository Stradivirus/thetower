/**
 * 파일명: thetower/front/src/components/Main/Dashboard.tsx
 * 용도: 메인 페이지 상단의 핵심 통계 요약 대시보드
 * 기능: 일간 코인 흐름 비교, 주요 자원(셀, 리롤 파편) 현황, 최근 죽음 원인 및 딜량 순위 시각화
 */
import { useMemo } from 'react';
import { Zap, Layers, Skull, CalendarDays, Sword } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber } from '../../utils/format';
import { T } from '../../locales'; 

interface Props {
  reports: BattleMain[]; // 통계 계산 대상 리포트 목록
}

export default function Dashboard({ reports }: Props) {
  const Text = T.main.DASHBOARD;

  // --- 날짜 계산 로직 ---
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgoDate.toDateString();

  // --- 통계 집계 로직 ---
  const todayStats = reports.filter(r => new Date(r.battle_date).toDateString() === todayStr);
  const yesterdayStats = reports.filter(r => new Date(r.battle_date).toDateString() === yesterdayStr);
  const twoDaysAgoStats = reports.filter(r => new Date(r.battle_date).toDateString() === twoDaysAgoStr);

  const todayCoins = todayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const yesterdayCoins = yesterdayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const twoDaysAgoCoins = twoDaysAgoStats.reduce((acc, cur) => acc + cur.coin_earned, 0);

  const todayCells = todayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  const yesterdayCells = yesterdayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  
  const todayShards = todayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);
  const yesterdayShards = yesterdayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);

  // 최근 일주일간의 데이터 필터링 (위협 및 딜 순위용)
  const oneWeekAgoDate = new Date(todayDate);
  oneWeekAgoDate.setDate(oneWeekAgoDate.getDate() - 7);
  const oneWeekAgoTimestamp = oneWeekAgoDate.setHours(0,0,0,0);
  
  const recentReports = reports.filter(r => {
    const reportDate = new Date(r.battle_date).setHours(0,0,0,0);
    return reportDate >= oneWeekAgoTimestamp;
  });

  /** 
   * [최근 위협] 최근 1주일간 가장 많이 죽게 만든 '처치자' TOP 3 집계
   */
  const recentKillers = useMemo(() => {
    const counts: Record<string, number> = {};
    recentReports.forEach(r => {
      counts[r.killer] = (counts[r.killer] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [recentReports]);

  /** 
   * [주간 딜 순위] 최근 1주일간 가장 빈번하게 TOP Damage에 이름을 올린 스탯 TOP 3 집계
   */
  const topDamages = useMemo(() => {
    const damageCountMap: Record<string, number> = {};
    // 유틸리티 및 전체 통계 항목(오브, 블랙홀, 입힌/받은 대미지 등)은 순위에서 제외
    const excludeKeywords = [
      '오브', '블랙홀', 'Orb', 'Black Hole', 
      '입힌', '받은', 'Damage', 'Tower', '타워'
    ]; 

    recentReports.forEach(r => {
      (r.top_damages || []).forEach((name: string) => {
        // 대소문자 무시 및 부분 일치 검사로 더 강력하게 필터링
        const isExcluded = excludeKeywords.some(keyword => 
          name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (isExcluded) return;
        
        damageCountMap[name] = (damageCountMap[name] || 0) + 1;
      });
    });

    return Object.entries(damageCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name], idx) => ({ rank: idx + 1, name }));
  }, [recentReports]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      
      {/* 1. 최근 코인 획득 흐름 섹션 */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-yellow-500/10"></div>
        <h3 className="text-slate-400 text-base font-bold flex items-center justify-center gap-2 z-10 mb-3">
          <CalendarDays size={14} className="text-yellow-500" /> {Text.COIN_FLOW}
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 z-10 w-full">
          <div className="flex items-center justify-between w-full px-4">
            <span className="text-xs text-yellow-500 font-bold">{Text.TODAY}</span>
            <div className="text-2xl font-bold text-white tracking-tight leading-none font-mono">
              {formatNumber(todayCoins)}
            </div>
          </div>
          <div className="flex items-center justify-between w-full px-4 opacity-80">
            <span className="text-xs text-slate-400 font-medium">{Text.YESTERDAY}</span>
            <span className="text-xl text-slate-300 font-mono font-bold leading-none">{formatNumber(yesterdayCoins)}</span>
          </div>
          <div className="flex items-center justify-between w-full px-4 opacity-60">
            <span className="text-[10px] text-slate-500 font-medium">{Text.DAYS_AGO}</span>
            <span className="text-lg text-slate-400 font-mono font-bold leading-none">{formatNumber(twoDaysAgoCoins)}</span>
          </div>
        </div>
      </div>

      {/* 2. 오늘 주요 자원 섹션 */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-cyan-500/10 group-hover:bg-cyan-500/20"></div>
        <h3 className="text-slate-400 text-base font-bold mb-3 flex items-center justify-center gap-2 z-10">
          {Text.RESOURCE_TODAY}
        </h3>
        <div className="flex-1 flex items-center justify-center w-full z-10">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-cyan-500/20 rounded text-cyan-400"><Zap size={16}/></div>
                <span className="text-slate-400 text-sm font-medium">{T.main.ITEM.CELLS}</span>
              </div>
              <div className="text-2xl font-bold text-white leading-none font-mono">{todayCells.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">{Text.YESTERDAY}: {yesterdayCells.toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-green-500/20 rounded text-green-400"><Layers size={16}/></div>
                <span className="text-slate-400 text-sm font-medium">{Text.REROLL}</span>
              </div>
              <div className="text-2xl font-bold text-white leading-none font-mono">{formatNumber(todayShards)}</div>
              <div className="text-xs text-slate-500 mt-1">{Text.YESTERDAY}: {formatNumber(yesterdayShards)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 최근 위협 섹션 */}
      <div className="bg-slate-900 border border-slate-800 p-2 md:p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-rose-500/10 group-hover:bg-rose-500/20"></div>
        <h3 className="text-slate-400 font-bold mb-2 md:mb-3 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 z-10 text-xs md:text-base">
          <div className="flex items-center gap-1">
            <Skull size={14} className="text-rose-500"/> 
            <span>{Text.DEATH_REASON}</span>
          </div>
          <span className="text-slate-600 font-normal text-[10px] hidden md:inline">{Text.RECENT_WEEK}</span>
        </h3>
        <div className="flex-1 flex flex-col justify-center w-full z-10">
          {recentKillers.length > 0 ? (
            <div className="space-y-1.5 md:space-y-3 px-1 md:px-2 w-full">
              {recentKillers.map((killer, idx) => (
                <div key={killer.name} className="flex justify-between items-center relative z-10 border-b border-slate-800/50 pb-1 md:pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <span className={`text-[10px] md:text-xs font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 ${idx === 0 ? 'text-rose-500 border-rose-500/30' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 font-medium text-[11px] md:text-sm truncate max-w-[50px] md:max-w-[100px]">{killer.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-1 flex-shrink-0">
                    <span className="text-rose-400 font-bold text-xs md:text-base">{killer.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-[10px] md:text-sm mt-2 text-center">{Text.NO_DATA}</div>
          )}
        </div>
      </div>

      {/* 4. 주간 딜 순위 섹션 */}
      <div className="bg-slate-900 border border-slate-800 p-2 md:p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-purple-500/10 group-hover:bg-purple-500/20"></div>
        <h3 className="text-slate-400 font-bold mb-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 z-10 text-xs md:text-base">
          <div className="flex items-center gap-1">
             <Sword size={14} className="text-purple-500"/> 
             <span>{Text.DAMAGE_RANK}</span>
          </div>
          <span className="text-slate-600 font-normal text-[10px] hidden md:inline">{Text.RECENT_WEEK}</span>
        </h3>
        <div className="text-[10px] text-slate-600 text-center mb-2 md:mb-3 z-10 hidden md:block">{Text.DAMAGE_FREQ}</div>
        
        <div className="flex-1 flex flex-col justify-center w-full z-10">
          {topDamages.length > 0 ? (
            <div className="space-y-1.5 md:space-y-3 px-1 md:px-2 w-full">
              {topDamages.map((dmg, idx) => (
                <div key={dmg.name} className="flex justify-between items-center relative z-10 border-b border-slate-800/50 pb-1 md:pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-1.5 md:gap-2 w-full min-w-0">
                    <span className={`text-[10px] md:text-xs font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 ${idx === 0 ? 'text-purple-400 border-purple-500/30' : 'text-slate-500'}`}>
                      {dmg.rank}
                    </span>
                    <span className={`font-medium text-[11px] md:text-sm truncate w-full ${idx === 0 ? 'text-purple-300' : 'text-slate-300'}`}>
                      {dmg.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-[10px] md:text-sm mt-2 text-center">{Text.NO_DATA}</div>
          )}
        </div>
      </div>

    </div>
  );
}