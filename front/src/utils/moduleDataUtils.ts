/**
 * 파일명: thetower/front/src/utils/moduleDataUtils.ts
 * 용도: 모듈 데이터 정제, 프리셋 초기화, 상태 변이(장착/해제/수정/삭제) 및 서버 저장용 페이로드 생성 유틸리티
 * 기능: 초기 5개 프리셋 생성, 모듈 기존 등급/부옵션 역추적, 모달 액션별 상태 계산, 저장용 JSON 직렬화
 */
import type { ModulePresetsMap } from '../types/gameData';

export const EQUIPPED_SLOT_KEYS = [
  'equipped_cannon_main', 'equipped_cannon_sub',
  'equipped_armor_main', 'equipped_armor_sub',
  'equipped_generator_main', 'equipped_generator_sub',
  'equipped_core_main', 'equipped_core_sub'
];

// 슬롯 ID와 연구 키 매핑
export const SLOT_ID_MAP: Record<string, string> = {
  cannon: 'attack',
  armor: 'defense',
  generator: 'generator',
  core: 'core',
};

/**
 * [헬퍼] 모듈 데이터로부터 초기 5개 프리셋 구조를 안전하게 추출/생성합니다.
 */
export const getInitialPresets = (modulesData: any): ModulePresetsMap => {
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
export const getExistingModuleData = (moduleName: string, modulesState: any, presetsState?: ModulePresetsMap) => {
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
 * [헬퍼] 클라이언트의 모듈 상태를 서버 저장용 JSON 포맷으로 안전하게 정제 및 변환합니다.
 */
export const generateSavePayload = (modulesData: any, activePresetId?: number, presets?: ModulePresetsMap) => {
  const inventory_json: Record<string, any> = {};
  const equipped_json: Record<string, any> = {};

  Object.entries(modulesData || {}).forEach(([key, value]: [string, any]) => {
    if (key.startsWith('equipped_')) {
      if (value && typeof value === 'object' && value.name) {
        equipped_json[key] = {
          name: value.name,
          instanceId: value.instanceId || 1,
          rarity: typeof value.rarity === 'number' ? value.rarity : 5,
          effects: Array.isArray(value.effects) ? value.effects.filter((e: any) => typeof e === 'string' && e.trim() !== '') : []
        };
      }
    } else if (key.startsWith('owned_')) {
      const realName = key.replace('owned_', '');
      if (typeof value === 'number') {
        inventory_json[realName] = { rarity: value, effects: [] };
      } else if (value && typeof value === 'object') {
        const cleanInstances: Record<string, any> = {};
        if (value.instances && typeof value.instances === 'object') {
          Object.entries(value.instances).forEach(([instId, inst]: [string, any]) => {
            if (inst && typeof inst === 'object') {
              cleanInstances[instId] = {
                rarity: typeof inst.rarity === 'number' ? inst.rarity : (typeof value.rarity === 'number' ? value.rarity : 5),
                effects: Array.isArray(inst.effects) ? inst.effects.filter((e: any) => typeof e === 'string' && e.trim() !== '') : []
              };
            }
          });
        }
        inventory_json[realName] = {
          rarity: typeof value.rarity === 'number' ? value.rarity : 5,
          effects: Array.isArray(value.effects) ? value.effects.filter((e: any) => typeof e === 'string' && e.trim() !== '') : [],
          ...(Object.keys(cleanInstances).length > 0 ? { instances: cleanInstances } : {})
        };
      }
    }
  });

  const finalActivePreset = activePresetId !== undefined ? activePresetId : (modulesData?.active_preset || 1);
  const sourcePresets = presets !== undefined ? presets : (modulesData?.presets || {});
  
  const finalPresets: ModulePresetsMap = {};
  for (let i = 1; i <= 5; i++) {
    const idStr = i.toString();
    const p = sourcePresets[idStr];
    const cleanSlots: Record<string, any> = {};
    if (p?.slots && typeof p.slots === 'object') {
      Object.entries(p.slots).forEach(([sKey, sVal]: [string, any]) => {
        if (sVal && typeof sVal === 'object' && sVal.name) {
          cleanSlots[sKey] = {
            name: sVal.name,
            instanceId: sVal.instanceId || 1,
            rarity: typeof sVal.rarity === 'number' ? sVal.rarity : 5,
            effects: Array.isArray(sVal.effects) ? sVal.effects.filter((e: any) => typeof e === 'string' && e.trim() !== '') : []
          };
        }
      });
    }
    finalPresets[idStr] = {
      id: i,
      name: p?.name || `Preset ${i}`,
      slots: cleanSlots
    };
  }

  equipped_json['active_preset'] = finalActivePreset;
  equipped_json['presets'] = finalPresets;

  return { inventory_json, equipped_json };
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
