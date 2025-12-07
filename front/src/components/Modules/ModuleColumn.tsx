import { useMemo } from 'react';
import { RARITIES, type EquippedModule } from './ModuleConstants';
import moduleData from '../../data/module_list.json';

interface Props {
  moduleType: { id: string; label: string; color: string; border: string };
  modules: Record<string, any>;
  progress: Record<string, any>;
  rarity: number;
  onToggle: (type: string, name: string) => void;
  viewMode: 'equipped' | 'inventory';
}

export default function ModuleColumn({ moduleType, modules, progress, rarity, onToggle, viewMode }: Props) {
  
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  const parseDescription = (text: string, rarityIdx: number) => {
    const pattern = /([x+\-]?\d+(?:\.\d+)?(?:[%msx])?(?:\/[x+\-]?\d+(?:\.\d+)?[%msx]?)+)/g;
    return text.split(pattern).map((part, idx) => {
      if (pattern.test(part)) {
        const values = part.split('/');
        let val = values[rarityIdx] || values[values.length - 1];
        const lastVal = values[values.length - 1];
        const suffixMatch = lastVal.match(/[%smsx]+$/);
        const globalSuffix = suffixMatch ? suffixMatch[0] : '';
        if (globalSuffix && !/[%smsx]$/.test(val)) val += globalSuffix;
        return <span key={idx} className={`font-bold ${RARITIES[rarityIdx].color}`}>{val}</span>;
      }
      return part;
    });
  };

  const modulesList = (moduleData as any)[moduleType.id];

  const sortedModules = useMemo(() => {
    return [...modulesList].sort((a: any, b: any) => {
      if (viewMode === 'inventory') {
        // [보유 모드 정렬] 보유한 것(높은 등급) 우선
        const rarityA = modules[`owned_${a.name}`] ?? -1;
        const rarityB = modules[`owned_${b.name}`] ?? -1;
        return rarityB - rarityA; 
      } else {
        // [장착 모드 정렬] 장착된 것 우선
        const mainKey = `equipped_${moduleType.id}_main`;
        const subKey = `equipped_${moduleType.id}_sub`;
        
        const isMainA = modules[mainKey]?.name === a.name;
        const isSubA = modules[subKey]?.name === a.name;
        const isMainB = modules[mainKey]?.name === b.name;
        const isSubB = modules[subKey]?.name === b.name;

        // 점수: Main(0) > Sub(1) > Else(2)
        const scoreA = isMainA ? 0 : (isSubA ? 1 : 2);
        const scoreB = isMainB ? 0 : (isSubB ? 1 : 2);
        return scoreA - scoreB;
      }
    });
  }, [modulesList, modules, moduleType.id, viewMode]);

  const unlockKey = `module_unlock_${slotIdMap[moduleType.id]}`;
  const unlockLevel = progress[unlockKey] || 0;

  return (
    <div className="flex flex-col h-full bg-slate-950/30 rounded-2xl border border-slate-800/50 overflow-hidden">
      <div className={`flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900/50 ${moduleType.color.replace('text-', 'text-opacity-80 ')}`}>
        <h3 className="text-lg font-bold text-slate-200">{moduleType.label}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {sortedModules.map((module: any) => {
          const ownedKey = `owned_${module.name}`;
          const ownedRarityIdx = modules[ownedKey];
          const isOwned = ownedRarityIdx !== undefined;

          const mainKey = `equipped_${moduleType.id}_main`;
          const subKey = `equipped_${moduleType.id}_sub`;
          const mainModule = modules[mainKey] as EquippedModule | undefined;
          const subModule = modules[subKey] as EquippedModule | undefined;
          
          const isMain = mainModule?.name === module.name;
          const isSub = subModule?.name === module.name;
          
          let displayRarityIdx = 0;
          let isSelected = false;

          if (viewMode === 'inventory') {
            isSelected = isOwned;
            // 보유 시 해당 등급, 아니면 Epic(0)
            displayRarityIdx = isOwned ? ownedRarityIdx : 0;
          } else {
            isSelected = isMain || isSub;
            // 장착 시 해당 등급, 아니면 Preview Rarity
            if (isMain) displayRarityIdx = mainModule!.rarity;
            else if (isSub) {
               const maxRarityIndex = Math.max(0, unlockLevel - 1);
               displayRarityIdx = Math.min(subModule!.rarity, maxRarityIndex);
            } else {
               displayRarityIdx = rarity;
            }
          }

          const activeRarity = RARITIES[displayRarityIdx];

          return (
            <div 
              key={module.name}
              onClick={() => onToggle(moduleType.id, module.name)}
              className={`
                relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group h-fit min-h-[100px]
                ${isSelected 
                  ? `bg-slate-800 ${activeRarity.border.replace('/50', '')} shadow-lg z-10` 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50 opacity-60 hover:opacity-100'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className={`font-bold text-sm leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {module.name}
                </h4>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* [장착 모드] MAIN / ASSIST 뱃지 */}
                  {viewMode === 'equipped' && isMain && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500 text-slate-900 shadow-sm leading-none border border-yellow-600">MAIN</span>
                  )}
                  {viewMode === 'equipped' && isSub && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white shadow-sm leading-none border border-blue-600">ASSIST</span>
                  )}

                  {/* [보유 모드 & 장착 모드 공통] 등급 뱃지 (A, M, L, E) */}
                  {isSelected && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none ${activeRarity.color} ${activeRarity.border} ${activeRarity.bg}`}>
                        {activeRarity.short}
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-xs leading-relaxed break-keep ${isSelected ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                {parseDescription(module.desc, displayRarityIdx)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}