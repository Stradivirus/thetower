import { useState, useEffect } from 'react';
import moduleData from '../data/module_list.json';
import { fetchWithAuth, API_BASE_URL } from '../utils/apiConfig';
import { fetchProgress } from '../api/progress';
import { type EquippedModule } from '../components/Modules/ModuleConstants';
import ModuleHeader from '../components/Modules/ModuleHeader';
import EquippedView from '../components/Modules/EquippedView';
import ModuleList from '../components/Modules/ModuleList';
import UwSummaryModal from '../components/Modal/SummaryModal';

export default function ModulesInfoPage() {
  const [activeTab, setActiveTab] = useState<'cannon' | 'armor' | 'generator' | 'core'>('cannon');
  const [rarity, setRarity] = useState<number>(3); 
  const [modulesState, setModulesState] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  const token = localStorage.getItem('access_token');

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack',
    'armor': 'defense',
    'generator': 'generator',
    'core': 'core'
  };

  useEffect(() => {
    const loadData = async () => {
      // 1. 로컬 스토리지 데이터 로드 (빠른 렌더링)
      const localModules = localStorage.getItem('thetower_modules');
      if (localModules) {
        try { setModulesState(JSON.parse(localModules)); } catch {}
      }
      const localProgress = localStorage.getItem('thetower_progress');
      if (localProgress) {
        try { setProgress(JSON.parse(localProgress)); } catch {}
      }

      // 2. 서버 데이터 로드 (로그인 시)
      if (token) {
        try {
          const [moduleRes, progressData] = await Promise.all([
            fetchWithAuth(`${API_BASE_URL}/modules/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetchProgress().catch(() => ({})) 
          ]);

          if (moduleRes.ok) {
            const data = await moduleRes.json();
            if (Object.keys(data.modules_json).length > 0) {
              setModulesState(data.modules_json);
              localStorage.setItem('thetower_modules', JSON.stringify(data.modules_json));
            }
          }
          
          if (Object.keys(progressData).length > 0) {
            setProgress(progressData);
            localStorage.setItem('thetower_progress', JSON.stringify(progressData));
          }

        } catch (e) {
          console.error("Failed to fetch data", e);
        }
      }
    };
    loadData();
  }, [token]);

  // [Modified] 저장만 하는 함수
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
            body: JSON.stringify({ modules_json: modulesState })
        });
        
        localStorage.setItem('thetower_modules', JSON.stringify(modulesState));
        setIsChanged(false);
    } catch (e) {
        console.error("Save failed", e);
        alert("저장에 실패했습니다.");
    }
  };

  // [NEW] 저장 + 요약 통합 함수
  const handleSaveAndSummary = async () => {
    // 변경사항이 있다면 저장 로직 실행
    if (isChanged && token) {
      await handleSaveProgress();
    }
    // 요약 모달은 항상 열기
    setIsSummaryOpen(true);
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
    
    const unlockKey = `module_unlock_${slotIdMap[activeTab]}`;
    const unlockLevel = progress[unlockKey] || 0; 
    const isAssistUnlocked = unlockLevel > 0;

    const currentMain = modulesState[mainKey] as EquippedModule | undefined;
    const currentSub = modulesState[subKey] as EquippedModule | undefined;
    
    let newState = { ...modulesState };
    const newModuleData: EquippedModule = { name: moduleName, rarity: rarity };

    // 1. 이미 장착된 모듈을 클릭하면 해제
    if (currentMain?.name === moduleName) {
        delete newState[mainKey];
    } else if (currentSub?.name === moduleName) {
        delete newState[subKey];
    } else {
        // 2. 새로운 모듈 장착 시도
        if (!currentMain) {
            // 메인이 비었으면 메인에 장착
            newState[mainKey] = newModuleData;
        } else if (!currentSub) {
            // 메인이 찼고 서브가 비었으면 -> 해금 여부 확인 후 장착
            if (isAssistUnlocked) {
                newState[subKey] = newModuleData;
            } else {
                alert("Assist 슬롯이 잠겨있습니다. Stone 탭에서 해금해주세요.");
                return; 
            }
        } else {
            // 둘 다 찼으면 -> 서브 교체 (역시 해금 여부 확인)
            if (isAssistUnlocked) {
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
        handleSave={handleSaveAndSummary}
        isChanged={isChanged}
        token={token}
      />

      <div className="flex flex-1 gap-6 mt-6 overflow-hidden min-h-0">
        <EquippedView 
          modulesState={modulesState}
          onRemove={handleRemoveEquip}
          progress={progress} 
        />
        
        <ModuleList 
          currentModules={currentModules}
          modulesState={modulesState}
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
        modulesState={modulesState}
      />
    </div>
  );
}