import { useMemo } from 'react';
import { Zap, Layers, Skull, CalendarDays, Sword } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber, parseGameNumber } from '../../utils/format';

interface Props {
  reports: BattleMain[];
}

export default function Dashboard({ reports }: Props) {
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgoDate.toDateString();

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

  const oneWeekAgoDate = new Date(todayDate);
  oneWeekAgoDate.setDate(oneWeekAgoDate.getDate() - 7);
  const oneWeekAgoTimestamp = oneWeekAgoDate.setHours(0,0,0,0);
  
  const recentReports = reports.filter(r => {
    const reportDate = new Date(r.battle_date).setHours(0,0,0,0);
    return reportDate >= oneWeekAgoTimestamp;
  });

  const recentKillers = useMemo(() => {
    const counts: Record<string, number> = {};
    recentReports.forEach(r => {
      counts[r.killer] = (counts[r.killer] || 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, count]) => ({ name, count }));
  }, [recentReports]);

  const topDamages = useMemo(() => {
    const damageMap: Record<string, number> = {};
    const utilityKeywords = ['오브', '블랙홀'];

    recentReports.forEach(r => {
      (r.top_damages || []).forEach(dmg => {
        if (utilityKeywords.includes(dmg.name)) return;
        const val = parseGameNumber(dmg.value);
        damageMap[dmg.name] = (damageMap[dmg.name] || 0) + val;
      });
    });

    return Object.entries(damageMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name], idx) => ({ rank: idx + 1, name }));
  }, [recentReports]);

  return (
    // [수정] Grid 설정: 모바일에서는 2열(grid-cols-2)로 시작
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      
      {/* 1. 최근 코인 획득 흐름 - [수정] 모바일에서 2칸 차지 (col-span-2) -> 한 줄 꽉 채움 */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-yellow-500/10"></div>
        <h3 className="text-slate-400 text-base font-bold flex items-center justify-center gap-2 z-10 mb-3">
          <CalendarDays size={14} className="text-yellow-500" /> 최근 코인 획득
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center gap-2 z-10 w-full">
          {/* Today */}
          <div className="flex items-center justify-between w-full px-4">
            <span className="text-xs text-yellow-500 font-bold">Today</span>
            <div className="text-2xl font-bold text-white tracking-tight leading-none font-mono">
              {formatNumber(todayCoins)}
            </div>
          </div>
          
          {/* 어제 */}
          <div className="flex items-center justify-between w-full px-4 opacity-80">
            <span className="text-xs text-slate-400 font-medium">어제</span>
            <span className="text-xl text-slate-300 font-mono font-bold leading-none">{formatNumber(yesterdayCoins)}</span>
          </div>
          
          {/* 2일 전 */}
          <div className="flex items-center justify-between w-full px-4 opacity-60">
            <span className="text-[10px] text-slate-500 font-medium">2일 전</span>
            <span className="text-lg text-slate-400 font-mono font-bold leading-none">{formatNumber(twoDaysAgoCoins)}</span>
          </div>
        </div>
      </div>

      {/* 2. 오늘 주요 자원 - [수정] 모바일에서 2칸 차지 (col-span-2) -> 한 줄 꽉 채움 */}
      <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-cyan-500/10 group-hover:bg-cyan-500/20"></div>
        <h3 className="text-slate-400 text-base font-bold mb-3 flex items-center justify-center gap-2 z-10">
          오늘 주요 자원
        </h3>
        <div className="flex-1 flex items-center justify-center w-full z-10">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-cyan-500/20 rounded text-cyan-400"><Zap size={16}/></div>
                <span className="text-slate-400 text-sm font-medium">셀</span>
              </div>
              <div className="text-2xl font-bold text-white leading-none font-mono">{todayCells.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">어제: {yesterdayCells.toLocaleString()}</div>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-green-500/20 rounded text-green-400"><Layers size={16}/></div>
                <span className="text-slate-400 text-sm font-medium">리롤</span>
              </div>
              <div className="text-2xl font-bold text-white leading-none font-mono">{formatNumber(todayShards)}</div>
              <div className="text-xs text-slate-500 mt-1">어제: {formatNumber(yesterdayShards)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 최근 위협 (죽은 이유) - [수정] 모바일에서 1칸 차지 -> 옆 친구랑 나란히 섬 */}
      <div className="bg-slate-900 border border-slate-800 p-2 md:p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-rose-500/10 group-hover:bg-rose-500/20"></div>
        <h3 className="text-slate-400 font-bold mb-2 md:mb-3 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 z-10 text-xs md:text-base">
          <div className="flex items-center gap-1">
            <Skull size={14} className="text-rose-500"/> 
            <span>죽은 이유</span>
          </div>
          {/* 모바일에서는 '최근 1주일' 숨김 처리하여 공간 확보 */}
          <span className="text-slate-600 font-normal text-[10px] hidden md:inline">(최근 1주일)</span>
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
                    <span className="text-rose-400 font-bold text-xs md:text-base">{killer.count}회</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-[10px] md:text-sm mt-2 text-center">데이터 없음</div>
          )}
        </div>
      </div>

      {/* 4. 주간 딜 순위 - [수정] 모바일에서 1칸 차지 -> 옆 친구랑 나란히 섬 */}
      <div className="bg-slate-900 border border-slate-800 p-2 md:p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-purple-500/10 group-hover:bg-purple-500/20"></div>
        <h3 className="text-slate-400 font-bold mb-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 z-10 text-xs md:text-base">
          <div className="flex items-center gap-1">
             <Sword size={14} className="text-purple-500"/> 
             <span>딜 순위</span>
          </div>
          <span className="text-slate-600 font-normal text-[10px] hidden md:inline">(최근 1주일)</span>
        </h3>
        <div className="text-[10px] text-slate-600 text-center mb-2 md:mb-3 z-10 hidden md:block">(오브, 블랙홀 제외)</div>
        
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
            <div className="text-slate-600 text-[10px] md:text-sm mt-2 text-center">데이터 없음</div>
          )}
        </div>
      </div>

    </div>
  );
}