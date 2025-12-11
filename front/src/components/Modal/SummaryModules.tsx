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

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  // 타입별 네온 색상 정의
  const typeColors: Record<string, { border: string; shadow: string; glow: string }> = {
    'cannon': {
      border: 'border-red-500',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    },
    'armor': {
      border: 'border-blue-500',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
    },
    'generator': {
      border: 'border-yellow-500',
      shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'
    },
    'core': {
      border: 'border-purple-500',
      shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
    }
  };

  // 효율(%) 가져오기
  const getEfficiencyPercent = (level: number) => {
    const costs = moduleCosts as any;
    const efficiencyTable = costs.sub_efficiency || costs.common_efficiency;
    const effData = efficiencyTable?.levels?.find((l: any) => l.level === (level || 1));
    return effData ? effData.value : 1; 
  };

  // 개별 모듈 렌더링 헬퍼 (메인/어시스트 공용)
  const renderModuleItem = (
    typeId: string,
    moduleData: EquippedModule | undefined,
    slotType: 'MAIN' | 'ASSIST',
    unlockLevel: number,
    efficiency: number
  ) => {
    if (!moduleData) return null;

    // 시각적 등급 제한 (어시스트 슬롯만 해당)
    let visualRarity = moduleData.rarity;
    if (slotType === 'ASSIST') {
      const maxRarityIndex = unlockLevel > 0 ? Math.min(5, unlockLevel + 1) : 0;
      visualRarity = Math.min(moduleData.rarity, maxRarityIndex);
    }

    const rarityInfo = RARITIES[visualRarity] || RARITIES[0];
    const availableEffects = REROLL_DATA[typeId] || [];

    return (
      <div className={`relative ${slotType === 'ASSIST' ? 'mt-4 pt-4 border-t-2 border-slate-700/50' : ''}`}>
        {/* 모듈 헤더 (이름 + 뱃지) */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${slotType === 'MAIN' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50'}`}>
                {slotType}
              </span>
              <h4 className="font-bold text-slate-100 text-sm truncate">{moduleData.name}</h4>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${rarityInfo.color} ${rarityInfo.border} ${rarityInfo.bg}`}>
                {rarityInfo.label}
              </span>
              {slotType === 'ASSIST' && moduleData.rarity > visualRarity && (
                <span className="text-[10px] text-slate-500">
                  (Real: {RARITIES[moduleData.rarity].short})
                </span>
              )}
              {slotType === 'ASSIST' && (
                 <span className="text-[10px] text-slate-500">
                   Eff: {efficiency}%
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* 부옵션 리스트 */}
        {moduleData.effects && moduleData.effects.length > 0 ? (
          <div className="space-y-1 bg-slate-950/30 p-2 rounded-lg border border-slate-800/50">
            {moduleData.effects.map((effectId, idx) => {
              if (!effectId) return null;
              const effectData = availableEffects.find(e => e.id === effectId);
              if (!effectData) return null;

              // 실제 등급 기준 값 (어시스트는 효율 적용)
              const baseVal = effectData.values[moduleData.rarity];
              let displayVal = baseVal;

              if (typeof baseVal === 'number') {
                const calculated = baseVal * (efficiency / 100);
                displayVal = Number.isInteger(calculated) ? calculated : parseFloat(calculated.toFixed(2));
              }

              return (
                <div key={idx} className="flex justify-between items-center text-xs leading-tight">
                  <span className="text-slate-400 truncate pr-2">{effectData.name}</span>
                  <span className="font-mono font-bold text-slate-200 whitespace-nowrap">
                    {displayVal}{effectData.unit}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] text-slate-600 italic px-1">No sub-effects</div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 content-start overflow-y-auto pr-2 custom-scrollbar max-h-full pb-4">
      {DISPLAY_ORDER.map((typeId) => {
        const typeConfig = MODULE_TYPES.find(t => t.id === typeId);
        if (!typeConfig) return null;

        const mainKey = `equipped_${typeId}_main`;
        const subKey = `equipped_${typeId}_sub`;

        const mainModule = modules[mainKey] as EquippedModule | undefined;
        const subModule = modules[subKey] as EquippedModule | undefined;

        const mappedId = slotIdMap[typeId];
        const unlockKey = `module_unlock_${mappedId}`;
        const unlockLevel = progress[unlockKey] || 0;
        
        const subEffLevel = progress[`module_${mappedId}_sub`] || 0;
        const subEfficiency = getEfficiencyPercent(subEffLevel);

        const colors = typeColors[typeId] || typeColors['cannon'];

        return (
          <div 
            key={typeId} 
            className={`bg-slate-900 border-2 ${colors.border} ${colors.shadow} hover:${colors.glow} rounded-xl overflow-hidden h-fit transition-all duration-300`}
          >
            
            {/* Header */}
            <div className={`px-4 py-3 border-b-2 ${colors.border} flex items-center justify-between ${typeConfig.bg}`}>
              <div className="flex items-center gap-2">
                <typeConfig.icon size={18} className={typeConfig.color} />
                <span className="font-bold text-slate-200 text-sm uppercase tracking-wider">
                  {typeConfig.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-3">
              {/* Main Module */}
              {mainModule ? (
                renderModuleItem(typeId, mainModule, 'MAIN', unlockLevel, 100)
              ) : (
                <div className="text-center py-4 text-xs text-slate-600 italic border-b-2 border-slate-700/50">
                  No Main Module
                </div>
              )}

              {/* Assist Module */}
              {subModule ? (
                renderModuleItem(typeId, subModule, 'ASSIST', unlockLevel, subEfficiency)
              ) : (
                <div className="text-center py-4 text-xs text-slate-600 italic mt-2">
                  No Assist Module
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}