import { useState } from 'react';
import { saveModules } from '../api/modules';
import { type EquippedModule, MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModuleRerollView from '../components/Modules/RerollPanel';

export default function ModulesInfoPage() {
  const [rarity, setRarity] = useState<number>(3); 
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory' | 'reroll'>('equipped');

  const { modules, progress, setModules } = useGameData();
  const token = localStorage.getItem('access_token');

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  const handleSaveProgress = async () => {
    if (!token) { alert("로그인이 필요합니다."); return; }
    
    if (isChanged) {
      try {
          const inventory_json: Record<string, any> = {};
          const equipped_json: Record<string, any> = {};

          Object.entries(modules).forEach(([key, value]) => {
              if (key.startsWith('equipped_')) {
                  equipped_json[key] = value;
              } else if (key.startsWith('owned_')) {
                  const realName = key.replace('owned_', '');
                  inventory_json[realName] = { rarity: value };
              }
          });

          await saveModules({ inventory_json, equipped_json });
          
          localStorage.setItem('thetower_modules', JSON.stringify(modules));
          setIsChanged(false);
          console.log("Modules saved successfully");
      } catch (e) { 
          console.error("Save failed", e); 
          alert("저장에 실패했습니다."); 
          return; 
      }
    }
    
    setIsSummaryOpen(true);
  };

  const toggleSelection = (moduleType: string, moduleName: string) => {
    if (viewMode === 'reroll') return;

    let newState = { ...modules };

    if (viewMode === 'inventory') {
        const ownedKey = `owned_${moduleName}`;
        const currentRarity = newState[ownedKey]; 

        if (currentRarity === undefined) {
            newState[ownedKey] = 3; // 없으면 Ancestral(3)부터 시작
        } else if (currentRarity > 0) {
            newState[ownedKey] = currentRarity - 1; // 등급 내리기
        } else {
            delete newState[ownedKey]; // Epic(0)에서 한 번 더 누르면 삭제
        }
    } else {
        const mainKey = `equipped_${moduleType}_main`;
        const subKey = `equipped_${moduleType}_sub`;
        const unlockKey = `module_unlock_${slotIdMap[moduleType]}`;
        const unlockLevel = progress[unlockKey] || 0; 
        const isAssistUnlocked = unlockLevel > 0;

        const currentMain = modules[mainKey] as EquippedModule | undefined;
        const currentSub = modules[subKey] as EquippedModule | undefined;
        const newModuleData: EquippedModule = { name: moduleName, rarity: rarity };

        if (currentMain?.name === moduleName) {
            delete newState[mainKey];
        } else if (currentSub?.name === moduleName) {
            delete newState[subKey];
        } else {
            if (currentMain && isAssistUnlocked) {
                newState[subKey] = newModuleData;
            } else {
                newState[mainKey] = newModuleData;
            }
        }
    }

    setModules(newState);
    setIsChanged(true);
  };

  return (
    // [Modified] 고정 높이 제거 (h-[calc...] -> min-h-screen 또는 제거)
    // flex-col은 유지하되 전체 스크롤을 허용
    <div className="w-full px-4 pb-12 animate-fade-in flex flex-col">
      <ModuleHeader 
        rarity={rarity}
        setRarity={setRarity}
        handleSave={handleSaveProgress}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'reroll' ? (
        // [Modified] 리롤 뷰는 독립적인 높이를 가질 수 있으므로 h-fit 또는 적절히 조정
        <div className="flex-1 mt-4 h-[calc(100vh-140px)]">
          <ModuleRerollView />
        </div>
      ) : (
        // [Modified] overflow-y-auto 제거, min-h-0 제거 -> 자연스럽게 늘어나도록 변경
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4 items-start">
          {MODULE_TYPES.map(type => (
            <ModuleColumn 
              key={type.id}
              moduleType={type}
              modules={modules}
              progress={progress}
              rarity={rarity}
              onToggle={toggleSelection}
              viewMode={viewMode as 'equipped' | 'inventory'}
            />
          ))}
        </div>
      )}

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
        modulesState={modules}
      />
    </div>
  );
}