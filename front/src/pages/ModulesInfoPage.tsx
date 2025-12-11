import { useState } from 'react';
import { saveModules } from '../api/modules';
import { MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModuleRerollView from '../components/Modules/RerollPanel';
import ModuleDetailModal from '../components/Modules/ModuleDetailModal';

export default function ModulesInfoPage() {
  const [isChanged, setIsChanged] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory' | 'reroll'>('equipped');

  // 모달 상태 관리
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
                  // 데이터 구조가 숫자면 객체로 변환하여 저장 (호환성)
                  if (typeof value === 'number') {
                    inventory_json[realName] = { rarity: value, effects: [] };
                  } else {
                    inventory_json[realName] = value;
                  }
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

  // --- Interaction Handlers ---

  // 1. 모듈 클릭 시 모달 열기
  const handleModuleClick = (type: string, name: string, data: any) => {
    setDetailModal({
      isOpen: true,
      type,
      name,
      data: data // data가 undefined면 모달 내부에서 초기값(Ancestral) 처리
    });
  };

  // 2. 모달: 저장
  const handleModalSave = (newData: { rarity: number; effects: string[] }) => {
    const { name, type } = detailModal;
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

    setModules(newState);
    setIsChanged(true);
    
    setDetailModal(prev => ({ ...prev, data: newData }));
  };

  // 3. 모달: 삭제
  const handleModalDelete = () => {
    const { name, type } = detailModal;
    const newState = { ...modules };

    // 보유 목록 삭제
    delete newState[`owned_${name}`];

    // 장착 해제
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) delete newState[mainKey];
    if (modules[subKey]?.name === name) delete newState[subKey];

    setModules(newState);
    setIsChanged(true);
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  };

  // 4. 모달: 장착
  const handleModalEquip = (slot: 'main' | 'sub') => {
    const { name, type, data } = detailModal;
    
    // 서브 슬롯 잠금 확인
    if (slot === 'sub') {
       const unlockKey = `module_unlock_${slotIdMap[type]}`;
       const unlockLevel = progress[unlockKey] || 0;
       if (unlockLevel <= 0) {
         alert("Assist slot is locked. Research 'Module Space' first.");
         return;
       }
    }

    const newState = { ...modules };
    
    const targetKey = `equipped_${type}_${slot}`;     // 장착 목표 슬롯
    const otherSlot = slot === 'main' ? 'sub' : 'main';
    const otherKey = `equipped_${type}_${otherSlot}`; // 반대편 슬롯

    // 반대편 슬롯에 '나' 자신이 있다면 제거 (이동 처리)
    if (newState[otherKey]?.name === name) {
      delete newState[otherKey];
    }

    // 장착 데이터 준비
    const moduleDataToEquip = { name, ...(data || { rarity: 5, effects: [] }) };

    // 목표 슬롯에 장착
    newState[targetKey] = moduleDataToEquip;
    
    // 보유 리스트(owned) 안전장치
    if (!newState[`owned_${name}`]) {
       newState[`owned_${name}`] = { 
         rarity: moduleDataToEquip.rarity, 
         effects: moduleDataToEquip.effects 
       };
    }

    setModules(newState);
    setIsChanged(true);
  };

  // 5. 모달: 장착 해제
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

  // 현재 모달에 띄운 모듈의 장착 상태 확인 Helper
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

      {/* [Fix] modulesState prop 제거 */}
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
      />
    </div>
  );
}