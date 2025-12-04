import { X, Lock, Star, Disc } from 'lucide-react';
import { MODULE_TYPES, RARITIES, DISPLAY_ORDER, type EquippedModule } from './ModuleConstants';
import moduleCosts from '../../data/module_costs.json';

interface Props {
  modulesState: Record<string, any>;
  onRemove: (key: string) => void;
  progress: Record<string, any>;
}

export default function EquippedView({ modulesState, onRemove, progress }: Props) {
  
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

  return (
    <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min content-start overflow-y-auto pr-2">
      {DISPLAY_ORDER.map(typeId => {
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

        const hasEquipped = mainModule || (subModule && isUnlocked);

        const mappedId = slotIdMap[type.id];
        const mainEffLevel = progress[`module_${mappedId}_main`] || 0;
        const subEffLevel = progress[`module_${mappedId}_sub`] || 0;
        
        const mainEffVal = getEfficiencyValue(mainEffLevel);
        const subEffVal = getEfficiencyValue(subEffLevel);

        return (
          <div key={type.id} className={`bg-slate-900 border ${hasEquipped ? type.border : 'border-slate-800'} rounded-2xl p-5 transition-all h-fit`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${type.bg}`}>
                <type.icon size={20} className={hasEquipped ? type.color : 'text-slate-500'} />
              </div>
              <span className={`text-lg font-bold ${hasEquipped ? 'text-slate-200' : 'text-slate-600'}`}>{type.label}</span>
            </div>

            <div className="space-y-3">
              {/* 1. Main Module Box */}
              <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20 shadow-sm">MAIN</span>
                    {mainModule && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[mainModule.rarity].bg} ${RARITIES[mainModule.rarity].color} ${RARITIES[mainModule.rarity].border}`}>
                        {RARITIES[mainModule.rarity].short}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium truncate ${mainModule ? 'text-white' : 'text-slate-600 italic'}`}>
                    {mainModule?.name || "Empty"}
                  </span>
                </div>
                {mainModule && (
                  <button onClick={() => onRemove(`equipped_${type.id}_main`)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors">
                    <X size={14}/>
                  </button>
                )}
              </div>

              {/* 2. Sub Module Box */}
              <div className={`flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border animate-fade-in ${isUnlocked ? 'border-slate-800/50' : 'border-slate-800/30 bg-slate-900/30'}`}>
                {isUnlocked ? (
                  <>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 shadow-sm">ASSIST</span>
                        {subModule && (
                          <span 
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RARITIES[effectiveSubRarity].bg} ${RARITIES[effectiveSubRarity].color} ${RARITIES[effectiveSubRarity].border}`}
                              title={subModule.rarity !== effectiveSubRarity ? `제한됨 (원본: ${RARITIES[subModule.rarity].label})` : ''}
                          >
                            {RARITIES[effectiveSubRarity].short}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate ${subModule ? 'text-white' : 'text-slate-600 italic'}`}>
                        {subModule?.name || "Empty"}
                      </span>
                    </div>
                    {subModule && (
                      <button onClick={() => onRemove(`equipped_${type.id}_sub`)} className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded transition-colors">
                        <X size={14}/>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-600 w-full justify-center py-0.5">
                      <Lock size={12} />
                      <span className="text-xs font-bold">Assist Slot Locked</span>
                  </div>
                )}
              </div>

              {/* 3. Efficiency Stats (Bottom Area) */}
              <div>
                {/* Main Stat */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Star size={12} className="text-yellow-500/50"/> Main Stat
                    </span>
                    <span className="text-sm font-bold text-yellow-500 font-mono">+{mainEffVal}%</span>
                </div>

                {/* Sub Stat (Only if unlocked) */}
                {isUnlocked && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Disc size={12} className="text-blue-500/50"/> Sub Stat
                        </span>
                        <span className="text-sm font-bold text-blue-400 font-mono">+{subEffVal}%</span>
                    </div>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}