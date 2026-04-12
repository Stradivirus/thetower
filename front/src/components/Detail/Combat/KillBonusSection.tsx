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

  return (
    <div className="lg:w-1/4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
              <Target size={18} className="text-emerald-400" />
              <h4 className="text-base font-black text-emerald-400 uppercase tracking-widest">{Text.DASH_KILL_BONUS}</h4>
          </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
          {killBonusEntries.map(([key, val]) => {
              const valNum = parseGameNumber(String(val));
              const ratio = actualTotalEnemies > 0 ? (valNum / actualTotalEnemies) * 100 : 0;
              return (
                  <div key={key} className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3 group hover:border-emerald-500/30 transition-all">
                      <span className="text-[12px] font-bold text-slate-300 mb-1.5 truncate group-hover:text-emerald-400" title={key}>{key}</span>
                      <div className="flex justify-between items-end">
                          <span className="text-sm font-mono font-bold text-white leading-none">{formatNumber(valNum)}</span>
                          <span className="text-base font-black text-emerald-400/80 font-mono leading-none">{ratio.toFixed(1)}%</span>
                      </div>
                  </div>
              );
          })}
      </div>

      {actualTotalEnemies > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800/50">
              <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                  <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-tighter mb-1">{Text.DASH_TOTAL_ENEMIES}</span>
                  <span className="text-base font-mono font-bold text-emerald-400">{actualTotalEnemies.toLocaleString()}</span>
              </div>
          </div>
      )}
    </div>
  );
}
