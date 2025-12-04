// [Fixed] type 키워드 추가
import { RARITIES, type EquippedModule } from './ModuleConstants';

interface ModuleItem {
  name: string;
  desc: string;
}

interface Props {
  currentModules: ModuleItem[];
  modulesState: Record<string, any>;
  activeTab: string;
  rarity: number;
  onToggle: (name: string) => void;
}

export default function ModuleList({ currentModules, modulesState, activeTab, rarity, onToggle }: Props) {
  
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

  return (
    <div className="w-[480px] max-w-md flex-shrink-0 flex flex-col overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-4">
      {currentModules.map((module, idx) => {
        // 타입으로 사용
        const mainModule = modulesState[`equipped_${activeTab}_main`] as EquippedModule | undefined;
        const subModule = modulesState[`equipped_${activeTab}_sub`] as EquippedModule | undefined;
        
        const isMain = mainModule?.name === module.name;
        const isSub = subModule?.name === module.name;
        const isSelected = isMain || isSub;

        const previewRarity = isMain ? mainModule!.rarity : (isSub ? subModule!.rarity : rarity);
        const activeRarity = RARITIES[previewRarity];

        return (
          <div 
            key={idx} 
            onClick={() => onToggle(module.name)}
            className={`
              relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group hover:bg-slate-800
              ${isSelected 
                ? `bg-slate-800 ${activeRarity.border.replace('/50', '')} shadow-md` 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                {module.name}
              </h4>
              {(isMain || isSub) && (
                <div className="flex gap-1.5 items-center">
                  {isMain && (
                    <>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500 text-slate-900 shadow-sm">MAIN</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${RARITIES[mainModule!.rarity].color} ${RARITIES[mainModule!.rarity].border} ${RARITIES[mainModule!.rarity].bg}`}>
                        {RARITIES[mainModule!.rarity].short}
                      </span>
                    </>
                  )}
                  {isSub && (
                    <>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white shadow-sm">ASSIST</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${RARITIES[subModule!.rarity].color} ${RARITIES[subModule!.rarity].border} ${RARITIES[subModule!.rarity].bg}`}>
                        {RARITIES[subModule!.rarity].short}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className={`text-xs leading-relaxed break-keep group-hover:text-slate-300 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
              {parseDescription(module.desc, previewRarity)}
            </p>
          </div>
        );
      })}
    </div>
  );
}