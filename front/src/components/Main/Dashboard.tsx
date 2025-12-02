// src/components/Main/Dashboard.tsx
import { useMemo } from 'react';
import { Zap, Layers, Skull, CalendarDays, ChevronRight } from 'lucide-react';
import type { BattleMain } from '../../types/report';
import { formatNumber } from '../../utils/format';

interface Props {
  reports: BattleMain[];
}

export default function Dashboard({ reports }: Props) {
  // === 1. 날짜 및 통계 계산 로직 (변경 없음) ===
  const todayDate = new Date();
  const todayStr = todayDate.toDateString();
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();

  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgoDate.toDateString();

  // 날짜별 필터링
  const todayStats = reports.filter(r => new Date(r.battle_date).toDateString() === todayStr);
  const yesterdayStats = reports.filter(r => new Date(r.battle_date).toDateString() === yesterdayStr);
  const twoDaysAgoStats = reports.filter(r => new Date(r.battle_date).toDateString() === twoDaysAgoStr);

  // 코인 합계 계산
  const todayCoins = todayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const yesterdayCoins = yesterdayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const twoDaysAgoCoins = twoDaysAgoStats.reduce((acc, cur) => acc + cur.coin_earned, 0);

  // 기타 자원 (오늘/어제)
  const todayCells = todayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  const yesterdayCells = yesterdayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  
  const todayShards = todayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);
  const yesterdayShards = yesterdayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);

  // 최근 위협 (죽은 이유) - 3일치 데이터 기준
  const threeDaysAgoTimestamp = twoDaysAgoDate.setHours(0,0,0,0);
  
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. 최근 코인 획득 흐름 */}
      {/* justify-center 제거, 내부 콘텐츠를 flex-1로 감싸서 정렬 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:bg-yellow-500/10"></div>
        
        {/* 제목: mb-3 추가로 높이 통일 */}
        <h3 className="text-slate-400 text-base font-bold flex items-center justify-center gap-2 z-10 mb-3">
          <CalendarDays size={14} className="text-yellow-500" /> 최근 코인 획득
        </h3>

        {/* 콘텐츠 영역: 남은 공간 차지하며 중앙 정렬 */}
        <div className="flex-1 flex items-center justify-center gap-0.5 z-10 w-full">
          
          {/* 2일 전 */}
          <div className="flex flex-col gap-0.5 items-center opacity-60">
            <span className="text-[10px] text-slate-500 font-medium">2일 전</span>
            <span className="text-lg text-slate-400 font-mono font-bold leading-none">{formatNumber(twoDaysAgoCoins)}</span>
          </div>

          {/* 화살표 */}
          <div className="text-slate-700 opacity-60 px-1">
            <ChevronRight size={20} />
          </div>

          {/* 어제 */}
          <div className="flex flex-col gap-0.5 items-center opacity-80">
            <span className="text-[10px] text-slate-400 font-medium">어제</span>
            <span className="text-xl text-slate-300 font-mono font-bold leading-none">{formatNumber(yesterdayCoins)}</span>
          </div>

          {/* 화살표 */}
          <div className="text-slate-600 px-1">
            <ChevronRight size={20} />
          </div>

          {/* 오늘 */}
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-xs text-yellow-500 font-bold drop-shadow-sm">Today</span>
            <div className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-none drop-shadow-md font-mono">
              {formatNumber(todayCoins)}
            </div>
          </div>

        </div>
      </div>

      {/* 2. 오늘 주요 자원 */}
      {/* justify-center 제거 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-cyan-500/10 group-hover:bg-cyan-500/20"></div>
        
        {/* 제목 */}
        <h3 className="text-slate-400 text-base font-bold mb-3 flex items-center justify-center gap-2 z-10">
          오늘 주요 자원
        </h3>
        
        {/* 콘텐츠 영역 */}
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

      {/* 3. 최근 위협 */}
      {/* justify-center 제거 */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group flex flex-col min-h-[140px]">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-all bg-rose-500/10 group-hover:bg-rose-500/20"></div>
        
        {/* 제목 */}
        <h3 className="text-slate-400 text-base font-bold mb-3 flex items-center justify-center gap-2 z-10">
          <Skull size={14} className="text-rose-500"/> 3일간의 죽은 이유
        </h3>
        
        {/* 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col justify-center w-full z-10">
          {recentKillers.length > 0 ? (
            <div className="space-y-3 px-2 w-full">
              {recentKillers.map((killer, idx) => (
                <div key={killer.name} className="flex justify-between items-center relative z-10 border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 ${idx === 0 ? 'text-rose-500 border-rose-500/30' : 'text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 font-medium text-sm truncate max-w-[100px]">{killer.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="text-rose-400 font-bold text-base">{killer.count}회</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 text-sm mt-2 text-center">아직 데이터가 충분하지 않습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}