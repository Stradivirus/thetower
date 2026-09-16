/**
 * 파일명: thetower/front/src/pages/ModulesInfoPage.tsx
 * 용도: 사용자의 모듈(장비) 관리 및 리롤 시뮬레이션 페이지
 * 기능: 장착 중인 모듈 조회, 인벤토리 관리, 모듈 상세 설정(등급/효과) 및 리롤 시뮬레이터 제공
 */
import { useState, useEffect } from 'react';
import { saveModules } from '../api/modules';
import { MODULE_TYPES } from '../components/Modules/ModuleConstants';
import UwSummaryModal from '../components/Modal/SummaryModal';
import { useGameData } from '../contexts/GameDataContext';
import ModuleColumn from '../components/Modules/ModuleColumn';
import ModuleHeader from '../components/Modules/ModuleHeader';
import ModulePresetBar from '../components/Modules/ModulePresetBar';
import ModuleRerollView from '../components/Modules/RerollPanel';
import ModuleDetailModal from '../components/Modules/ModuleDetailModal';
import moduleImg from '../images/module.webp';
import type { ModulePresetsMap } from '../types/gameData';

const EQUIPPED_SLOT_KEYS = [
  'equipped_cannon_main', 'equipped_cannon_sub',
  'equipped_armor_main', 'equipped_armor_sub',
  'equipped_generator_main', 'equipped_generator_sub',
  'equipped_core_main', 'equipped_core_sub'
];

/**
 * [헬퍼] 모듈 데이터로부터 초기 5개 프리셋 구조를 안전하게 추출/생성합니다.
 */
const getInitialPresets = (modulesData: any): ModulePresetsMap => {
  if (modulesData?.presets && Object.keys(modulesData.presets).length > 0) {
    const result: ModulePresetsMap = { ...modulesData.presets };
    for (let i = 1; i <= 5; i++) {
      if (!result[i.toString()]) {
        result[i.toString()] = { id: i, name: `Preset ${i}`, slots: {} };
      }
    }
    return result;
  }

  // 기존 프리셋이 없던 경우: 현재 equipped_* 슬롯들을 Preset 1로 생성
  const currentSlots: Record<string, any> = {};
  if (modulesData) {
    EQUIPPED_SLOT_KEYS.forEach(k => {
      if (modulesData[k]) {
        currentSlots[k] = modulesData[k];
      }
    });
  }

  return {
    "1": { id: 1, name: "Preset 1", slots: currentSlots },
    "2": { id: 2, name: "Preset 2", slots: {} },
    "3": { id: 3, name: "Preset 3", slots: {} },
    "4": { id: 4, name: "Preset 4", slots: {} },
    "5": { id: 5, name: "Preset 5", slots: {} }
  };
};

/**
 * [헬퍼] 모듈의 기존 등급 및 부옵션(effects)을 모든 소스(인벤토리, 현재 장착슬롯, 모든 프리셋)에서 역추적하여 반환합니다.
 */
const getExistingModuleData = (moduleName: string, modulesState: any, presetsState?: ModulePresetsMap) => {
  // 1. owned_ 확인 (부옵션이 있는 경우 최우선)
  const owned = modulesState?.[`owned_${moduleName}`];
  if (owned && typeof owned === 'object' && Array.isArray(owned.effects) && owned.effects.length > 0) {
    return owned;
  }

  // 2. 현재 장착 슬롯 확인
  for (const key of EQUIPPED_SLOT_KEYS) {
    const slotData = modulesState?.[key];
    if (slotData?.name === moduleName && Array.isArray(slotData.effects) && slotData.effects.length > 0) {
      return slotData;
    }
  }

  // 3. 모든 프리셋의 슬롯 확인
  const allPresets = presetsState || modulesState?.presets;
  if (allPresets) {
    for (const preset of Object.values(allPresets) as any[]) {
      if (preset?.slots) {
        for (const slotData of Object.values(preset.slots) as any[]) {
          if (slotData?.name === moduleName && Array.isArray(slotData.effects) && slotData.effects.length > 0) {
            return slotData;
          }
        }
      }
    }
  }

  // 부옵션은 없지만 등급이 지정된 경우 반환
  if (owned) {
    return typeof owned === 'number' ? { rarity: owned, effects: [] } : owned;
  }
  
  return null;
};

/** 
 * [헬퍼] 클라이언트의 모듈 상태를 서버 저장용 JSON 포맷으로 변환합니다.
 */
const generateSavePayload = (modulesData: any, activePresetId?: number, presets?: ModulePresetsMap) => {
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

  const finalActivePreset = activePresetId !== undefined ? activePresetId : (modulesData.active_preset || 1);
  const finalPresets = presets !== undefined ? presets : (modulesData.presets || {});

  equipped_json['active_preset'] = finalActivePreset;
  equipped_json['presets'] = finalPresets;

  return { inventory_json, equipped_json };
};

export default function ModulesInfoPage() {
  const [isChanged, setIsChanged] = useState(false); // 변경 사항 발생 여부
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 뷰 모드 상태: 장착중 / 인벤토리 / 리롤 시뮬레이터 / 정보
  const [viewMode, setViewMode] = useState<'equipped' | 'inventory' | 'reroll' | 'info'>('equipped');

  // 모듈 프리셋 상태 (1~5)
  const [activePresetId, setActivePresetId] = useState<number>(1);
  const [presets, setPresets] = useState<ModulePresetsMap>({
    "1": { id: 1, name: "Preset 1", slots: {} },
    "2": { id: 2, name: "Preset 2", slots: {} },
    "3": { id: 3, name: "Preset 3", slots: {} },
    "4": { id: 4, name: "Preset 4", slots: {} },
    "5": { id: 5, name: "Preset 5", slots: {} }
  });

  // 상세 모달 상태
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    type: string;
    name: string;
    data: any;
    instanceId?: number;
  }>({
    isOpen: false,
    type: '',
    name: '',
    data: null,
    instanceId: 1
  });

  const { modules, progress, setModules } = useGameData();
  const token = localStorage.getItem('access_token');

  // modules 데이터 로드 시 프리셋 동기화 및 기존 부옵션 보존
  useEffect(() => {
    if (modules && Object.keys(modules).length > 0) {
      if (modules.active_preset) {
        setActivePresetId(modules.active_preset);
      }
      const initialPresets = getInitialPresets(modules);
      setPresets(initialPresets);

      // 기존 장착 슬롯 및 프리셋의 부옵션이 owned_*에 누락되어 있다면 자동 동기화
      let hasOwnedBackfill = false;
      const updatedModules = { ...modules };

      // 1) 현재 슬롯들의 부옵션 보존
      EQUIPPED_SLOT_KEYS.forEach(k => {
        const eq = modules[k];
        if (eq && eq.name) {
          const ownedKey = `owned_${eq.name}`;
          const currentOwned = modules[ownedKey];
          if (!currentOwned || (typeof currentOwned === 'object' && (!currentOwned.effects || currentOwned.effects.length === 0) && eq.effects?.length > 0)) {
            updatedModules[ownedKey] = { rarity: eq.rarity, effects: eq.effects || [] };
            hasOwnedBackfill = true;
          }
        }
      });

      // 2) 프리셋 슬롯들의 부옵션 보존
      Object.values(initialPresets).forEach(p => {
        if (p?.slots) {
          Object.values(p.slots).forEach((s: any) => {
            if (s?.name && s.effects?.length > 0) {
              const ownedKey = `owned_${s.name}`;
              const currentOwned = updatedModules[ownedKey];
              if (!currentOwned || (typeof currentOwned === 'object' && (!currentOwned.effects || currentOwned.effects.length === 0))) {
                updatedModules[ownedKey] = { rarity: s.rarity, effects: s.effects || [] };
                hasOwnedBackfill = true;
              }
            }
          });
        }
      });

      if (hasOwnedBackfill) {
        setModules(updatedModules);
      }
    }
  }, [modules]);

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
          const payload = generateSavePayload(modules, activePresetId, presets);
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
   * [프리셋 전환] 다른 프리셋으로 전환합니다. 
   * 현재 활성 프리셋의 슬롯들을 저장하고, 대상 프리셋의 슬롯들을 적용합니다.
   * 프리셋만 바꾸는 경우 별도의 저장 경고(*)를 띄우지 않고 조용히 동기화합니다.
   */
  const handleSelectPreset = async (targetId: number) => {
    if (targetId === activePresetId) return;

    // 1. 현재 슬롯 백업
    const currentSlots: Record<string, any> = {};
    EQUIPPED_SLOT_KEYS.forEach(key => {
      if (modules[key]) {
        currentSlots[key] = modules[key];
      }
    });

    const targetPreset = presets[targetId.toString()] || { id: targetId, name: `Preset ${targetId}`, slots: {} };
    const updatedPresets = {
      ...presets,
      [activePresetId.toString()]: {
        ...(presets[activePresetId.toString()] || { id: activePresetId, name: `Preset ${activePresetId}`, slots: {} }),
        slots: currentSlots
      }
    };

    // 2. 새로운 modules 상태 구성: 기존 equipped_* 제거 후 targetPreset.slots 적용
    const newState = { ...modules };
    EQUIPPED_SLOT_KEYS.forEach(key => {
      delete newState[key];
    });

    Object.entries(targetPreset.slots || {}).forEach(([key, val]) => {
      newState[key] = val;
    });

    newState.active_preset = targetId;
    newState.presets = updatedPresets;

    setModules(newState);
    setActivePresetId(targetId);
    setPresets(updatedPresets);
    
    // 프리셋만 전환하는 경우 별도의 저장 경고(*)를 띄우지 않고 로컬 상태만 갱신
    setIsChanged(false);
    localStorage.setItem('thetower_modules', JSON.stringify(newState));
  };

  /** 
   * [프리셋 이름 변경] 특정 프리셋의 이름을 수정합니다.
   */
  const handleRenamePreset = (id: number, newName: string) => {
    const updatedPresets = {
      ...presets,
      [id.toString()]: {
        ...(presets[id.toString()] || { id, name: `Preset ${id}`, slots: {} }),
        name: newName
      }
    };
    setPresets(updatedPresets);

    const newState = {
      ...modules,
      presets: updatedPresets
    };
    setModules(newState);
    setIsChanged(true);
  };

  /** 
   * 모듈 카드 클릭 시 상세 설정 모달을 엽니다.
   * 인스턴스(1호기, 2호기) 정보 및 장착된 호기 번호를 함께 전달합니다.
   */
  const handleModuleClick = (type: string, name: string, data: any) => {
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;
    let equippedInstId = 1;
    if (modules[mainKey]?.name === name) {
      equippedInstId = modules[mainKey]?.instanceId || 1;
    } else if (modules[subKey]?.name === name) {
      equippedInstId = modules[subKey]?.instanceId || 1;
    }

    const existing = getExistingModuleData(name, modules, presets);

    let finalData = data || existing || {};
    const owned = modules[`owned_${name}`];
    if (owned && typeof owned === 'object') {
      finalData = {
        ...finalData,
        instances: owned.instances || finalData.instances
      };
    }

    setDetailModal({
      isOpen: true,
      type,
      name,
      data: finalData,
      instanceId: equippedInstId
    });
  };

  /** 
   * 상세 모달에서 수정한 내용을 DB에 즉시 저장합니다. (특정 호기 기준)
   */
  const handleModalSave = async (newData: { 
    rarity: number; 
    effects: string[]; 
    instanceId: number; 
    instances: Record<string, any>; 
  }) => {
    if (!token) { alert("Login Required"); return; }

    const { name, type } = detailModal;
    const { instanceId, instances: newInstances } = newData;
    const newState = { ...modules };

    // 1. owned_ 상태 업데이트
    const currentOwned = (typeof newState[`owned_${name}`] === 'object' && newState[`owned_${name}`] !== null)
      ? newState[`owned_${name}`]
      : {};

    const updatedOwned = {
      ...currentOwned,
      instances: newInstances,
      ...(instanceId === 1 ? { rarity: newData.rarity, effects: newData.effects } : {})
    };
    newState[`owned_${name}`] = updatedOwned;

    // 2. 현재 장착 슬롯 업데이트 (동일한 instanceId를 장착 중인 슬롯만)
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name && (modules[mainKey]?.instanceId || 1) === instanceId) {
      newState[mainKey] = { name, instanceId, rarity: newData.rarity, effects: newData.effects };
    }
    if (modules[subKey]?.name === name && (modules[subKey]?.instanceId || 1) === instanceId) {
      newState[subKey] = { name, instanceId, rarity: newData.rarity, effects: newData.effects };
    }

    // 3. 모든 프리셋의 슬롯 중 동일 호기를 장착한 슬롯들만 업데이트
    const updatedPresets = { ...presets };
    Object.keys(updatedPresets).forEach(pId => {
      const p = updatedPresets[pId];
      if (p?.slots) {
        const newSlots = { ...p.slots };
        Object.keys(newSlots).forEach(sKey => {
          const slotData = newSlots[sKey];
          if (slotData?.name === name && (slotData.instanceId || 1) === instanceId) {
            newSlots[sKey] = { name, instanceId, rarity: newData.rarity, effects: newData.effects };
          }
        });
        updatedPresets[pId] = { ...p, slots: newSlots };
      }
    });

    newState.presets = updatedPresets;
    newState.active_preset = activePresetId;

    // 4. 서버 저장 시도
    try {
      setIsSaving(true);
      const payload = generateSavePayload(newState, activePresetId, updatedPresets);
      await saveModules(payload);

      setModules(newState);
      setPresets(updatedPresets);
      localStorage.setItem('thetower_modules', JSON.stringify(newState));
      setDetailModal(prev => ({ ...prev, data: updatedOwned, isOpen: false }));
      
    } catch (e: any) {
      console.error("Modal Instant Save Failed", e);
      alert(e?.message || "Save failed due to an error.");
    } finally {
      setIsSaving(false);
    }
  };

  /** 모듈을 목록에서 삭제합니다. */
  const handleModalDelete = async () => {
    const { name, type } = detailModal;
    const newState = { ...modules };

    delete newState[`owned_${name}`];

    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) delete newState[mainKey];
    if (modules[subKey]?.name === name) delete newState[subKey];

    // 모든 프리셋에서도 삭제된 모듈 제거
    const updatedPresets = { ...presets };
    Object.keys(updatedPresets).forEach(pId => {
      const p = updatedPresets[pId];
      if (p?.slots) {
        const newSlots = { ...p.slots };
        Object.keys(newSlots).forEach(sKey => {
          if (newSlots[sKey]?.name === name) {
            delete newSlots[sKey];
          }
        });
        updatedPresets[pId] = { ...p, slots: newSlots };
      }
    });

    newState.presets = updatedPresets;
    newState.active_preset = activePresetId;

    if (token) {
      try {
        setIsSaving(true);
        const payload = generateSavePayload(newState, activePresetId, updatedPresets);
        await saveModules(payload);

        setPresets(updatedPresets);
        setModules(newState);
        localStorage.setItem('thetower_modules', JSON.stringify(newState));
        setIsChanged(false);
        setDetailModal(prev => ({ ...prev, isOpen: false }));
      } catch (e: any) {
        console.error("Modal Delete Save Failed", e);
        alert(e?.message || "Save failed due to an error.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setPresets(updatedPresets);
      setModules(newState);
      setIsChanged(true);
      setDetailModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  /** 모듈을 특정 슬롯(Main/Sub)에 장착합니다. (호기 지정 장착) */
  const handleModalEquip = async (slot: 'main' | 'sub', instanceId: number = 1, instanceData?: { rarity: number; effects: string[] }) => {
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

    const targetEffects = instanceData?.effects || (data?.effects && data.effects.length > 0 ? data.effects : []);
    const targetRarity = instanceData?.rarity ?? (data?.rarity ?? 5);

    const moduleDataToEquip = { 
      name, 
      instanceId, 
      rarity: targetRarity, 
      effects: targetEffects 
    };
    newState[targetKey] = moduleDataToEquip;
    
    // owned_ 갱신
    const currentOwned = (typeof newState[`owned_${name}`] === 'object' && newState[`owned_${name}`] !== null)
      ? newState[`owned_${name}`]
      : {};
    const currentInstances = currentOwned.instances || {};
    const updatedInstances = {
      ...currentInstances,
      [instanceId.toString()]: {
        rarity: targetRarity,
        effects: targetEffects
      }
    };
    newState[`owned_${name}`] = { 
      ...currentOwned,
      instances: updatedInstances,
      ...(instanceId === 1 ? { rarity: targetRarity, effects: targetEffects } : {})
    };

    // 현재 활성 프리셋의 슬롯에도 동기화
    const targetPreset = presets[activePresetId.toString()] || { id: activePresetId, name: `Preset ${activePresetId}`, slots: {} };
    const updatedPresetSlots = { ...targetPreset.slots };
    if (updatedPresetSlots[otherKey]?.name === name) delete updatedPresetSlots[otherKey];
    updatedPresetSlots[targetKey] = moduleDataToEquip;

    const updatedPresets = {
      ...presets,
      [activePresetId.toString()]: {
        ...targetPreset,
        slots: updatedPresetSlots
      }
    };

    newState.presets = updatedPresets;
    newState.active_preset = activePresetId;

    if (token) {
      try {
        setIsSaving(true);
        const payload = generateSavePayload(newState, activePresetId, updatedPresets);
        await saveModules(payload);

        setPresets(updatedPresets);
        setModules(newState);
        localStorage.setItem('thetower_modules', JSON.stringify(newState));
        setIsChanged(false);
        setDetailModal(prev => ({ ...prev, isOpen: false }));
      } catch (e: any) {
        console.error("Modal Equip Save Failed", e);
        alert(e?.message || "Save failed due to an error.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setPresets(updatedPresets);
      setModules(newState);
      setIsChanged(true);
      setDetailModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  /** 모듈 장착을 해제합니다. */
  const handleModalUnequip = async () => {
    const { name, type } = detailModal;
    const newState = { ...modules };

    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) delete newState[mainKey];
    if (modules[subKey]?.name === name) delete newState[subKey];

    // 현재 활성 프리셋의 슬롯에서도 해제
    const targetPreset = presets[activePresetId.toString()] || { id: activePresetId, name: `Preset ${activePresetId}`, slots: {} };
    const updatedPresetSlots = { ...targetPreset.slots };
    if (updatedPresetSlots[mainKey]?.name === name) delete updatedPresetSlots[mainKey];
    if (updatedPresetSlots[subKey]?.name === name) delete updatedPresetSlots[subKey];

    const updatedPresets = {
      ...presets,
      [activePresetId.toString()]: {
        ...targetPreset,
        slots: updatedPresetSlots
      }
    };

    newState.presets = updatedPresets;
    newState.active_preset = activePresetId;

    if (token) {
      try {
        setIsSaving(true);
        const payload = generateSavePayload(newState, activePresetId, updatedPresets);
        await saveModules(payload);

        setPresets(updatedPresets);
        setModules(newState);
        localStorage.setItem('thetower_modules', JSON.stringify(newState));
        setIsChanged(false);
        setDetailModal(prev => ({ ...prev, isOpen: false }));
      } catch (e: any) {
        console.error("Modal Unequip Save Failed", e);
        alert(e?.message || "Save failed due to an error.");
      } finally {
        setIsSaving(false);
      }
    } else {
      setPresets(updatedPresets);
      setModules(newState);
      setIsChanged(true);
      setDetailModal(prev => ({ ...prev, isOpen: false }));
    }
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

  /** 현재 선택된 모듈의 장착 호기 번호를 확인합니다. */
  const getEquippedInstanceId = () => {
    if (!detailModal.isOpen) return 1;
    const { name, type } = detailModal;
    const mainKey = `equipped_${type}_main`;
    const subKey = `equipped_${type}_sub`;

    if (modules[mainKey]?.name === name) return modules[mainKey]?.instanceId || 1;
    if (modules[subKey]?.name === name) return modules[subKey]?.instanceId || 1;
    return 1;
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

      {/* 모듈 프리셋 선택 및 이름 변경 바 (장착 및 인벤토리 탭에서 노출) */}
      {(viewMode === 'equipped' || viewMode === 'inventory') && (
        <ModulePresetBar
          activePresetId={activePresetId}
          presets={presets}
          onSelectPreset={handleSelectPreset}
          onRenamePreset={handleRenamePreset}
          disabled={isSaving}
        />
      )}

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
        equippedInstanceId={getEquippedInstanceId()}
        isSaving={isSaving} 
      />
    </div>
  );
}