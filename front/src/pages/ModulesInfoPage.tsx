/**
 * 파일명: thetower/front/src/pages/ModulesInfoPage.tsx
 * 용도: 사용자의 모듈(장비) 관리 및 리롤 시뮬레이션 페이지
 * 기능: 장착 중인 모듈 조회, 인벤토리 관리, 모듈 상세 설정(등급/효과) 및 리롤 시뮬레이터 제공
 */
import { useState } from 'react';
import { saveModules } from '../api/modules';
import { MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModuleRerollView from '../components/Modules/RerollPanel';
import ModuleDetailModal from '../components/Modules/ModuleDetailModal';
import moduleImg from '../images/module.webp';

/** 
 * [헬퍼] 클라이언트의 모듈 상태를 서버 저장용 JSON 포맷으로 변환합니다.
 */
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
  const [isChanged, setIsChanged] = useState(false); // 변경 사항 발생 여부
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 뷰 모드 상태: 장착중 / 인벤토리 / 리롤 시뮬레이터 / 정보
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory' | 'reroll' | 'info'>('equipped');

  // 상세 모달 상태
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

  // 슬롯 ID와 연구 키 매핑
  const slotIdMap: Record<string, string> = {
    'cannon': 'attack', 'armor': 'defense', 'generator': 'generator', 'core': 'core'
  };

  /** 
   * [전체 저장] 변경된 모듈 상태를 서버에 저장합니다.
   */
  const handleSaveProgress = async () => {
    if (!token) { alert("Login Required"); return; }
    
    if (isChanged) {
      try {
          setIsSaving(true);
          const payload = generateSavePayload(modules);
          await saveModules(payload);
          
          localStorage.setItem('thetower_modules', JSON.stringify(modules));
          setIsChanged(false);
          setIsSummaryOpen(true); 
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

  /** 
   * 모듈 카드 클릭 시 상세 설정 모달을 엽니다.
   */
  const handleModuleClick = (type: string, name: string, data: any) => {
    setDetailModal({
      isOpen: true,
      type,
      name,
      data: data 
    });
  };

  /** 
   * 상세 모달에서 수정한 내용을 DB에 즉시 저장합니다. (낙관적 업데이트 적용)
   */
  const handleModalSave = async (newData: { rarity: number; effects: string[] }) => {
    if (!token) { alert("Login Required"); return; }

    const { name, type } = detailModal;
    const newState = { ...modules };

    // 1. 상태 업데이트 준비
    newState[`owned_${name}`] = newData;
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) newState[mainKey] = { name, ...newData };
    if (modules[subKey]?.name === name) newState[subKey] = { name, ...newData };

    // 2. 서버 저장 시도
    try {
      setIsSaving(true);
      const payload = generateSavePayload(newState);
      await saveModules(payload);

      // 3. 성공 시 상태 확정
      setModules(newState);
      localStorage.setItem('thetower_modules', JSON.stringify(newState));
      setDetailModal(prev => ({ ...prev, data: newData, isOpen: false }));
      
    } catch (e) {
      console.error("Modal Instant Save Failed", e);
      alert("Save failed due to an error.");
    } finally {
      setIsSaving(false);
    }
  };

  /** 모듈을 목록에서 삭제합니다. */
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

  /** 모듈을 특정 슬롯(Main/Sub)에 장착합니다. */
  const handleModalEquip = (slot: 'main' | 'sub') => {
    const { name, type, data } = detailModal;
    
    // Sub 슬롯 장착 시 연구 해금 여부 체크
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

    // 다른 슬롯에 같은 모듈이 있으면 해제
    if (newState[otherKey]?.name === name) delete newState[otherKey];

    const moduleDataToEquip = { name, ...(data || { rarity: 5, effects: [] }) };
    newState[targetKey] = moduleDataToEquip;
    
    // 보유 목록에 없으면 추가
    if (!newState[`owned_${name}`]) {
       newState[`owned_${name}`] = { 
         rarity: moduleDataToEquip.rarity, 
         effects: moduleDataToEquip.effects 
       };
    }

    setModules(newState);
    setIsChanged(true);
  };

  /** 모듈 장착을 해제합니다. */
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

  /** 현재 선택된 모듈의 장착 상태를 확인합니다. */
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
      {/* 상단 탭 및 저장 컨트롤 헤더 */}
      <ModuleHeader 
        handleSave={handleSaveProgress}
        isChanged={isChanged}
        token={token}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* 리롤 시뮬레이션 또는 모듈 목록 표시 */}
      {viewMode === 'reroll' ? (
        <div className="mt-4">
          <ModuleRerollView />
        </div>
      ) : viewMode === 'info' ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-full max-w-4xl bg-slate-900/50 rounded-2xl border border-slate-800 p-6 overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              Module Guide
            </h2>
            <div className="flex justify-center">
              <img src={moduleImg} alt="Module Info" className="max-w-full h-auto rounded-lg shadow-2xl" />
            </div>
          </div>
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

      {/* 궁무/모듈 상태 요약 모달 */}
      <UwSummaryModal 
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        progress={progress}
      />

      {/* 모듈 상세 설정 모달 */}
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