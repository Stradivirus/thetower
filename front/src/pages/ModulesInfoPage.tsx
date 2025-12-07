import { useState } from 'react';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import { type EquippedModule, MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';

export default function ModulesInfoPage() {
  const [rarity, setRarity] = useState<number>(3); 
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory'>('equipped');

  const { modules, progress, setModules } = useGameData();
  const token = localStorage.getItem('access_token');

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  const handleSaveProgress = async () => {
    if (!token) { alert("로그인이 필요합니다."); return; }
    if (!isChanged) return;
    
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
    } catch (e) { console.error("Save failed", e); alert("저장에 실패했습니다."); }
  };

  const handleSaveAndSummary = async () => {
    if (isChanged && token) await handleSaveProgress();
    setIsSummaryOpen(true);
  };

  const toggleSelection = (moduleType: string, moduleName: string) => {
    let newState = { ...modules };

    if (viewMode === 'inventory') {
        // [Inventory Logic] 클릭 시 등급 역순 순환 (없음 -> 3 -> 2 -> 1 -> 0 -> 없음)
        const ownedKey = `owned_${moduleName}`;
        const currentRarity = newState[ownedKey]; // undefined or 0~3 number

        if (currentRarity === undefined) {
            // 미보유 -> 태고(3)로 시작 (역순)
            newState[ownedKey] = 3;
        } else if (currentRarity > 0) {
            // 등급 하강 (3->2, 2->1, 1->0)
            newState[ownedKey] = currentRarity - 1;
        } else {
            // 에픽(0) -> 미보유(삭제)
            delete newState[ownedKey];
        }
    } else {
        // [Equipped Logic] 기존 장착 로직 유지
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
        handleSave={handleSaveAndSummary}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-0 mt-4">
        {MODULE_TYPES.map(type => (
          <ModuleColumn 
            key={type.id}
            moduleType={type}
            modules={modules}
            progress={progress}
            rarity={rarity}
            onToggle={toggleSelection}
            viewMode={viewMode}
          />
        ))}
      </div>

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
        modulesState={modules}
      />
    </div>
  );
}