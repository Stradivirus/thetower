import { useMemo } from 'react';
import { RARITIES } from './ModuleConstants'; // [수정] 사용하지 않는 EquippedModule 제거
import { MODULE_TYPES as REROLL_DATA } from '../../data/module_reroll_data'; 
import moduleCosts from '../../data/module_costs.json'; 
import { T } from '../../locales'; 

interface Props {
  moduleType: { id: string; label: string; color: string; border: string };
  modules: Record<string, any>;
  progress: Record<string, any>;
  onModuleClick: (type: string, name: string, data: any) => void;
  viewMode: 'equipped' | 'inventory';
}

export default function ModuleColumn({ moduleType, modules, progress, onModuleClick, viewMode }: Props) {
  
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  const getRarity = (data: any): number => {
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data !== null) return data.rarity;
    return -1;
  };

  const getEfficiencyPercent = (level: number) => {
    const costs = moduleCosts as any;
    const efficiencyTable = costs.sub_efficiency || costs.common_efficiency;
    const effData = efficiencyTable?.levels?.find((l: any) => l.level === (level || 1));
    return effData ? effData.value : 1; 
  };

  const parseDescription = (text: string, rarityIdx: number) => {
    const pattern = /([x+\-]?\d+(?:\.\d+)?(?:[%msx])?(?:\/[x+\-]?\d+(?:\.\d+)?[%msx]?)+)/g;
    const valueIdx = Math.max(0, rarityIdx - 2); 

    return text.split(pattern).map((part, idx) => {
      if (pattern.test(part)) {
        const values = part.split('/');
        let val = values[valueIdx] || values[values.length - 1];
        
        const prefixMatch = values[0].match(/^[x+\-]/);
        const globalPrefix = prefixMatch ? prefixMatch[0] : '';
        if (globalPrefix && !/^[x+\-]/.test(val)) val = globalPrefix + val;

        const lastVal = values[values.length - 1];
        const suffixMatch = lastVal.match(/[%smsx]+$/);
        const globalSuffix = suffixMatch ? suffixMatch[0] : '';
        if (globalSuffix && !/[%smsx]$/.test(val)) val += globalSuffix;
        
        return <span key={idx} className={`font-bold ${RARITIES[rarityIdx]?.color || 'text-slate-200'}`}>{val}</span>;
      }
      return part;
    });
  };

  const renderSubEffects = (effects: string[] | undefined, rarityIdx: number, realRarityIdx: number, efficiency: number) => {
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
          const baseVal = effectData.values[realRarityIdx];
          let displayVal = baseVal;
          if (typeof baseVal === 'number') {
            const calculated = baseVal * (efficiency / 100);
            displayVal = Number.isInteger(calculated) ? calculated : parseFloat(calculated.toFixed(2));
          }
          return (
            <div key={idx} className="flex justify-between items-center text-xs leading-tight">
              <span className="text-slate-200 truncate pr-2">{effectData.name}</span>
              <span className={`font-mono font-bold ${RARITIES[rarityIdx]?.color}`}>{displayVal}{effectData.unit}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // [수정] JSON 대신 언어팩 데이터(T.data.MODULES)를 직접 사용
  const moduleTranslations = (T.data?.MODULES as any)?.[moduleType.id] || {};

  const visibleModules = useMemo(() => {
    // 1. 언어팩 객체를 배열로 변환하여 리스트 생성
    const list = Object.entries(moduleTranslations).map(([id, info]: [string, any]) => ({
      id, 
      ...info 
    }));

    // 2. 필터링 및 정렬
    let filteredList = [...list];
    if (viewMode === 'equipped') {
      filteredList = filteredList.filter((m: any) => {
        const mainKey = `equipped_${moduleType.id}_main`;
        const subKey = `equipped_${moduleType.id}_sub`;
        return modules[mainKey]?.name === m.id || modules[subKey]?.name === m.id;
      });
    }
    
    return filteredList.sort((a: any, b: any) => {
      if (viewMode === 'inventory') {
        return getRarity(modules[`owned_${b.id}`]) - getRarity(modules[`owned_${a.id}`]);
      }
      const score = (m: any) => modules[`equipped_${moduleType.id}_main`]?.name === m.id ? 0 : (modules[`equipped_${moduleType.id}_sub`]?.name === m.id ? 1 : 2);
      return score(a) - score(b);
    });
  }, [moduleTranslations, modules, moduleType.id, viewMode]);

  const slotId = slotIdMap[moduleType.id];
  const subEfficiency = getEfficiencyPercent(progress[`module_${slotId}_sub`] || 0);

  return (
    <div className="flex flex-col h-fit bg-slate-950/30 rounded-2xl border border-slate-800/50">
      <div className={`flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl ${moduleType.color.replace('text-', 'text-opacity-80 ')}`}>
        <h3 className="text-lg font-bold text-slate-200">{moduleType.label}</h3>
        {viewMode === 'equipped' && <span className="text-[10px] text-slate-500 ml-auto">Assist Eff: {subEfficiency}%</span>}
      </div>

      <div className="p-3 space-y-3">
        {visibleModules.length === 0 && viewMode === 'equipped' && <div className="text-center py-4 text-xs text-slate-600">No module equipped</div>}
        {visibleModules.map((module: any) => {
          const isMain = modules[`equipped_${moduleType.id}_main`]?.name === module.id;
          const isSub = modules[`equipped_${moduleType.id}_sub`]?.name === module.id;
          const isSelected = isMain || isSub || (viewMode === 'inventory' && getRarity(modules[`owned_${module.id}`]) !== -1);
          
          let displayRarityIdx = 2; // 기본 Epic
          let realRarityIdx = 0;
          let activeEffects = [];
          
          if (isMain) {
            displayRarityIdx = realRarityIdx = modules[`equipped_${moduleType.id}_main`].rarity;
            activeEffects = modules[`equipped_${moduleType.id}_main`].effects;
          } else if (isSub) {
            const unlockLevel = progress[`module_unlock_${slotId}`] || 0;
            displayRarityIdx = Math.min(modules[`equipped_${moduleType.id}_sub`].rarity, unlockLevel > 0 ? Math.min(5, unlockLevel + 1) : 0);
            realRarityIdx = modules[`equipped_${moduleType.id}_sub`].rarity;
            activeEffects = modules[`equipped_${moduleType.id}_sub`].effects;
          } else if (viewMode === 'inventory') {
            const ownedRarity = getRarity(modules[`owned_${module.id}`]);
            if (ownedRarity !== -1) displayRarityIdx = realRarityIdx = ownedRarity;
          }

          const activeRarity = RARITIES[displayRarityIdx] || RARITIES[0];

          return (
            <div 
              key={module.id}
              onClick={() => onModuleClick(moduleType.id, module.id, isMain ? modules[`equipped_${moduleType.id}_main`] : (isSub ? modules[`equipped_${moduleType.id}_sub`] : modules[`owned_${module.id}`]))}
              className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group h-fit min-h-[100px] ${isSelected ? `bg-slate-800 ${activeRarity.border.replace('/50', '')} shadow-lg z-10` : 'bg-slate-900 border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className={`font-bold text-sm leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-slate-400'}`}>{module.name}</h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isMain && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500 text-slate-900 leading-none border border-yellow-600">MAIN</span>}
                  {isSub && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white leading-none border border-blue-600">ASSIST</span>}
                  {isSelected && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none ${activeRarity.color} ${activeRarity.border} ${activeRarity.bg}`}>{activeRarity.short}</span>}
                </div>
              </div>
              {viewMode === 'equipped' && isSelected ? renderSubEffects(activeEffects, displayRarityIdx, realRarityIdx, isMain ? 100 : subEfficiency) : <p className={`text-xs leading-relaxed break-keep ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>{parseDescription(module.desc, displayRarityIdx)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}