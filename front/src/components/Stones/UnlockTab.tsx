import { useState } from 'react';
import unlockCosts from '../../data/uw_unlock_costs.json';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import WeaponSelectModal from './Unlock/WeaponSelectModal';
import UwCostTable from './Unlock/UwCostTable';       // [New] 분리된 컴포넌트
import ModuleUnlockTable from './Unlock/ModuleUnlockTable'; // [New] 분리된 컴포넌트

interface Props {
  progress: Record<string, any>;
  updateProgress: (key: string, value: any) => void;
  updateBatch: (updates: Record<string, any>) => void;
}

export default function UnlockTab({ progress, updateProgress, updateBatch }: Props) {
  const [selectingState, setSelectingState] = useState<{ 
    type: 'base' | 'plus'; 
    count: number; 
    totalCost: number; 
    selected: string[];
  } | null>(null);

  const allWeaponKeys = Object.keys(baseStats);
  const unlockedBase: string[] = Array.isArray(progress['unlocked_weapons']) ? progress['unlocked_weapons'] : [];
  const unlockedPlus: string[] = Array.isArray(progress['unlocked_plus_weapons']) ? progress['unlocked_plus_weapons'] : [];

  // [Helper] 실제 해금 실행
  const performUnlock = (type: 'base' | 'plus', newItems: string[]) => {
    if (type === 'base') {
      updateProgress('unlocked_weapons', [...unlockedBase, ...newItems]);
    } else {
      updateProgress('unlocked_plus_weapons', [...unlockedPlus, ...newItems]);
    }
    setSelectingState(null);
  };

  // --- 핸들러 ---
  const handleRowClick = (type: 'base' | 'plus', count: number, totalCost: number) => {
    const available = allWeaponKeys.filter(k => {
        if (type === 'base') return !unlockedBase.includes(k);
        else return unlockedBase.includes(k) && !unlockedPlus.includes(k);
    });

    // 전체 선택 시 즉시 해금 (확인창 X)
    if (count === available.length) {
        performUnlock(type, available);
        return; 
    }

    setSelectingState({ type, count, totalCost, selected: [] });
  };

  const toggleWeaponSelection = (uwKey: string) => {
    if (!selectingState) return;
    const { selected, count, type } = selectingState;

    // 9번째(마지막) 버튼 클릭 -> 즉시 전체 자동 해금
    const lastWeaponKey = allWeaponKeys[allWeaponKeys.length - 1];
    if (uwKey === lastWeaponKey) {
        const available = allWeaponKeys.filter(k => {
            if (type === 'base') return !unlockedBase.includes(k);
            else return unlockedBase.includes(k) && !unlockedPlus.includes(k);
        });
        const autoSelected = available.slice(0, count);
        performUnlock(type, autoSelected);
        return;
    }

    let newSelected = [...selected];
    if (selected.includes(uwKey)) {
      newSelected = selected.filter(k => k !== uwKey);
    } else if (selected.length < count) {
      newSelected = [...selected, uwKey];
    }

    if (newSelected.length === count) {
        performUnlock(type, newSelected);
    } else {
        setSelectingState({ ...selectingState, selected: newSelected });
    }
  };

  const handleReset = (type: 'base' | 'plus') => {
    const updates: Record<string, any> = {};
    const targetList = type === 'base' ? unlockedBase : unlockedPlus;

    if (type === 'base') updates['unlocked_weapons'] = [];
    else updates['unlocked_plus_weapons'] = [];

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

  const handleModuleUpgrade = (moduleId: string) => {
    const key = `module_unlock_${moduleId}`;
    const currentLevel = progress[key] || 0;
    if (currentLevel >= 4) return;
    updateProgress(key, currentLevel + 1);
  };

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
        {/* 1. 기본 무기 해금 표 */}
        <UwCostTable 
          title="Ultimate Weapon Unlock"
          type="base"
          costs={unlockCosts.unlock_costs}
          unlockedCount={unlockedBase.length}
          onRowClick={handleRowClick}
          onReset={handleReset}
        />

        {/* 2. UW+ 해금 표 */}
        <UwCostTable 
          title="UW+ Unlock"
          type="plus"
          costs={unlockCosts.plus_unlock_costs}
          unlockedCount={unlockedPlus.length}
          onRowClick={handleRowClick}
          onReset={handleReset}
        />

        {/* 3. 모듈 슬롯 표 */}
        <ModuleUnlockTable 
          progress={progress}
          onUpgrade={handleModuleUpgrade}
          onReset={resetModules}
        />
      </div>

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