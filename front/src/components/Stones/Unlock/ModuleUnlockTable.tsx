import { Sword, Shield, Zap, Box, ArrowUpCircle } from 'lucide-react';
import { stoneStyles as styles, formatNum, ResetButton } from '../StoneShared';

interface Props {
  progress: Record<string, any>;
  onUpgrade: (moduleId: string) => void;
  onReset: () => void;
}

export default function ModuleUnlockTable({ progress, onUpgrade, onReset }: Props) {
  const moduleSlots = [
    { id: 'attack', label: 'Attack', icon: Sword, color: 'text-rose-400' },
    { id: 'defense', label: 'Defense', icon: Shield, color: 'text-blue-400' },
    { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400' },
    { id: 'core', label: 'Core', icon: Box, color: 'text-purple-400' },
  ];

  const moduleRarities = [
    { level: 0, label: 'Locked', color: 'text-slate-600', nextCost: 1000 },
    { level: 1, label: 'Epic', color: 'text-purple-400', nextCost: 1000 },
    { level: 2, label: 'Legendary', color: 'text-yellow-400', nextCost: 1200 },
    { level: 3, label: 'Mythic', color: 'text-red-400', nextCost: 1400 },
    { level: 4, label: 'Ancestral', color: 'text-green-400', nextCost: 0 },
  ];

  const moduleTotalRemaining = moduleSlots.reduce((acc, mod) => {
    const currentLevel = progress[`module_unlock_${mod.id}`] || 0;
    // 현재 레벨 이후의 모든 비용 합산
    const remainingCost = moduleRarities.slice(currentLevel).reduce((sum, r) => sum + r.nextCost, 0);
    return acc + remainingCost;
  }, 0);

  const isAnyModuleUnlocked = moduleSlots.some(mod => (progress[`module_unlock_${mod.id}`] || 0) > 0);

  return (
    <div className={styles.card + " h-fit"}>
      <div className={styles.uwHeader}>
        <span>Module Slots</span>
        {isAnyModuleUnlocked && (
          <ResetButton onClick={(e) => { e.stopPropagation(); onReset(); }} />
        )}
      </div>
      <table className="w-full text-xs text-left">
        <thead>
          <tr>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Next Cost</th>
          </tr>
        </thead>
        <tbody>
          {moduleSlots.map((mod) => {
            const key = `module_unlock_${mod.id}`;
            const currentLevel = progress[key] || 0; 
            const rarity = moduleRarities[currentLevel];
            const isMaxed = currentLevel >= 4;

            return (
              <tr 
                key={mod.id} 
                onClick={() => onUpgrade(mod.id)}
                className={`border-b border-slate-800/50 transition-colors ${!isMaxed ? 'cursor-pointer hover:bg-slate-800/30' : 'cursor-default'}`}
                title={!isMaxed ? 'Click to Upgrade' : 'Max Level'}
              >
                <td className={styles.td}>
                  <div className="flex items-center gap-2">
                    <mod.icon size={14} className={currentLevel > 0 ? mod.color : 'text-slate-500'} />
                    <span className={currentLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-500'}>{mod.label}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={`font-bold ${rarity.color}`}>
                    {rarity.label}
                  </span>
                </td>
                <td className={styles.td}>
                  {isMaxed ? (
                    <span className="text-slate-600 font-mono">-</span>
                  ) : (
                    <div className="flex items-center gap-1 text-green-400 font-bold">
                      {formatNum(rarity.nextCost)}
                      <ArrowUpCircle size={10} className="opacity-50" />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className={styles.tfootTd} colSpan={2}>Remaining Total</td>
            <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(moduleTotalRemaining)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}