import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Search, Clock } from 'lucide-react';
import type { BattleMain } from '../types/report';
import { formatNumber, formatDate } from '../utils/format';

interface MainPageProps {
  reports: BattleMain[];
  onSelectReport: (date: string) => void;
}

export default function MainPage({ reports, onSelectReport }: MainPageProps) {
  const today = new Date().toDateString();
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();

  const todayStats = reports.filter(r => new Date(r.battle_date).toDateString() === today);
  const yesterdayStats = reports.filter(r => new Date(r.battle_date).toDateString() === yesterday);

  const todayCoins = todayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  const yesterdayCoins = yesterdayStats.reduce((acc, cur) => acc + cur.coin_earned, 0);
  
  const coinDiff = todayCoins - yesterdayCoins;
  const coinDiffPercent = yesterdayCoins > 0 ? ((coinDiff / yesterdayCoins) * 100).toFixed(1) : '0';
  
  return (
    <>
        {/* 1. 대시보드 요약 카드 (오늘 vs 어제) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* 오늘 코인 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-yellow-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">오늘 획득 코인</h3>
            <div className="text-3xl font-bold text-white mb-2">{formatNumber(todayCoins)}</div>
            <div className={`flex items-center gap-1 text-sm ${coinDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coinDiff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatNumber(Math.abs(coinDiff))} ({coinDiffPercent}%)</span>
              <span className="text-slate-600 ml-1">vs 어제</span>
            </div>
          </div>

          {/* 오늘 셀 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">오늘 획득 셀</h3>
            <div className="text-3xl font-bold text-white mb-2">
              {todayStats.reduce((acc, cur) => acc + cur.cells_earned, 0).toLocaleString()}
            </div>
            <div className="text-slate-500 text-sm">총 {todayStats.length}판 플레이</div>
          </div>

          {/* 최근 최고 기록 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20"></div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">최근 최고 기록</h3>
            {reports.length > 0 ? (
              <>
                <div className="text-3xl font-bold text-white mb-2">{formatNumber(reports[0].coin_earned)}</div>
                <div className="text-slate-500 text-sm">
                   Tier {reports[0].tier} • Wave {reports[0].wave}
                </div>
              </>
            ) : (
              <div className="text-slate-600 text-sm mt-2">기록 없음</div>
            )}
          </div>
        </div>

        {/* 2. 리스트 섹션 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-slate-500" /> 최근 전투 기록
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

        <div className="grid gap-3">
          {reports.map((report) => (
            <div 
              key={report.battle_date}
              onClick={() => onSelectReport(report.battle_date)}
              className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 text-center">
                   <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Tier</div>
                   <div className="text-white font-bold text-xl">{report.tier}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-medium mb-1">{formatDate(report.battle_date)}</div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={14}/> {report.real_time}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span>Wave {report.wave}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {report.notes && (
                  <div className="hidden md:block text-sm text-slate-400 italic bg-slate-800 px-3 py-1 rounded-full">
                    {report.notes}
                  </div>
                )}
                <div className="text-right min-w-[100px]">
                  <div className="text-yellow-500 font-bold font-mono text-lg">{formatNumber(report.coin_earned)}</div>
                  <div className="text-xs text-slate-600">Coins</div>
                </div>
              </div>
            </div>
          ))}
        </div>
    </>
  );
}
