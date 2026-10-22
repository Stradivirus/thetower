/**
 * 파일명: thetower/front/src/utils/moduleStateMutations.ts
 * 용도: 모듈 장착, 해제, 수정, 삭제, 프리셋 전환 및 초기 백필 시 상태 계산 순수 함수 모음
 * 기능: useModulesData 훅에서 사용하는 불변 상태 업데이트 로직 전담
 */
import type { ModulePresetsMap } from '../types/gameData';
import { EQUIPPED_SLOT_KEYS } from './moduleDataUtils';

/**
 * [초기 동기화] 장착 슬롯 및 프리셋 슬롯에 있는 부옵션이 owned_*에 누락되어 있다면 백필합니다.
 */
export const backfillOwnedEffects = (modules: any, initialPresets: ModulePresetsMap) => {
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

  return { hasOwnedBackfill, updatedModules };
};

/**
 * [상태 계산] 프리셋 전환 시 현재 슬롯 백업 및 대상 프리셋 슬롯 적용 상태를 반환합니다.
 */
export const computePresetSwitchState = (
  modules: any,
  presets: ModulePresetsMap,
  activePresetId: number,
  targetId: number
) => {
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

  return { newState, updatedPresets };
};

/**
 * [상태 계산] 상세 모달에서 수정한 모듈 정보를 modules 및 presets에 반영한 새 상태를 반환합니다.
 */
export const computeModalSaveState = (
  modules: any,
  presets: ModulePresetsMap,
  activePresetId: number,
  name: string,
  type: string,
  newData: { rarity: number; effects: string[]; instanceId: number; instances: Record<string, any> }
) => {
  const { instanceId, instances: newInstances } = newData;
  const newState = { ...modules };

  const currentOwned = (typeof newState[`owned_${name}`] === 'object' && newState[`owned_${name}`] !== null)
    ? newState[`owned_${name}`]
    : {};

  const updatedOwned = {
    ...currentOwned,
    instances: newInstances,
    ...(instanceId === 1 ? { rarity: newData.rarity, effects: newData.effects } : {})
  };
  newState[`owned_${name}`] = updatedOwned;

  const mainKey = `equipped_${type}_main`;
  const subKey = `equipped_${type}_sub`;

  if (modules[mainKey]?.name === name && (modules[mainKey]?.instanceId || 1) === instanceId) {
    newState[mainKey] = { name, instanceId, rarity: newData.rarity, effects: newData.effects };
  }
  if (modules[subKey]?.name === name && (modules[subKey]?.instanceId || 1) === instanceId) {
    newState[subKey] = { name, instanceId, rarity: newData.rarity, effects: newData.effects };
  }

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

  return { newState, updatedPresets, updatedOwned };
};

/**
 * [상태 계산] 모듈 삭제 시 인벤토리, 장착 슬롯, 모든 프리셋에서 제거한 새 상태를 반환합니다.
 */
export const computeModalDeleteState = (
  modules: any,
  presets: ModulePresetsMap,
  activePresetId: number,
  name: string,
  type: string
) => {
  const newState = { ...modules };
  delete newState[`owned_${name}`];

  const mainKey = `equipped_${type}_main`;
  const subKey = `equipped_${type}_sub`;

  if (modules[mainKey]?.name === name) delete newState[mainKey];
  if (modules[subKey]?.name === name) delete newState[subKey];

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

  return { newState, updatedPresets };
};

/**
 * [상태 계산] 모듈을 특정 슬롯(main/sub)에 장착했을 때의 새 상태를 반환합니다.
 */
export const computeModalEquipState = (
  modules: any,
  presets: ModulePresetsMap,
  activePresetId: number,
  name: string,
  type: string,
  data: any,
  slot: 'main' | 'sub',
  instanceId: number = 1,
  instanceData?: { rarity: number; effects: string[] }
) => {
  const newState = { ...modules };
  const targetKey = `equipped_${type}_${slot}`;
  const otherSlot = slot === 'main' ? 'sub' : 'main';
  const otherKey = `equipped_${type}_${otherSlot}`;

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

  return { newState, updatedPresets };
};

/**
 * [상태 계산] 모듈 장착 해제 시의 새 상태를 반환합니다.
 */
export const computeModalUnequipState = (
  modules: any,
  presets: ModulePresetsMap,
  activePresetId: number,
  name: string,
  type: string
) => {
  const newState = { ...modules };
  const mainKey = `equipped_${type}_main`;
  const subKey = `equipped_${type}_sub`;

  if (modules[mainKey]?.name === name) delete newState[mainKey];
  if (modules[subKey]?.name === name) delete newState[subKey];

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

  return { newState, updatedPresets };
};
