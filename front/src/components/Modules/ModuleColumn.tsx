import { useMemo } from 'react';
import { RARITIES, type EquippedModule } from './ModuleConstants';
import moduleData from '../../data/module_list.json';
import { MODULE_TYPES as REROLL_DATA } from '../../data/module_reroll_data'; 
import moduleCosts from '../../data/module_costs.json'; 

interface Props {
  moduleType: { id: string; label: string; color: string; border: string };
  modules: Record<string, any>;
  progress: Record<string, any>;
  rarity: number;
  onModuleClick: (type: string, name: string, data: any) => void;
  viewMode: 'equipped' | 'inventory';
}

// [Fix] 'rarity'는 내부에서 계산된 값을 사용하므로 props 구조 분해에서 제거
export default function ModuleColumn({ moduleType, modules, progress, onModuleClick, viewMode }: Props) {
  
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  const getRarity = (data: any): number => {
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data !== null) return data.rarity;
    return -1;
  };

  // 효율(%) 가져오기 - sub_efficiency 참조
  const getEfficiencyPercent = (level: number) => {
    const costs = moduleCosts as any;
    const efficiencyTable = costs.sub_efficiency || costs.common_efficiency; // fallback

    const effData = efficiencyTable?.levels?.find((l: any) => l.level === (level || 1));
    return effData ? effData.value : 1; 
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
        return <span key={idx} className={`font-bold ${RARITIES[rarityIdx]?.color || 'text-slate-200'}`}>{val}</span>;
      }
      return part;
    });
  };

  // 부옵션 렌더링
  const renderSubEffects = (
      effects: string[] | undefined, 
      rarityIdx: number,  
      realRarityIdx: number, 
      efficiency: number 
    ) => {
    if (!effects || effects.length === 0) {
      return <span className="text-xs text-slate-500 italic">No sub-effects</span>;
    }

    const availableEffects = REROLL_DATA[moduleType.id] || [];

    return (
      <div className="space-y-1.5 mt-2">
        {effects.map((effectId, idx) => {
          if (!effectId) return null; 
          const effectData = availableEffects.find(e => e.id === effectId);
          if (!effectData) return null;

          // 1. 실제 등급(realRarityIdx)의 기본값 가져오기
          const baseVal = effectData.values[realRarityIdx];
          
          let displayVal = baseVal;
          
          // 2. 효율(%) 적용 (숫자인 경우에만)
          if (typeof baseVal === 'number') {
            const calculated = baseVal * (efficiency / 100);
            displayVal = Number.isInteger(calculated) ? calculated : parseFloat(calculated.toFixed(2));
          }

          return (
            <div key={idx} className="flex justify-between items-center text-xs leading-tight">
              <span className="text-slate-200 truncate pr-2">{effectData.name}</span>
              <span className={`font-mono font-bold ${RARITIES[rarityIdx]?.color}`}>
                {displayVal}{effectData.unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const modulesList = (moduleData as any)[moduleType.id];

  const visibleModules = useMemo(() => {
    let list = [...modulesList];

    if (viewMode === 'equipped') {
      list = list.filter((module: any) => {
        const mainKey = `equipped_${moduleType.id}_main`;
        const subKey = `equipped_${moduleType.id}_sub`;
        const isMain = modules[mainKey]?.name === module.name;
        const isSub = modules[subKey]?.name === module.name;
        return isMain || isSub;
      });
    }

    return list.sort((a: any, b: any) => {
      if (viewMode === 'inventory') {
        const dataA = modules[`owned_${a.name}`];
        const dataB = modules[`owned_${b.name}`];
        const rarityA = getRarity(dataA);
        const rarityB = getRarity(dataB);
        return rarityB - rarityA; 
      } else {
        const mainKey = `equipped_${moduleType.id}_main`;
        const subKey = `equipped_${moduleType.id}_sub`;
        const isMainA = modules[mainKey]?.name === a.name;
        const isSubA = modules[subKey]?.name === a.name;
        const isMainB = modules[mainKey]?.name === b.name;
        const isSubB = modules[subKey]?.name === b.name;
        const scoreA = isMainA ? 0 : (isSubA ? 1 : 2);
        const scoreB = isMainB ? 0 : (isSubB ? 1 : 2);
        return scoreA - scoreB;
      }
    });
  }, [modulesList, modules, moduleType.id, viewMode]);

  const slotId = slotIdMap[moduleType.id];
  const unlockKey = `module_unlock_${slotId}`;
  const unlockLevel = progress[unlockKey] || 0;

  // 효율 계산
  const subEffLevel = progress[`module_${slotId}_sub`] || 0;
  const subEfficiency = getEfficiencyPercent(subEffLevel);

  return (
    <div className="flex flex-col h-fit bg-slate-950/30 rounded-2xl border border-slate-800/50">
      <div className={`flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl ${moduleType.color.replace('text-', 'text-opacity-80 ')}`}>
        <h3 className="text-lg font-bold text-slate-200">{moduleType.label}</h3>
        {viewMode === 'equipped' && (
           <span className="text-[10px] text-slate-500 ml-auto">
             Assist Eff: {subEfficiency}%
           </span>
        )}
      </div>

      <div className="p-3 space-y-3">
        {visibleModules.length === 0 && viewMode === 'equipped' && (
           <div className="text-center py-4 text-xs text-slate-600">
             No module equipped
           </div>
        )}

        {visibleModules.map((module: any) => {
          const ownedKey = `owned_${module.name}`;
          const ownedData = modules[ownedKey];
          const ownedRarityIdx = getRarity(ownedData);
          const isOwned = ownedRarityIdx !== -1;

          const mainKey = `equipped_${moduleType.id}_main`;
          const subKey = `equipped_${moduleType.id}_sub`;
          const mainModule = modules[mainKey] as EquippedModule | undefined;
          const subModule = modules[subKey] as EquippedModule | undefined;
          
          const isMain = mainModule?.name === module.name;
          const isSub = subModule?.name === module.name;
          
          let displayRarityIdx = 0; // 시각적 등급 (Visual Cap)
          let realRarityIdx = 0;    // 실제 등급 (Base Value용)
          let isSelected = false;
          let activeEffects: string[] | undefined = [];
          let currentEfficiency = 100; // 기본 100%

          if (viewMode === 'inventory') {
            isSelected = isOwned;
            displayRarityIdx = isOwned ? ownedRarityIdx : 0;
            realRarityIdx = displayRarityIdx;
          } else {
            isSelected = isMain || isSub;
            if (isMain) {
              displayRarityIdx = mainModule!.rarity;
              realRarityIdx = displayRarityIdx; // 메인은 그대로
              activeEffects = mainModule!.effects;
              currentEfficiency = 100;
            } else if (isSub) {
               // [Visual Cap] 연구 레벨에 따른 최대 등급 제한
               const maxRarityIndex = unlockLevel > 0 ? Math.min(5, unlockLevel + 1) : 0;
               displayRarityIdx = Math.min(subModule!.rarity, maxRarityIndex);
               
               // [Real Base] 실제 모듈 등급 사용
               realRarityIdx = subModule!.rarity; 
               activeEffects = subModule!.effects;
               currentEfficiency = subEfficiency; // 서브 효율 적용
            } else {
               displayRarityIdx = 0;
            }
          }

          const activeRarity = RARITIES[displayRarityIdx] || RARITIES[0];

          // [Fix] 클릭 시 모달로 보낼 데이터를 결정합니다.
          const clickData = isMain ? mainModule : (isSub ? subModule : ownedData);

          return (
            <div 
              key={module.name}
              // [Fix] clickData 전달
              onClick={() => onModuleClick(moduleType.id, module.name, clickData)}
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
                  {isMain && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500 text-slate-900 shadow-sm leading-none border border-yellow-600">MAIN</span>
                  )}
                  {isSub && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white shadow-sm leading-none border border-blue-600">ASSIST</span>
                  )}

                  {isSelected && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none ${activeRarity.color} ${activeRarity.border} ${activeRarity.bg}`}>
                        {activeRarity.short}
                    </span>
                  )}
                </div>
              </div>

              {viewMode === 'equipped' && isSelected ? (
                 renderSubEffects(activeEffects, displayRarityIdx, realRarityIdx, currentEfficiency)
              ) : (
                 <p className={`text-xs leading-relaxed break-keep ${isSelected ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                   {parseDescription(module.desc, displayRarityIdx)}
                 </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}