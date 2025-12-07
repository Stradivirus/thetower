// src/pages/ModulesInfoPage.tsx
import { useState } from 'react';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import { type EquippedModule, MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModuleRerollView from '../components/Modules/Reroll/RerollPanel'; // [New] 새로 만든 컴포넌트 import

export default function ModulesInfoPage() {
  const [rarity, setRarity] = useState<number>(3); 
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  // [Modified] 뷰 모드에 'reroll' 추가
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

          await fetchWithAuth(`${API_BASE_URL}/modules/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ inventory_json, equipped_json })
          });
          
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
    // 리롤 탭에서는 선택 로직이 작동하지 않도록 방어 (UI상 드러나진 않지만 안전장치)
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
        // 'equipped' 모드 로직
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
    <div className="w-full h-[calc(100vh-64px)] px-4 pb-4 animate-fade-in flex flex-col">
      <ModuleHeader 
        rarity={rarity}
        setRarity={setRarity}
        handleSave={handleSaveProgress}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* [Modified] 뷰 모드에 따른 조건부 렌더링 */}
      {viewMode === 'reroll' ? (
        <div className="flex-1 min-h-0 mt-4">
          <ModuleRerollView />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-0 mt-4 overflow-y-auto custom-scrollbar">
          {MODULE_TYPES.map(type => (
            <ModuleColumn 
              key={type.id}
              moduleType={type}
              modules={modules}
              progress={progress}
              rarity={rarity}
              onToggle={toggleSelection}
              viewMode={viewMode as 'equipped' | 'inventory'} // 타입 단언 필요
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