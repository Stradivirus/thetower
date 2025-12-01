import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Search, Zap, Layers, Skull } from 'lucide-react';
import type { BattleMain } from '../types/report';
import { formatNumber, formatDateHeader, formatTimeOnly } from '../utils/format';

interface MainPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function MainPage({ reports, onSelectReport }: MainPageProps) {
  // === 1. 대시보드 통계 계산 ===
  const todayDate = new Date();
  const today = todayDate.toDateString();
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toDateString();

  const twoDaysAgoDate = new Date(todayDate);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const threeDaysAgoTimestamp = twoDaysAgoDate.setHours(0,0,0,0);

  // 일자별 필터링
  const todayStats = reports.filter(r => new Date(r.battle_date).toDateString() === today);
  const yesterdayStats = reports.filter(r => new Date(r.battle_date).toDateString() === yesterday);

  // [Coins]
  const todayCoins = todayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const yesterdayCoins = yesterdayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const coinDiff = todayCoins - yesterdayCoins;

  // [Cells]
  const todayCells = todayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);
  const yesterdayCells = yesterdayStats.reduce((acc, cur) => acc + cur.cells_earned, 0);

  // [Shards]
  const todayShards = todayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);
  const yesterdayShards = yesterdayStats.reduce((acc, cur) => acc + cur.reroll_shards_earned, 0);

  // [Killer Analysis - Last 3 Days]
  const recentKillers = useMemo(() => {
    const recentReports = reports.filter(r => {
      const reportDate = new Date(r.battle_date).setHours(0,0,0,0);
      return reportDate >= threeDaysAgoTimestamp;
    });

    const counts: Record<string, number> = {};
    recentReports.forEach(r => {
      counts[r.killer] = (counts[r.killer] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    const total = recentReports.length || 1; 

    return sorted.map(([name, count]) => ({
      name,
      count,
      percent: (count / total) * 100
    }));
  }, [reports, threeDaysAgoTimestamp]);


  // === 2. 날짜별 그룹화 로직 ===
  const groupedReports = useMemo(() => {
    const groups: Record<string, BattleMain[]> = {};
    
    reports.forEach(report => {
      const dateKey = formatDateHeader(report.battle_date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(report);
    });

    return Object.entries(groups);
  }, [reports]);

  return (
    <>
        {/* === 상단 대시보드 === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-8">
          
          {/* 1. 오늘 코인 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-center min-h-[100px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-4">오늘 획득 코인</h3>
            
            <div className="flex justify-between items-end">
              <div className="text-3xl font-bold text-white leading-none mb-1">{formatNumber(todayCoins)}</div>
              
              <div className="text-right flex flex-col gap-1">
                <div className={`flex items-center justify-end gap-1 font-medium text-sm ${coinDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coinDiff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{formatNumber(Math.abs(coinDiff))}</span>
                </div>
                <div className="text-slate-600 text-xs">
                  어제: {formatNumber(yesterdayCoins)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. [Updated] 주요 자원 (가로 배치) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group flex flex-col justify-center min-h-[140px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-4">오늘 주요 자원</h3>
            
            {/* 가로 배치를 위해 grid-cols-2 사용 */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cells */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-cyan-500/20 rounded text-cyan-400"><Zap size={14}/></div>
                  <span className="text-slate-400 text-xs font-medium">셀</span>
                </div>
                <div className="text-xl font-bold text-white leading-none">{todayCells.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">어제: {yesterdayCells.toLocaleString()}</div>
              </div>

              {/* Shards */}
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

          {/* 3. [Updated] 최근 3일간의 위협 (바 제거, 텍스트 강조) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group min-h-[140px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-rose-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
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
                      <span className="text-slate-200 font-medium">
                        {killer.name}
                      </span>
                    </div>
                    {/* [Updated] 바 제거 -> 텍스트 강조 (크기 UP, 색상 변경) */}
                    <div className="text-right">
                      <span className="text-rose-400 font-bold text-lg mr-1">{killer.count}회</span>
                      <span className="text-slate-500 text-xs font-medium">({Math.round(killer.percent)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-600 text-sm mt-4 text-center">
                아직 데이터가 충분하지 않습니다.
              </div>
            )}
          </div>
        </div>

        {/* === 검색 및 타이틀 바 === */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-slate-500" /> 전투 기록
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="메모 검색..." 
              className="bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600 w-64"
            />
          </div>
        </div>

        {/* === 테이블 헤더 === */}
        <div className="hidden md:flex gap-6 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">
          <div className="w-32 flex-shrink-0">Date</div>
          <div className="flex-1 grid grid-cols-12 gap-2">
            <div className="col-span-3 grid grid-cols-2">
              <span>Time</span>
              <span>Wave</span>
            </div>
            <div className="col-span-1 text-right">Coins</div>
            <div className="col-span-2 text-right">CPH (Hr)</div>
            <div className="col-span-3 text-right">Resources</div>
            <div className="col-span-1 text-center">Killer</div>
            <div className="col-span-2 text-left pl-2">Memo</div>
          </div>
        </div>

        {/* === 날짜별 그룹 리스트 === */}
        <div className="space-y-0">
          {groupedReports.map(([dateHeader, groupItems]) => (
            <div key={dateHeader} className="flex flex-col md:flex-row gap-6 border-b border-slate-800/50 py-6 last:border-0">
              
              {/* 왼쪽: 날짜 */}
              <div className="md:w-32 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="text-slate-200 font-bold text-sm leading-tight mb-1">
                    {dateHeader.split(' ').slice(0, 3).join(' ')}
                  </h3>
                  <div className="text-slate-500 text-xs font-medium">
                    {dateHeader.split(' ').slice(3).join(' ')}
                  </div>
                  <div className="mt-2 text-[10px] text-blue-400 font-mono bg-blue-500/10 inline-block px-2 py-0.5 rounded border border-blue-500/20">
                    {groupItems.length} Games
                  </div>
                </div>
              </div>

              {/* 오른쪽: 리스트 아이템 */}
              <div className="flex-1 space-y-2">
                {groupItems.map((report) => (
                  <div 
                    key={report.battle_date}
                    onClick={() => onSelectReport(report.battle_date)}
                    className="group bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 py-3 px-4 rounded-xl cursor-pointer transition-all grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                  >
                    {/* Time & Wave */}
                    <div className="md:col-span-3 grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <div className="text-white font-medium text-sm">{report.real_time}</div>
                        <div className="text-slate-500 text-xs">{formatTimeOnly(report.battle_date)}</div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-white font-medium text-sm">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">T{report.tier}</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-0.5">Wave {report.wave}</div>
                      </div>
                    </div>

                    {/* Coins */}
                    <div className="md:col-span-1 text-right">
                      <div className="text-yellow-400 font-bold font-mono text-xl">{formatNumber(report.coin_earned)}</div>
                    </div>

                    {/* CPH */}
                    <div className="md:col-span-2 text-right">
                       <div className="text-slate-300 font-mono font-medium">{formatNumber(report.coins_per_hour)}/h</div>
                    </div>

                    {/* Resources */}
                    <div className="md:col-span-3 flex justify-end gap-3 text-right">
                      <div>
                        <div className="text-cyan-400 font-mono font-medium">{report.cells_earned.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-end gap-1"><Zap size={10}/> Cells</div>
                      </div>
                      <div>
                        <div className="text-green-400 font-mono font-medium">{formatNumber(report.reroll_shards_earned)}</div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-end gap-1"><Layers size={10}/> 리롤</div>
                      </div>
                    </div>

                    {/* Killer */}
                    <div className="md:col-span-1 text-center">
                      <span className="inline-flex items-center justify-center w-full px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 truncate">
                        {report.killer}
                      </span>
                    </div>

                    {/* Memo */}
                    <div className="md:col-span-2 pl-2">
                       {report.notes ? (
                         <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 truncate" title={report.notes}>
                           {report.notes}
                         </div>
                       ) : (
                         <div className="h-6"></div> 
                       )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    </>
  );
}