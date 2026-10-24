/**
 * 파일명: thetower/front/src/components/Detail/Combat/KillBonusSection.tsx
 * 용도: 전투 리포트 상세의 적 처치 보너스(킬 보너스) 데이터 시각화 섹션
 * 기능: 특정 효과(데스웨이브 등) 활성 상태에서의 처치 수와 전체 적 대비 비율 표시
 */
import { Target } from 'lucide-react';
import { parseGameNumber, formatNumber } from '../../../utils/format';
import { T } from '../../../locales';

interface Props {
  killBonusEntries: [string, any][];
  actualTotalEnemies: number;
}

export default function KillBonusSection({ killBonusEntries, actualTotalEnemies }: Props) {
  const Text = T.detail;

  if (killBonusEntries.length === 0) return null;

  return (
    <div className="w-full pt-8 mt-8 border-t border-slate-800/80 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-emerald-400" />
        <h4 className="text-base font-black text-emerald-400 uppercase tracking-widest">{Text.DASH_KILL_BONUS}</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-none md:grid-flow-col md:auto-cols-fr gap-2.5">
        {killBonusEntries.map(([key, val]) => {
          const valNum = parseGameNumber(String(val));
          const ratio = actualTotalEnemies > 0 ? (valNum / actualTotalEnemies) * 100 : 0;
          return (
            <div
              key={key}
              className="min-w-0 flex flex-col bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 group hover:border-emerald-500/40 transition-all"
            >
              <span className="text-xs font-bold text-slate-300 mb-2 truncate group-hover:text-emerald-300" title={key}>
                {key}
              </span>
              <div className="flex justify-between items-baseline gap-1 mb-2">
                <span className="text-xs font-mono font-medium text-slate-400 leading-none truncate" title={valNum.toLocaleString()}>
                  {formatNumber(valNum)}
                </span>
                <span className="text-sm lg:text-base font-black text-emerald-400 font-mono leading-none shrink-0">
                  {ratio.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500/80 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
