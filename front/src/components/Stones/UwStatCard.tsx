/**
 * 파일명: thetower/front/src/components/Stones/UwStatCard.tsx
 * 용도: 궁극 무기(UW) 연구실(Lab) 토글 카드 및 개별 스탯 비용 테이블 카드 컴포넌트
 * 기능: Lab ON/OFF 토글, 스탯 레벨별/누적 스톤 비용 표시 및 클릭 시 진행도 업데이트
 */
import { ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';
import { sumCostsUpToLevel } from '../../utils/stoneCalculations';
import { T } from '../../locales';

/** 
 * 연구소(Lab) 효과를 켜고 끌 수 있는 카드형 버튼
 */
export function LabCard({
  labKey,
  labInfo,
  progress,
  updateProgress,
}: {
  labKey: string;
  labInfo: any;
  progress: Record<string, any>;
  updateProgress: (key: string, level: number) => void;
}) {
  const progressKey = `${labKey}_on`;
  const isEnabled = progress[progressKey] === 1;
  const ToggleIcon = isEnabled ? ToggleRight : ToggleLeft;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProgress(progressKey, isEnabled ? 0 : 1);
  };

  const displayValue = `+${labInfo.value}${labInfo.unit}`;
  const shortName = labInfo.name.split(' ')[1] || labInfo.name;
  const hoverText = labInfo.desc;

  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded-xl shadow-md transition-all cursor-pointer
        ${isEnabled
          ? 'bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30'
          : 'bg-slate-900 border border-slate-800 hover:border-slate-500/50'
        }
      `}
      onClick={handleToggle}
      title={hoverText}
    >
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className={`${isEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
        <span className={`font-bold text-sm ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
          Lab: {shortName} ({displayValue})
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-bold ${isEnabled ? 'text-yellow-400' : 'text-slate-500'}`}>
          {isEnabled ? 'ON' : 'OFF'}
        </span>
        <ToggleIcon size={20} className={isEnabled ? 'stroke-blue-400' : 'stroke-slate-500'} />
      </div>
    </div>
  );
}

interface UwStatCardProps {
  category: 'base' | 'plus';
  uwKey: string;
  uwDisplayName: string;
  statName: string;
  detail: any;
  isSelected: boolean;
  progress: Record<string, any>;
  updateProgress: (key: string, level: number) => void;
}

/**
 * 개별 궁극 무기 스탯 비용 테이블 카드
 */
export function UwStatCard({
  category,
  uwKey,
  uwDisplayName,
  statName,
  detail,
  isSelected,
  progress,
  updateProgress,
}: UwStatCardProps) {
  const key = `${category}_${uwKey}_${statName}`;
  const currentLevel = progress[key] || 0;

  let displayName = detail.name || statName;
  let displayDesc = detail.desc;

  // UW+의 경우 다국어 이름 및 설명 적용
  if (category === 'plus') {
    const localizedPlus = (T.data as any)?.UW_PLUS?.[uwKey]?.[statName];
    if (localizedPlus) {
      displayName = localizedPlus.name;
      displayDesc = localizedPlus.desc;
    }
  }

  // 현재 레벨 이후의 비용 데이터만 필터링
  const remainingCosts = detail.costs
    .map((cost: number, idx: number) => ({
      cost,
      value: detail.values[idx],
      level: idx + 1,
      displayLevel: idx === 0 ? 'Base' : idx,
    }))
    .filter((item: any) => item.level > currentLevel);

  const maxTotalCost = remainingCosts.reduce((a: number, b: any) => a + b.cost, 0);

  return (
    <div
      className={`
        ${styles.card} transition-all duration-500
        ${isSelected
          ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)] scale-[1.02] z-10'
          : 'border-slate-800 opacity-80'
        }
      `}
    >
      {/* 카드 헤더: 스탯 이름 및 현재 레벨 정보 */}
      <div className={`${styles.uwHeader} ${isSelected ? 'bg-slate-700' : 'bg-slate-800'}`}>
        <div className="flex flex-col">
          <span className={`text-[10px] font-normal mb-0.5 ${isSelected ? 'text-green-400' : 'text-slate-400'}`}>
            {uwDisplayName}
          </span>
          <span className={isSelected ? 'text-white' : ''}>
            {displayName} <span className="text-slate-500 normal-case font-normal">({detail.unit || 'Level'})</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
            <span className="text-[10px] text-slate-500 font-bold">Lv</span>
            <span className="text-sm font-bold text-cyan-400">
              {currentLevel === 0 ? '0' : currentLevel - 1}
            </span>
            <span className="text-[10px] text-slate-600">/</span>
            <span className="text-xs font-medium text-slate-400">
              {detail.values.length - 1}
            </span>
          </div>

          {currentLevel > 0 && detail.costs && (
            <span className="text-sm font-mono font-bold text-yellow-400">
              {formatNum(sumCostsUpToLevel(detail.costs, currentLevel))}
            </span>
          )}

          {currentLevel > 0 && (
            <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(key, 0); }} />
          )}
        </div>
      </div>

      {displayDesc && <div className={styles.descBox}>{displayDesc}</div>}

      {/* 비용 상세 테이블 */}
      <div className={styles.tableContainer}>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={styles.th}>Lv</th>
              <th className={styles.th}>Value</th>
              <th className={styles.th}>Cost</th>
              <th className={styles.th}>Cumul.</th>
            </tr>
          </thead>
          <tbody>
            {remainingCosts.map((item: any, idx: number) => {
              const cumulative = remainingCosts.slice(0, idx + 1).reduce((a: number, b: any) => a + b.cost, 0);
              return (
                <tr
                  key={item.level}
                  className={styles.tr}
                  onClick={() => updateProgress(key, item.level)}
                >
                  <td className={styles.td}>
                    {item.displayLevel === 'Base' ? <span className="text-slate-500 font-bold">Base</span> : item.displayLevel}
                  </td>
                  <td className={`${styles.td} text-cyan-400`}>{item.value}</td>
                  <td className={`${styles.td} text-yellow-400`}>{item.cost > 0 ? formatNum(item.cost) : '-'}</td>
                  <td className={`${styles.td} text-slate-500`}>{cumulative > 0 ? formatNum(cumulative) : '-'}</td>
                </tr>
              );
            })}
            {remainingCosts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Maxed Out! 🎉
                </td>
              </tr>
            )}
          </tbody>
          {remainingCosts.length > 0 && (
            <tfoot>
              <tr>
                <td className={styles.tfootTd} colSpan={2}>Total Left</td>
                <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(maxTotalCost)}</td>
                <td className={styles.tfootTd}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
