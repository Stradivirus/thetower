/**
 * 파일명: thetower/front/src/hooks/useModuleDetailState.ts
 * 용도: ModuleDetailModal 내부의 1호기/2호기 인스턴스, 등급, 부옵션 슬롯 상태 관리 훅
 * 기능: 호기 전환/추가/삭제, 부옵션 선택 반영, SlotViewer용 슬롯 데이터 가공
 */
import { useState, useEffect, useMemo } from 'react';
import { RARITY } from '../components/Modules/ModuleConstants';
import { MODULE_TYPES } from '../data/module_reroll_data';
import type { SimulationSlot } from '../components/Modules/Reroll/SlotViewer';

export interface InstanceData {
  rarity: number;
  effects: string[];
}

interface UseModuleDetailStateParams {
  isOpen: boolean;
  moduleType: string;
  currentData: any;
  equippedInstanceId?: number | null;
  isSaving: boolean;
  onSave: (data: {
    rarity: number;
    effects: string[];
    instanceId: number;
    instances: Record<string, InstanceData>;
  }) => void;
}

export function useModuleDetailState({
  isOpen,
  moduleType,
  currentData,
  equippedInstanceId = 1,
  isSaving,
  onSave,
}: UseModuleDetailStateParams) {
  // 1호기 / 2호기 인스턴스 맵 초기화
  const [instances, setInstances] = useState<Record<string, InstanceData>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<number>(1);

  const [rarity, setRarity] = useState<number>(RARITY.ANCESTRAL);
  const [effects, setEffects] = useState<(string | null)[]>([]);

  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  // 모달 오픈 시 인스턴스 데이터 동기화
  useEffect(() => {
    if (!isOpen) return;

    const isDataObject = currentData && typeof currentData === 'object';
    const initialR = isDataObject
      ? (typeof currentData.rarity === 'number' ? currentData.rarity : RARITY.ANCESTRAL)
      : (typeof currentData === 'number' ? currentData : RARITY.ANCESTRAL);
    const initialEff = (isDataObject && Array.isArray(currentData.effects)) ? currentData.effects : [];

    const instMap: Record<string, InstanceData> = {};

    if (isDataObject && currentData.instances && Object.keys(currentData.instances).length > 0) {
      Object.entries(currentData.instances).forEach(([id, inst]: [string, any]) => {
        instMap[id] = {
          rarity: typeof inst.rarity === 'number' ? inst.rarity : initialR,
          effects: Array.isArray(inst.effects) ? inst.effects : [],
        };
      });
    }

    // 1호기가 누락되어 있다면 기본값 할당
    if (!instMap['1']) {
      instMap['1'] = {
        rarity: initialR,
        effects: initialEff,
      };
    }

    setInstances(instMap);

    // 기본 선택 호기: 현재 장착된 호기 또는 1호기
    const initId = (equippedInstanceId && instMap[equippedInstanceId.toString()]) ? equippedInstanceId : 1;
    setSelectedInstanceId(initId);

    const activeInst = instMap[initId.toString()] || instMap['1'];
    setRarity(activeInst.rarity);

    const filled = Array(8).fill(null);
    activeInst.effects.forEach((eff: string, idx: number) => {
      if (idx < 8) filled[idx] = eff;
    });
    setEffects(filled);
  }, [currentData, isOpen, equippedInstanceId]);

  /** 호기 전환 핸들러 (1호기 <-> 2호기) */
  const handleSwitchInstance = (targetId: number) => {
    if (targetId === selectedInstanceId || isSaving) return;

    // 현재 편집 중인 내용을 현재 호기에 임시 반영
    const cleanEffects = effects.filter((e): e is string => e !== null);
    const updatedInstances = {
      ...instances,
      [selectedInstanceId.toString()]: {
        rarity,
        effects: cleanEffects,
      },
    };
    setInstances(updatedInstances);

    // 대상 호기 데이터 로드
    const targetInst = updatedInstances[targetId.toString()] || { rarity: RARITY.ANCESTRAL, effects: [] };
    setSelectedInstanceId(targetId);
    setRarity(targetInst.rarity);

    const filled = Array(8).fill(null);
    targetInst.effects.forEach((eff: string, idx: number) => {
      if (idx < 8) filled[idx] = eff;
    });
    setEffects(filled);
  };

  /** 2호기 생성 (1호기 옵션을 복사하여 생성) */
  const handleAddSecondInstance = () => {
    if (isSaving) return;
    const cleanEffects = effects.filter((e): e is string => e !== null);
    const updatedInstances = {
      ...instances,
      [selectedInstanceId.toString()]: {
        rarity,
        effects: cleanEffects,
      },
      '2': {
        rarity,
        effects: [...cleanEffects],
      },
    };
    setInstances(updatedInstances);
    setSelectedInstanceId(2);
  };

  /** 2호기 삭제 */
  const handleDeleteSecondInstance = () => {
    if (isSaving) return;
    if (!confirm('2호기를 삭제하시겠습니까?')) return;

    const updatedInstances = { ...instances };
    delete updatedInstances['2'];
    setInstances(updatedInstances);

    // 1호기로 복귀
    setSelectedInstanceId(1);
    const inst1 = updatedInstances['1'] || { rarity: RARITY.ANCESTRAL, effects: [] };
    setRarity(inst1.rarity);
    const filled = Array(8).fill(null);
    inst1.effects.forEach((eff: string, idx: number) => {
      if (idx < 8) filled[idx] = eff;
    });
    setEffects(filled);
  };

  /** 현재 모듈 타입에 사용 가능한 부옵션 리스트를 가져옵니다. */
  const availableEffects = useMemo(() => {
    return MODULE_TYPES[moduleType] || [];
  }, [moduleType]);

  /** 슬롯 뷰어 표시를 위해 현재 편집 중인 효과 데이터를 Slot 인터페이스에 맞게 가공합니다. */
  const simulationSlots: SimulationSlot[] = useMemo(() => {
    return effects.map((effectId, idx) => {
      if (!effectId) {
        return { id: idx, effectId: null, rarity: 0, value: '-', unit: '', isLocked: false };
      }
      const effectData = availableEffects.find(e => e.id === effectId);
      if (!effectData) {
        return { id: idx, effectId: null, rarity: 0, value: 'Unknown', unit: '', isLocked: false };
      }

      const val = effectData.values[rarity];

      return {
        id: idx,
        effectId: effectId,
        rarity: rarity,
        value: val ?? '-',
        unit: effectData.unit,
        isLocked: false,
      };
    });
  }, [effects, availableEffects, rarity]);

  /** 슬롯 클릭 시 부옵션 수동 선택 모달을 엽니다. */
  const handleSlotClick = (idx: number) => {
    if (isSaving) return;
    setSelectedSlotIdx(idx);
    setSelectorOpen(true);
  };

  /** 선택 모달에서 옵션을 골랐을 때 호출되는 콜백 */
  const handleEffectSelect = (effectId: string) => {
    if (selectedSlotIdx === null) return;
    const newEffects = [...effects];
    newEffects[selectedSlotIdx] = effectId && effectId.trim() !== '' ? effectId : null;
    setEffects(newEffects);

    // 인스턴스 맵에도 즉시 반영
    const cleanEffects = newEffects.filter((e): e is string => e !== null);
    setInstances(prev => ({
      ...prev,
      [selectedInstanceId.toString()]: {
        rarity,
        effects: cleanEffects,
      },
    }));
    setSelectorOpen(false);
  };

  /** 현재 편집된 내용을 부모 컴포넌트로 전달하여 저장합니다. */
  const handleSave = () => {
    if (isSaving) return;
    const cleanEffects = effects.filter((e): e is string => e !== null);
    const updatedInstances = {
      ...instances,
      [selectedInstanceId.toString()]: {
        rarity,
        effects: cleanEffects,
      },
    };
    setInstances(updatedInstances);
    onSave({
      rarity,
      effects: cleanEffects,
      instanceId: selectedInstanceId,
      instances: updatedInstances,
    });
  };

  // 현재 슬롯을 제외한 다른 슬롯에 이미 들어간 옵션만 중복 제외 목록으로 지정
  const currentSelectedIds = useMemo(() => {
    return effects.filter((e, idx): e is string => e !== null && idx !== selectedSlotIdx);
  }, [effects, selectedSlotIdx]);

  return {
    instances,
    selectedInstanceId,
    rarity,
    setRarity,
    effects,
    isSelectorOpen,
    setSelectorOpen,
    availableEffects,
    simulationSlots,
    currentSelectedIds,
    hasSecondInstance: !!instances['2'],
    handleSwitchInstance,
    handleAddSecondInstance,
    handleDeleteSecondInstance,
    handleSlotClick,
    handleEffectSelect,
    handleSave,
  };
}
