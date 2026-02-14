import { useState } from 'react';
import { saveModules } from '../api/modules';
import { MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModuleRerollView from '../components/Modules/RerollPanel';
import ModuleDetailModal from '../components/Modules/ModuleDetailModal';

// [Helper] 모듈 상태를 서버 전송용 JSON 포맷으로 변환하는 함수
const generateSavePayload = (modulesData: any) => {
  const inventory_json: Record<string, any> = {};
  const equipped_json: Record<string, any> = {};

  Object.entries(modulesData).forEach(([key, value]: [string, any]) => {
      if (key.startsWith('equipped_')) {
          equipped_json[key] = value;
      } else if (key.startsWith('owned_')) {
          const realName = key.replace('owned_', '');
          if (typeof value === 'number') {
            inventory_json[realName] = { rarity: value, effects: [] };
          } else {
            inventory_json[realName] = value;
          }
      }
  });
  return { inventory_json, equipped_json };
};

export default function ModulesInfoPage() {
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  // [New] 저장 중 로딩 상태
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory' | 'reroll'>('equipped');

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: string;
    name: string;
    data: any;
  }>({
    isOpen: false,
    type: '',
    name: '',
    data: null
  });

  const { modules, progress, setModules } = useGameData();
  const token = localStorage.getItem('access_token');

  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  // --- Data Logic ---

  // 전체 저장 (상단 헤더 버튼용)
  const handleSaveProgress = async () => {
    if (!token) { alert("Login Required"); return; }
    
    if (isChanged) {
      try {
          setIsSaving(true);
          const payload = generateSavePayload(modules);
          await saveModules(payload);
          
          localStorage.setItem('thetower_modules', JSON.stringify(modules));
          setIsChanged(false);
          console.log("Modules saved successfully");
          setIsSummaryOpen(true); // 저장 성공 시 요약 모달 오픈
      } catch (e) { 
          console.error("Save failed", e); 
          alert("Save Failed"); 
      } finally {
          setIsSaving(false);
      }
    } else {
       setIsSummaryOpen(true);
    }
  };

  // --- Interaction Handlers ---

  const handleModuleClick = (type: string, name: string, data: any) => {
    setDetailModal({
      isOpen: true,
      type,
      name,
      data: data 
    });
  };

  // [Fix] 2. 모달: 즉시 저장 (DB 반영)
  const handleModalSave = async (newData: { rarity: number; effects: string[] }) => {
    if (!token) { alert("Login Required"); return; }

    const { name, type } = detailModal;
    
    // 1. 새로운 로컬 상태 미리 계산 (낙관적 업데이트 준비)
    const newState = { ...modules };

    // 보유 목록 업데이트
    newState[`owned_${name}`] = newData;

    // 장착 중인 데이터도 동기화
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) {
      newState[mainKey] = { name, ...newData };
    }
    if (modules[subKey]?.name === name) {
      newState[subKey] = { name, ...newData };
    }

    // 2. DB 저장 시도
    try {
      setIsSaving(true);
      
      // 계산된 newState를 기준으로 페이로드 생성
      const payload = generateSavePayload(newState);
      await saveModules(payload);

      // 3. 성공 시: 로컬 상태 업데이트 및 로컬 스토리지 동기화
      setModules(newState);
      localStorage.setItem('thetower_modules', JSON.stringify(newState));
      
      // 모달 데이터 업데이트 (UI 반영)
      setDetailModal(prev => ({ ...prev, data: newData }));
      
      console.log("Module updated and saved to DB");
      setDetailModal(prev => ({ ...prev, isOpen: false })); // 저장 후 닫기
      
    } catch (e) {
      console.error("Modal Instant Save Failed", e);
      alert("Save failed due to an error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalDelete = () => {
    const { name, type } = detailModal;
    const newState = { ...modules };

    delete newState[`owned_${name}`];

    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) delete newState[mainKey];
    if (modules[subKey]?.name === name) delete newState[subKey];

    setModules(newState);
    setIsChanged(true);
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalEquip = (slot: 'main' | 'sub') => {
    const { name, type, data } = detailModal;
    
    if (slot === 'sub') {
       const unlockKey = `module_unlock_${slotIdMap[type]}`;
       const unlockLevel = progress[unlockKey] || 0;
       if (unlockLevel <= 0) {
         alert("Assist slot is locked. Research 'Module Space' first.");
         return;
       }
    }

    const newState = { ...modules };
    const targetKey = `equipped_${type}_${slot}`;
    const otherSlot = slot === 'main' ? 'sub' : 'main';
    const otherKey = `equipped_${type}_${otherSlot}`;

    if (newState[otherKey]?.name === name) {
      delete newState[otherKey];
    }

    const moduleDataToEquip = { name, ...(data || { rarity: 5, effects: [] }) };
    newState[targetKey] = moduleDataToEquip;
    
    if (!newState[`owned_${name}`]) {
       newState[`owned_${name}`] = { 
         rarity: moduleDataToEquip.rarity, 
         effects: moduleDataToEquip.effects 
       };
    }

    setModules(newState);
    setIsChanged(true);
  };

  const handleModalUnequip = () => {
    const { name, type } = detailModal;
    const newState = { ...modules };

    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) delete newState[mainKey];
    if (modules[subKey]?.name === name) delete newState[subKey];

    setModules(newState);
    setIsChanged(true);
  };

  const getEquipStatus = () => {
    if (!detailModal.isOpen) return null;
    const { name, type } = detailModal;
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) return 'main';
    if (modules[subKey]?.name === name) return 'sub';
    return null;
  };

  return (
    <div className="w-full px-4 pb-12 animate-fade-in flex flex-col">
      <ModuleHeader 
        handleSave={handleSaveProgress}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'reroll' ? (
        <div className="mt-4">
          <ModuleRerollView />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4 items-start">
          {MODULE_TYPES.map(type => (
            <ModuleColumn 
              key={type.id}
              moduleType={type}
              modules={modules}
              progress={progress}
              onModuleClick={handleModuleClick} 
              viewMode={viewMode as 'equipped' | 'inventory'}
            />
          ))}
        </div>
      )}

      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />

      <ModuleDetailModal 
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
        moduleType={detailModal.type}
        moduleName={detailModal.name}
        currentData={detailModal.data}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onEquip={handleModalEquip}
        onUnequip={handleModalUnequip}
        equipStatus={getEquipStatus()}
        isSaving={isSaving} 
      />
    </div>
  );
}