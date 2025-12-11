import { useState } from 'react';
import { useGameData } from '../../contexts/GameDataContext';
import { 
  MODULE_TYPES, 
  RARITIES, 
  DISPLAY_ORDER, 
  type EquippedModule 
} from '../Modules/ModuleConstants';
import { MODULE_TYPES as REROLL_DATA } from '../../data/module_reroll_data';
import moduleCosts from '../../data/module_costs.json';

export default function SummaryModules() {
  const { modules, progress } = useGameData();

  // [Modified] 개별 상태(객체) 대신 단일 상태(문자열)로 관리하여 4개를 동기화
  const [viewMode, setViewMode] = useState<'main' | 'sub'>('main');

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  // 효율(%) 가져오기
  const getEfficiencyPercent = (level: number) => {
    const costs = moduleCosts as any;
    const efficiencyTable = costs.sub_efficiency || costs.common_efficiency;
    const effData = efficiencyTable?.levels?.find((l: any) => l.level === (level || 1));
    return effData ? effData.value : 1; 
  };

  const renderSubEffects = (
    moduleTypeId: string,
    effects: string[] | undefined,
    realRarity: number,
    efficiency: number 
  ) => {
    if (!effects || effects.length === 0) {
      return <div className="text-xs text-slate-500 italic py-2">No sub-effects</div>;
    }

    const availableEffects = REROLL_DATA[moduleTypeId] || [];

    return (
      <div className="space-y-1.5 mt-3 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
        {effects.map((effectId, idx) => {
          if (!effectId) return null;
          const effectData = availableEffects.find(e => e.id === effectId);
          if (!effectData) return null;

          const baseVal = effectData.values[realRarity];
          let displayVal = baseVal;

          if (typeof baseVal === 'number') {
            const calculated = baseVal * (efficiency / 100);
            displayVal = Number.isInteger(calculated) ? calculated : parseFloat(calculated.toFixed(2));
          }

          return (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{effectData.name}</span>
              <span className="font-mono font-bold text-slate-200">
                {displayVal}{effectData.unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 content-start overflow-y-auto pr-2 custom-scrollbar max-h-full">
      {DISPLAY_ORDER.map((typeId) => {
        const typeConfig = MODULE_TYPES.find(t => t.id === typeId);
        if (!typeConfig) return null;

        // [Modified] 모든 카드가 공통 상태(viewMode)를 바라봄
        const activeSlot = viewMode; 

        const mainKey = `equipped_${typeId}_main`;
        const subKey = `equipped_${typeId}_sub`;

        const mainModule = modules[mainKey] as EquippedModule | undefined;
        const subModule = modules[subKey] as EquippedModule | undefined;

        const activeModule = activeSlot === 'main' ? mainModule : subModule;
        
        const mappedId = slotIdMap[typeId];
        const unlockKey = `module_unlock_${mappedId}`;
        const unlockLevel = progress[unlockKey] || 0;
        
        const subEffLevel = progress[`module_${mappedId}_sub`] || 0;
        const subEfficiency = getEfficiencyPercent(subEffLevel);

        const currentEfficiency = activeSlot === 'main' ? 100 : subEfficiency;

        let visualRarity = 0;
        if (activeModule) {
          if (activeSlot === 'main') {
            visualRarity = activeModule.rarity;
          } else {
             const maxRarityIndex = unlockLevel > 0 ? Math.min(5, unlockLevel + 1) : 0;
             visualRarity = Math.min(activeModule.rarity, maxRarityIndex);
          }
        }
        
        const rarityInfo = RARITIES[visualRarity] || RARITIES[0];

        return (
          <div key={typeId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-fit">
            
            {/* Header */}
            <div className={`px-4 py-3 border-b border-slate-800 flex items-center justify-between ${typeConfig.bg}`}>
              <div className="flex items-center gap-2">
                <typeConfig.icon size={18} className={typeConfig.color} />
                <span className="font-bold text-slate-200 text-sm uppercase tracking-wider">
                  {typeConfig.label}
                </span>
              </div>
              
              <div className="flex bg-slate-950/50 rounded-lg p-0.5 border border-slate-800/50">
                <button
                  // [Modified] 버튼 클릭 시 전체 상태(viewMode) 변경
                  onClick={() => setViewMode('main')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeSlot === 'main' 
                      ? 'bg-yellow-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  MAIN
                </button>
                <button
                  // [Modified] 버튼 클릭 시 전체 상태(viewMode) 변경
                  onClick={() => setViewMode('sub')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeSlot === 'sub' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ASSIST
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 min-h-[160px]">
              {activeModule ? (
                <div className="animate-fade-in">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{activeModule.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${rarityInfo.color} ${rarityInfo.border} ${rarityInfo.bg}`}>
                          {rarityInfo.label}
                        </span>
                        {activeSlot === 'sub' && activeModule.rarity > visualRarity && (
                           <span className="text-[10px] text-slate-500">
                             (Base: {RARITIES[activeModule.rarity].short})
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {renderSubEffects(
                    typeId, 
                    activeModule.effects, 
                    activeModule.rarity, 
                    currentEfficiency    
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic animate-fade-in">
                  No {activeSlot === 'main' ? 'Main' : 'Assist'} module equipped
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}