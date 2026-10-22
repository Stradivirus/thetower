/**
 * 파일명: thetower/front/src/hooks/useModulesData.ts
 * 용도: 모듈 페이지(ModulesInfoPage)의 상태, 프리셋 및 상세 모달 액션 관리 훅
 * 기능: 프리셋 전환/이름 변경, 모듈 장착/해제/수정/삭제 및 서버 동기화
 */
import { useState, useEffect } from 'react';
import { saveModules } from '../api/modules';
import { useGameData } from '../contexts/GameDataContext';
import type { ModulePresetsMap } from '../types/gameData';
import {
  EQUIPPED_SLOT_KEYS,
  SLOT_ID_MAP,
  getInitialPresets,
  getExistingModuleData,
  generateSavePayload,
  computeModalSaveState,
  computeModalDeleteState,
  computeModalEquipState,
  computeModalUnequipState,
} from '../utils/moduleDataUtils';

export function useModulesData() {
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
  }, [modules, setModules]);

  /** 변경된 상태를 로컬 반영 후 서버에 즉시 저장합니다. */
  const applyAndSaveModalState = async (
    newState: any,
    updatedPresets: ModulePresetsMap,
    nextModalData?: any
  ) => {
    setPresets(updatedPresets);
    setModules(newState);
    setIsChanged(true);
    setDetailModal(prev => ({
      ...prev,
      ...(nextModalData !== undefined ? { data: nextModalData } : {}),
      isOpen: false
    }));

    if (token) {
      try {
        setIsSaving(true);
        const payload = generateSavePayload(newState, activePresetId, updatedPresets);
        await saveModules(payload);
        setIsChanged(false);
      } catch (e: any) {
        console.error("Modal Save Failed", e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  /** [전체 저장] 변경된 모듈 상태를 서버에 저장하고 요약 모달을 엽니다. (비로그인 시 요약 모달만 오픈) */
  const handleSaveProgress = async () => {
    if (!token) {
      setIsSummaryOpen(true);
      return;
    }
    
    try {
      setIsSaving(true);
      const payload = generateSavePayload(modules, activePresetId, presets);
      await saveModules(payload);
      
      setIsChanged(false);
      setIsSummaryOpen(true); 
    } catch (e: any) { 
      console.error("Save failed", e); 
      alert(e?.message || "Save Failed"); 
    } finally {
      setIsSaving(false);
    }
  };

  /** [프리셋 전환] 다른 프리셋으로 전환하고 슬롯을 교체합니다. */
  const handleSelectPreset = async (targetId: number) => {
    if (targetId === activePresetId) return;

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
    setIsChanged(false);

    if (token) {
      try {
        const payload = generateSavePayload(newState, targetId, updatedPresets);
        await saveModules(payload);
      } catch (e) {
        console.warn("Silent preset save failed:", e);
      }
    }
  };

  /** [프리셋 이름 변경] 특정 프리셋의 이름을 수정합니다. */
  const handleRenamePreset = (id: number, newName: string) => {
    const updatedPresets = {
      ...presets,
      [id.toString()]: {
        ...(presets[id.toString()] || { id, name: `Preset ${id}`, slots: {} }),
        name: newName
      }
    };
    setPresets(updatedPresets);
    setModules({ ...modules, presets: updatedPresets });
    setIsChanged(true);
  };

  /** 모듈 카드 클릭 시 상세 설정 모달을 엽니다. */
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

  /** 상세 모달에서 수정한 내용을 반영합니다. */
  const handleModalSave = async (newData: {
    rarity: number;
    effects: string[];
    instanceId: number;
    instances: Record<string, any>;
  }) => {
    const { name, type } = detailModal;
    const { newState, updatedPresets, updatedOwned } = computeModalSaveState(
      modules,
      presets,
      activePresetId,
      name,
      type,
      newData
    );
    await applyAndSaveModalState(newState, updatedPresets, updatedOwned);
  };

  /** 모듈을 목록에서 삭제합니다. */
  const handleModalDelete = async () => {
    const { name, type } = detailModal;
    const { newState, updatedPresets } = computeModalDeleteState(
      modules,
      presets,
      activePresetId,
      name,
      type
    );
    await applyAndSaveModalState(newState, updatedPresets);
  };

  /** 모듈을 특정 슬롯(Main/Sub)에 장착합니다. */
  const handleModalEquip = async (
    slot: 'main' | 'sub',
    instanceId: number = 1,
    instanceData?: { rarity: number; effects: string[] }
  ) => {
    const { name, type, data } = detailModal;

    if (slot === 'sub') {
      const unlockKey = `module_unlock_${SLOT_ID_MAP[type]}`;
      const unlockLevel = progress[unlockKey] || 0;
      if (unlockLevel <= 0) {
        alert("Assist slot is locked. Research 'Module Space' first.");
        return;
      }
    }

    const { newState, updatedPresets } = computeModalEquipState(
      modules,
      presets,
      activePresetId,
      name,
      type,
      data,
      slot,
      instanceId,
      instanceData
    );
    await applyAndSaveModalState(newState, updatedPresets);
  };

  /** 모듈 장착을 해제합니다. */
  const handleModalUnequip = async () => {
    const { name, type } = detailModal;
    const { newState, updatedPresets } = computeModalUnequipState(
      modules,
      presets,
      activePresetId,
      name,
      type
    );
    await applyAndSaveModalState(newState, updatedPresets);
  };

  /** 현재 선택된 모듈의 장착 상태를 확인합니다. */
  const getEquipStatus = () => {
    if (!detailModal.isOpen) return null;
    const { name, type } = detailModal;
    if (modules[`equipped_${type}_main`]?.name === name) return 'main';
    if (modules[`equipped_${type}_sub`]?.name === name) return 'sub';
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

  return {
    token,
    modules,
    progress,
    isChanged,
    isSummaryOpen,
    setIsSummaryOpen,
    isSaving,
    viewMode,
    setViewMode,
    activePresetId,
    presets,
    detailModal,
    setDetailModal,
    handleSaveProgress,
    handleSelectPreset,
    handleRenamePreset,
    handleModuleClick,
    handleModalSave,
    handleModalDelete,
    handleModalEquip,
    handleModalUnequip,
    getEquipStatus,
    getEquippedInstanceId,
  };
}
