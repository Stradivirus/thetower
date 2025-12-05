import { useState } from 'react'; // useEffect 제거
import moduleData from '../data/module_list.json';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import { type EquippedModule } from '../components/Modules/ModuleConstants';
import ModuleHeader from '../components/Modules/ModuleHeader';
import EquippedView from '../components/Modules/EquippedView';
import ModuleList from '../components/Modules/ModuleList';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext'; // [New]

export default function ModulesInfoPage() {
  const [activeTab, setActiveTab] = useState<'cannon' | 'armor' | 'generator' | 'core'>('cannon');
  const [rarity, setRarity] = useState<number>(3); 
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  // [New] Context 사용
  const { modules, progress, setModules } = useGameData();
  const token = localStorage.getItem('access_token');

  // modulesState 대신 modules 사용 (Context 데이터)
  // setModulesState 대신 setModules 사용

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack',
    'armor': 'defense',
    'generator': 'generator',
    'core': 'core'
  };

  // [Optimization] useEffect 초기 로딩 로직 삭제 (Context가 알아서 함)

  const handleSaveProgress = async () => {
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }
    
    if (!isChanged) {
        console.log("변경사항이 없어 서버 저장을 건너뜁니다.");
        return;
    }
    
    try {
        await fetchWithAuth(`${API_BASE_URL}/modules/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modules_json: modules })
        });
        
        localStorage.setItem('thetower_modules', JSON.stringify(modules));
        setIsChanged(false);
    } catch (e) {
        console.error("Save failed", e);
        alert("저장에 실패했습니다.");
    }
  };

  const handleSaveAndSummary = async () => {
    if (isChanged && token) {
      await handleSaveProgress();
    }
    setIsSummaryOpen(true);
  };

  const handleRemoveEquip = (key: string) => {
    const newState = { ...modules };
    delete newState[key];
    setModules(newState); // Context 업데이트
    setIsChanged(true);
  };

  const toggleSelection = (moduleName: string) => {
    const mainKey = `equipped_${activeTab}_main`;
    const subKey = `equipped_${activeTab}_sub`;
    
    const unlockKey = `module_unlock_${slotIdMap[activeTab]}`;
    const unlockLevel = progress[unlockKey] || 0; 
    const isAssistUnlocked = unlockLevel > 0;

    const currentMain = modules[mainKey] as EquippedModule | undefined;
    const currentSub = modules[subKey] as EquippedModule | undefined;
    
    let newState = { ...modules };
    const newModuleData: EquippedModule = { name: moduleName, rarity: rarity };

    if (currentMain?.name === moduleName) {
        delete newState[mainKey];
    } else if (currentSub?.name === moduleName) {
        delete newState[subKey];
    } else {
        if (!currentMain) {
            newState[mainKey] = newModuleData;
        } else if (!currentSub) {
            if (isAssistUnlocked) {
                newState[subKey] = newModuleData;
            } else {
                alert("Assist 슬롯이 잠겨있습니다. Stone 탭에서 해금해주세요.");
                return; 
            }
        } else {
            if (isAssistUnlocked) {
                newState[subKey] = newModuleData;
            }
        }
    }

    setModules(newState); // Context 업데이트
    setIsChanged(true);
  };

  const currentModules = moduleData[activeTab];

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-20 animate-fade-in flex flex-col min-h-screen">
      <ModuleHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rarity={rarity}
        setRarity={setRarity}
        handleSave={handleSaveAndSummary}
        isChanged={isChanged}
        token={token}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6 mt-6">
        <div className="flex-1 w-full">
            <EquippedView 
            modulesState={modules} // Context state 전달
            onRemove={handleRemoveEquip}
            progress={progress} 
            />
        </div>
        
        <ModuleList 
          currentModules={currentModules}
          modulesState={modules} // Context state 전달
          activeTab={activeTab}
          rarity={rarity}
          onToggle={toggleSelection}
          progress={progress} 
        />
      </div>

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
        modulesState={modules} // Context state 전달
      />
    </div>
  );
}