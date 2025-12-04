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
  progress: Record<string, any>; // [New]
}

export default function ModuleList({ currentModules, modulesState, activeTab, rarity, onToggle, progress }: Props) {
  
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack',
    'armor': 'defense',
    'generator': 'generator',
    'core': 'core'
  };

  // 등급에 따라 텍스트 파싱 및 색상 적용
  const parseDescription = (text: string, rarityIdx: number) => {
    // 예: 20/40/60/80% 패턴 찾기
    const pattern = /([x+\-]?\d+(?:\.\d+)?(?:[%msx])?(?:\/[x+\-]?\d+(?:\.\d+)?[%msx]?)+)/g;
    return text.split(pattern).map((part, idx) => {
      if (pattern.test(part)) {
        const values = part.split('/');
        // 해당 등급의 값 가져오기
        let val = values[rarityIdx] || values[values.length - 1];
        
        // 단위(%, s, x) 유지 로직
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
        const mainKey = `equipped_${activeTab}_main`;
        const subKey = `equipped_${activeTab}_sub`;
        const mainModule = modulesState[mainKey] as EquippedModule | undefined;
        const subModule = modulesState[subKey] as EquippedModule | undefined;
        
        const isMain = mainModule?.name === module.name;
        const isSub = subModule?.name === module.name;
        const isSelected = isMain || isSub;

        // [New] 미리보기용 등급 계산
        let previewRarity = rarity; // 기본은 상단 헤더에서 선택한 등급

        if (isMain) {
            // 메인 슬롯에 장착된 경우, 해당 모듈의 등급 그대로 사용
            previewRarity = mainModule!.rarity;
        } else if (isSub) {
            // 어시스트 슬롯에 장착된 경우, 스톤 해금 상태에 따라 등급 제한
            const unlockKey = `module_unlock_${slotIdMap[activeTab]}`;
            const unlockLevel = progress[unlockKey] || 0; 
            const maxRarityIndex = Math.max(0, unlockLevel - 1);
            
            // (내 아이템 등급 vs 슬롯 제한 등급) 중 낮은 쪽 적용
            previewRarity = Math.min(subModule!.rarity, maxRarityIndex);
        }

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
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${activeRarity.color} ${activeRarity.border} ${activeRarity.bg}`}>
                        {activeRarity.short}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className={`text-xs leading-relaxed break-keep group-hover:text-slate-300 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
              {/* 계산된 previewRarity를 전달하여 텍스트 색상과 수치를 동적으로 변경 */}
              {parseDescription(module.desc, previewRarity)}
            </p>
          </div>
        );
      })}
    </div>
  );
}