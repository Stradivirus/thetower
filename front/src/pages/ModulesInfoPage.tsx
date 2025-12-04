import { useState, useEffect } from 'react';
import moduleData from '../data/module_list.json';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
// [Fixed] type 키워드 추가
import { type EquippedModule } from '../components/Modules/ModuleConstants';
import ModuleHeader from '../components/Modules/ModuleHeader';
import EquippedView from '../components/Modules/EquippedView';
import ModuleList from '../components/Modules/ModuleList';

export default function ModulesInfoPage() {
  const [activeTab, setActiveTab] = useState<'cannon' | 'armor' | 'generator' | 'core'>('cannon');
  const [rarity, setRarity] = useState<number>(3); 
  const [modulesState, setModulesState] = useState<Record<string, any>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isAssistMode, setIsAssistMode] = useState(false); 
  
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const loadModules = async () => {
      const localSaved = localStorage.getItem('thetower_modules');
      if (localSaved) {
        try { setModulesState(JSON.parse(localSaved)); } catch {}
      }

      if (token) {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/modules/`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
              const data = await response.json();
              if (Object.keys(data.modules_json).length > 0) {
                  setModulesState(data.modules_json);
                  localStorage.setItem('thetower_modules', JSON.stringify(data.modules_json));
              }
          }
        } catch (e) {
          console.error("Failed to fetch modules", e);
        }
      }
    };
    loadModules();
  }, [token]);

  const handleSave = async () => {
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }
    
    try {
        await fetchWithAuth(`${API_BASE_URL}/modules/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modules_json: modulesState })
        });
        
        localStorage.setItem('thetower_modules', JSON.stringify(modulesState));
        setIsChanged(false);
        alert("저장되었습니다.");
    } catch (e) {
        console.error("Save failed", e);
        alert("저장에 실패했습니다.");
    }
  };

  const toggleAssistMode = () => {
    const newMode = !isAssistMode;
    setIsAssistMode(newMode);

    if (!newMode) {
        const newState = { ...modulesState };
        let hasChanges = false;
        Object.keys(newState).forEach(key => {
            if (key.endsWith('_sub')) {
                delete newState[key];
                hasChanges = true;
            }
        });
        if (hasChanges) {
            setModulesState(newState);
            setIsChanged(true);
        }
    }
  };

  const handleRemoveEquip = (key: string) => {
    const newState = { ...modulesState };
    delete newState[key];
    setModulesState(newState);
    setIsChanged(true);
  };

  const toggleSelection = (moduleName: string) => {
    const mainKey = `equipped_${activeTab}_main`;
    const subKey = `equipped_${activeTab}_sub`;
    
    // 타입으로 사용
    const currentMain = modulesState[mainKey] as EquippedModule | undefined;
    const currentSub = modulesState[subKey] as EquippedModule | undefined;
    
    let newState = { ...modulesState };
    const newModuleData: EquippedModule = { name: moduleName, rarity: rarity };

    if (currentMain?.name === moduleName) {
        delete newState[mainKey];
    } else if (currentSub?.name === moduleName) {
        delete newState[subKey];
    } else {
        if (!isAssistMode) {
            newState[mainKey] = newModuleData;
        } else {
            if (!currentMain) {
                newState[mainKey] = newModuleData;
            } else if (!currentSub) {
                newState[subKey] = newModuleData;
            } else {
                newState[subKey] = newModuleData;
            }
        }
    }

    setModulesState(newState);
    setIsChanged(true);
  };

  const currentModules = moduleData[activeTab];

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-20 animate-fade-in h-[calc(100vh-80px)] flex flex-col">
      <ModuleHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rarity={rarity}
        setRarity={setRarity}
        isAssistMode={isAssistMode}
        toggleAssistMode={toggleAssistMode}
        handleSave={handleSave}
        isChanged={isChanged}
      />

      <div className="flex flex-1 gap-6 mt-6 overflow-hidden min-h-0">
        <EquippedView 
          modulesState={modulesState}
          isAssistMode={isAssistMode}
          onRemove={handleRemoveEquip}
        />
        
        <ModuleList 
          currentModules={currentModules}
          modulesState={modulesState}
          activeTab={activeTab}
          rarity={rarity}
          onToggle={toggleSelection}
        />
      </div>
    </div>
  );
}