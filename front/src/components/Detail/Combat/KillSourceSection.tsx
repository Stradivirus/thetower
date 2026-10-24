import { useState } from 'react';
import { Skull, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { StatRow } from './DamageDealerSection';

/** 처치 수단 전용 쿨톤 컬러 팔레트 (좌측 딜 그래프의 웜톤과 시각적 구분) */
const KILL_RANK_COLORS = [
  { text: 'text-sky-400', bg: 'bg-sky-500' },       // 1위
  { text: 'text-indigo-400', bg: 'bg-indigo-500' }, // 2위
  { text: 'text-violet-400', bg: 'bg-violet-500' }, // 3위
  { text: 'text-teal-400', bg: 'bg-teal-500' },     // 4위
  { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500' }, // 5위
];
const DEFAULT_KILL_COLOR = { text: 'text-slate-400', bg: 'bg-slate-500' };

interface KillSourceItemData {
  name: string;
  value: number;
  displayValue: string;
  color: string;
  originalIndex: number;
}

interface Props {
  majorKillSources: KillSourceItemData[];
  minorKillSources: KillSourceItemData[];
  totalKills: number;
  actualTotalEnemies?: number;
}

export default function KillSourceSection({ majorKillSources, minorKillSources, totalKills, actualTotalEnemies }: Props) {
  const [showMinors, setShowMinors] = useState(false);
  const Text = T.detail;

  const baseTotal = totalKills > 0 ? totalKills : (actualTotalEnemies || 0);
  const minorItems: [string, any][] = minorKillSources.map(item => [
    item.name,
    item.value >= 1000 ? formatNumber(item.value) : item.value.toLocaleString(),
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* 분석 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold flex items-center gap-2 text-sky-400">
          <Skull size={20} /> Destroyed By
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{Text.DASH_TOTAL_ENEMIES}</span>
          <span
            className="text-xl font-mono font-bold text-white tracking-tight"
            title={(actualTotalEnemies || totalKills).toLocaleString()}
          >
            {formatNumber(actualTotalEnemies || totalKills)}
          </span>
        </div>
      </div>

      {/* 주요 처치 수단 리스트 (Progress Bar - Cool Tone) */}
      <div className="space-y-3.5 flex-1">
        {majorKillSources.map((item, idx) => {
          const percentage = baseTotal > 0 ? (item.value / baseTotal) * 100 : 0;
          const colorSet = KILL_RANK_COLORS[idx] || DEFAULT_KILL_COLOR;
          return (
            <div key={item.name} className="group">
              <div className="flex justify-between items-end mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-sky-400' : 'text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 font-medium flex items-center gap-1">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono" title={item.value.toLocaleString()}>
                    {formatNumber(item.value)}
                  </span>
                  <span className={`font-bold w-16 text-right text-base font-mono ${colorSet.text}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 소수 처치 수단 섹션 (접이식) */}
      {minorItems.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowMinors(!showMinors)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800/80 pt-4"
          >
            {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>기타 처치 수단 ({minorItems.length}개 항목)</span>
          </button>
          {showMinors && (
            <div className="animate-fade-in pl-1">
              <StatRow items={minorItems} compact />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
