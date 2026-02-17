/**
 * 파일명: thetower/front/src/components/Stones/UnlockTab.tsx
 * 용도: 스톤 계산기 페이지의 '해금(Unlock)' 탭 컨텐츠
 * 기능: 기본 무기(UW), UW+, 모듈 슬롯의 해금 상태 관리 및 비용 테이블 표시, 무기 수동 선택 모달 트리거
 */
import { useState } from 'react';
import unlockCosts from '../../data/uw_unlock_costs.json';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import WeaponSelectModal from './Unlock/WeaponSelectModal';
import UwCostTable from './Unlock/UwCostTable';       
import ModuleUnlockTable from './Unlock/ModuleUnlockTable'; 

interface Props {
  progress: Record<string, any>;
  updateProgress: (key: string, value: any) => void;
  updateBatch: (updates: Record<string, any>) => void;
}

export default function UnlockTab({ progress, updateProgress, updateBatch }: Props) {
  // 해금할 무기를 선택하는 상태 관리
  const [selectingState, setSelectingState] = useState<{ 
    type: 'base' | 'plus'; 
    count: number; 
    totalCost: number; 
    selected: string[];
  } | null>(null);

  const allWeaponKeys = Object.keys(baseStats);
  const unlockedBase: string[] = Array.isArray(progress['unlocked_weapons']) ? progress['unlocked_weapons'] : [];
  const unlockedPlus: string[] = Array.isArray(progress['unlocked_plus_weapons']) ? progress['unlocked_plus_weapons'] : [];

  /** 
   * [내부 헬퍼] 선택된 무기 아이템들을 해금 리스트에 추가하고 상태를 초기화합니다.
   */
  const performUnlock = (type: 'base' | 'plus', newItems: string[]) => {
    if (type === 'base') {
      updateProgress('unlocked_weapons', [...unlockedBase, ...newItems]);
    } else {
      updateProgress('unlocked_plus_weapons', [...unlockedPlus, ...newItems]);
    }
    setSelectingState(null);
  };

  /** 
   * 테이블 행 클릭 시 호출되는 핸들러
   * - 해금 가능한 무기가 1개 남았거나 자동 선택 가능한 경우 즉시 해금
   * - 그 외에는 무기 선택 모달을 오픈
   */
  const handleRowClick = (type: 'base' | 'plus', count: number, totalCost: number) => {
    const available = allWeaponKeys.filter(k => {
        if (type === 'base') return !unlockedBase.includes(k);
        else return unlockedBase.includes(k) && !unlockedPlus.includes(k);
    });

    if (count === available.length) {
        performUnlock(type, available);
        return; 
    }

    setSelectingState({ type, count, totalCost, selected: [] });
  };

  /** 모달 내에서 무기 선택을 토글합니다. */
  const toggleWeaponSelection = (uwKey: string) => {
    if (!selectingState) return;
    const { selected, count, type } = selectingState;

    let newSelected = [...selected];
    if (selected.includes(uwKey)) {
      newSelected = selected.filter(k => k !== uwKey);
    } else if (selected.length < count) {
      newSelected = [...selected, uwKey];
    }

    // 목표 개수만큼 선택 완료 시 즉시 해금 수행
    if (newSelected.length === count) {
        performUnlock(type, newSelected);
    } else {
        setSelectingState({ ...selectingState, selected: newSelected });
    }
  };

  /** 특정 카테고리(Base/Plus)의 해금 정보를 초기화합니다. */
  const handleReset = (type: 'base' | 'plus') => {
    const updates: Record<string, any> = {};
    const targetList = type === 'base' ? unlockedBase : unlockedPlus;

    if (type === 'base') updates['unlocked_weapons'] = [];
    else updates['unlocked_plus_weapons'] = [];

    // 해금 리스트 제거뿐만 아니라 관련 스탯 레벨도 모두 0으로 초기화
    targetList.forEach(uwKey => {
      if (type === 'base') {
        Object.keys((baseStats as any)[uwKey]).forEach(stat => updates[`base_${uwKey}_${stat}`] = 0);
        updates['unlocked_plus_weapons'] = [];
        if ((plusStats as any)[uwKey]) {
           Object.keys((plusStats as any)[uwKey]).forEach(stat => updates[`plus_${uwKey}_${stat}`] = 0);
        }
      } else {
        if ((plusStats as any)[uwKey]) {
           Object.keys((plusStats as any)[uwKey]).forEach(stat => updates[`plus_${uwKey}_${stat}`] = 0);
        }
      }
    });
    updateBatch(updates);
  };

  /** 모듈 슬롯 업그레이드 핸들러 (최대 4레벨) */
  const handleModuleUpgrade = (moduleId: string) => {
    const key = `module_unlock_${moduleId}`;
    const currentLevel = progress[key] || 0;
    if (currentLevel >= 4) return;
    updateProgress(key, currentLevel + 1);
  };

  /** 모든 모듈 슬롯 해금 정보를 초기화합니다. */
  const resetModules = () => {
    const updates: Record<string, any> = {};
    ['attack', 'defense', 'generator', 'core'].forEach(id => {
      updates[`module_unlock_${id}`] = 0;
    });
    updateBatch(updates);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* 1. 기본 무기 해금 비용 테이블 */}
        <UwCostTable 
          title="Ultimate Weapon Unlock"
          type="base"
          costs={unlockCosts.unlock_costs}
          unlockedCount={unlockedBase.length}
          onRowClick={handleRowClick}
          onReset={handleReset}
        />

        {/* 2. UW+ 해금 비용 테이블 */}
        <UwCostTable 
          title="UW+ Unlock"
          type="plus"
          costs={unlockCosts.plus_unlock_costs}
          unlockedCount={unlockedPlus.length}
          onRowClick={handleRowClick}
          onReset={handleReset}
        />

        {/* 3. 모듈 슬롯 등급(해금) 테이블 */}
        <ModuleUnlockTable 
          progress={progress}
          onUpgrade={handleModuleUpgrade}
          onReset={resetModules}
        />
      </div>

      {/* 무기 선택용 팝업 모달 */}
      {selectingState && (
        <WeaponSelectModal
          state={selectingState}
          allWeaponKeys={allWeaponKeys}
          unlockedBase={unlockedBase}
          unlockedPlus={unlockedPlus}
          onToggle={toggleWeaponSelection}
          onClose={() => setSelectingState(null)}
        />
      )}
    </>
  );
}