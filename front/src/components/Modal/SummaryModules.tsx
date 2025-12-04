import { Box, Lock, Star, Disc } from 'lucide-react';
import moduleCosts from '../../data/module_costs.json';
import { MODULE_TYPES, RARITIES, DISPLAY_ORDER, type EquippedModule } from '../Modules/ModuleConstants';

interface Props {
  modulesState: Record<string, any>;
  progress: Record<string, any>;
}

export function SummaryModules({ modulesState, progress }: Props) {
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack',
    'armor': 'defense',
    'generator': 'generator',
    'core': 'core'
  };

  const getEfficiencyValue = (level: number) => {
    const effectiveLevel = (!level || level < 1) ? 1 : level;
    const lvData = moduleCosts.common_efficiency.levels.find((l: any) => l.level === effectiveLevel);
    return lvData ? lvData.value : 1;
  };

  const equippedModules = DISPLAY_ORDER.map(typeId => {
    const type = MODULE_TYPES.find(t => t.id === typeId)!;
    const mainModule = modulesState[`equipped_${type.id}_main`] as EquippedModule | undefined;
    const subModule = modulesState[`equipped_${type.id}_sub`] as EquippedModule | undefined;
    
    const unlockKey = `module_unlock_${slotIdMap[type.id]}`;
    const unlockLevel = progress[unlockKey] || 0;
    const isUnlocked = unlockLevel > 0;
    
    const maxRarityIndex = Math.max(0, unlockLevel - 1);
    let effectiveSubRarity = 0;
    if (subModule) {
        effectiveSubRarity = Math.min(subModule.rarity, maxRarityIndex);
    }

    const mappedId = slotIdMap[type.id];
    const mainEffLevel = progress[`module_${mappedId}_main`] || 0;
    const subEffLevel = progress[`module_${mappedId}_sub`] || 0;
    
    const mainEffVal = getEfficiencyValue(mainEffLevel);
    const subEffVal = getEfficiencyValue(subEffLevel);

    const hasEquipped = mainModule || (subModule && isUnlocked);

    return {
      type,
      mainModule,
      subModule,
      isUnlocked,
      effectiveSubRarity,
      mainEffVal,
      subEffVal,
      hasEquipped
    };
  });

  // 장착된 모듈이 하나도 없는지 확인
  const hasAnyEquipped = equippedModules.some(m => m.hasEquipped);

  return (
    <div className="w-[450px] flex-shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Box size={18} className="text-cyan-400" />
        <h3 className="text-base font-bold text-white">Equipped Modules</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {hasAnyEquipped ? (
          <div className="grid grid-cols-2 gap-3 auto-rows-min content-start">
            {equippedModules.map((mod) => (
              <div key={mod.type.id} className={`bg-slate-900 border ${mod.hasEquipped ? mod.type.border : 'border-slate-800'} rounded-2xl p-3 transition-all h-fit`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg ${mod.type.bg}`}>
                    <mod.type.icon size={16} className={mod.hasEquipped ? mod.type.color : 'text-slate-500'} />
                  </div>
                  <span className={`text-sm font-bold ${mod.hasEquipped ? 'text-slate-200' : 'text-slate-600'}`}>{mod.type.label}</span>
                </div>

                <div className="space-y-2">
                  {/* 1. Main Module Box */}
                  <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20 shadow-sm">MAIN</span>
                        {mod.mainModule && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[mod.mainModule.rarity].bg} ${RARITIES[mod.mainModule.rarity].color} ${RARITIES[mod.mainModule.rarity].border}`}>
                            {RARITIES[mod.mainModule.rarity].short}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium truncate ${mod.mainModule ? 'text-white' : 'text-slate-600 italic'}`}>
                        {mod.mainModule?.name || "Empty"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Sub Module Box */}
                  <div className={`flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border animate-fade-in ${mod.isUnlocked ? 'border-slate-800/50' : 'border-slate-800/30 bg-slate-900/30'}`}>
                    {mod.isUnlocked ? (
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shadow-sm">ASSIST</span>
                          {mod.subModule && (
                            <span 
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[mod.effectiveSubRarity].bg} ${RARITIES[mod.effectiveSubRarity].color} ${RARITIES[mod.effectiveSubRarity].border}`}
                                title={mod.subModule.rarity !== mod.effectiveSubRarity ? `제한됨 (원본: ${RARITIES[mod.subModule.rarity].label})` : ''}
                            >
                              {RARITIES[mod.effectiveSubRarity].short}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium truncate ${mod.subModule ? 'text-white' : 'text-slate-600 italic'}`}>
                          {mod.subModule?.name || "Empty"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600 w-full justify-center py-0.5">
                          <Lock size={10} />
                          <span className="text-[10px] font-bold">Assist Slot Locked</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Efficiency Stats (Bottom Area) */}
                  <div>
                    {/* Main Stat */}
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5">
                          <Star size={10} className="text-yellow-500/50"/> Main Stat
                        </span>
                        <span className="text-xs font-bold text-yellow-500 font-mono">+{mod.mainEffVal}%</span>
                    </div>

                    {/* Sub Stat (Only if unlocked) */}
                    {mod.isUnlocked && (
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1.5">
                              <Disc size={10} className="text-blue-500/50"/> Sub Stat
                            </span>
                            <span className="text-xs font-bold text-blue-400 font-mono">+{mod.subEffVal}%</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <Box size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">장착된 모듈이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}