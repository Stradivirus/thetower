import { useState } from 'react';
import { X, Check, MousePointerClick, Sword, Shield, Zap, Box, ArrowUpCircle } from 'lucide-react';
import unlockCosts from '../../data/uw_unlock_costs.json';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

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

  // 모듈 슬롯 정의
  const moduleSlots = [
    { id: 'attack', label: 'Attack', icon: Sword, color: 'text-rose-400' },
    { id: 'defense', label: 'Defense', icon: Shield, color: 'text-blue-400' },
    { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400' },
    { id: 'core', label: 'Core', icon: Box, color: 'text-purple-400' },
  ];

  // [New] 모듈 등급 및 비용 정의
  const moduleRarities = [
    { level: 0, label: 'Locked', color: 'text-slate-600', nextCost: 1000 },
    { level: 1, label: 'Epic', color: 'text-purple-400', nextCost: 1000 },
    { level: 2, label: 'Legendary', color: 'text-yellow-400', nextCost: 1200 },
    { level: 3, label: 'Mythic', color: 'text-red-400', nextCost: 1400 },
    { level: 4, label: 'Ancestral', color: 'text-green-400', nextCost: 0 },
  ];

  // --- 핸들러 ---

  const handleRowClick = (type: 'base' | 'plus', count: number, totalCost: number) => {
    setSelectingState({ type, count, totalCost, selected: [] });
  };

  const toggleWeaponSelection = (uwKey: string) => {
    if (!selectingState) return;
    const { selected, count } = selectingState;
    if (selected.includes(uwKey)) {
      setSelectingState({ ...selectingState, selected: selected.filter(k => k !== uwKey) });
    } else if (selected.length < count) {
      setSelectingState({ ...selectingState, selected: [...selected, uwKey] });
    }
  };

  const confirmUnlock = () => {
    if (!selectingState) return;
    const { type, selected } = selectingState;
    if (type === 'base') {
      updateProgress('unlocked_weapons', [...unlockedBase, ...selected]);
    } else {
      updateProgress('unlocked_plus_weapons', [...unlockedPlus, ...selected]);
    }
    setSelectingState(null);
  };

  const handleReset = (type: 'base' | 'plus') => {
    if (!window.confirm("해금 상태를 초기화하시겠습니까?")) return;
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

  // [New] 모듈 업그레이드 핸들러
  const handleModuleUpgrade = (moduleId: string) => {
    const key = `module_unlock_${moduleId}`;
    const currentLevel = progress[key] || 0;
    
    // 최대 레벨(4: Ancestral)이면 더 이상 증가 안 함
    if (currentLevel >= 4) return;

    updateProgress(key, currentLevel + 1);
  };

  // [New] 모듈 전체 리셋
  const resetModules = () => {
    if (!window.confirm("모듈 슬롯 해금 상태를 초기화하시겠습니까?")) return;
    const updates: Record<string, any> = {};
    moduleSlots.forEach(mod => {
      updates[`module_unlock_${mod.id}`] = 0;
    });
    updateBatch(updates);
  };

  // --- 렌더러 ---

  const renderTable = (title: string, data: number[], type: 'base' | 'plus') => {
    const currentList = type === 'base' ? unlockedBase : unlockedPlus;
    const currentLevel = currentList.length;
    const remainingData = data.map((cost, idx) => ({ cost, level: idx + 1 })).filter(item => item.level > currentLevel);
    const totalRemaining = remainingData.reduce((acc, cur) => acc + cur.cost, 0);

    return (
      <div className={styles.card}>
        <div className={styles.uwHeader}>
          <span>{title}</span>
          {currentLevel > 0 && <ResetButton onClick={(e) => { e.stopPropagation(); handleReset(type); }} />}
        </div>
        <table className="w-full text-xs text-left">
          <thead><tr><th className={styles.th}>Order</th><th className={styles.th}>Cost</th></tr></thead>
          <tbody>
            {remainingData.map((item, index) => {
              const batchItems = remainingData.slice(0, index + 1);
              const batchCost = batchItems.reduce((sum, i) => sum + i.cost, 0);
              const batchCount = batchItems.length;
              const isNext = index === 0;
              return (
                <tr key={item.level} onClick={() => handleRowClick(type, batchCount, batchCost)} className="transition-all border-b border-slate-800/50 hover:bg-blue-500/10 cursor-pointer group">
                  <td className={styles.td}>
                    {item.level}번째
                    {isNext ? <span className="ml-2 text-[10px] text-blue-400 font-bold animate-pulse">Next</span> : <span className="ml-2 text-[10px] text-slate-500 group-hover:text-blue-300 font-medium">(+{batchCount})</span>}
                  </td>
                  <td className={`${styles.td} ${isNext ? 'text-green-400 font-bold' : 'text-slate-500'}`}>{formatNum(item.cost)}</td>
                </tr>
              );
            })}
            {remainingData.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">All Unlocked! 🎉</td></tr>}
          </tbody>
          {remainingData.length > 0 && <tfoot><tr><td className={styles.tfootTd}>Remaining Total</td><td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalRemaining)}</td></tr></tfoot>}
        </table>
      </div>
    );
  };

  // 모듈의 남은 총 비용 계산
  const moduleTotalRemaining = moduleSlots.reduce((acc, mod) => {
    const currentLevel = progress[`module_unlock_${mod.id}`] || 0;
    // 현재 레벨 이후의 모든 비용 합산
    const remainingCost = moduleRarities.slice(currentLevel).reduce((sum, r) => sum + r.nextCost, 0);
    return acc + remainingCost;
  }, 0);

  // 모듈이 하나라도 해금되었는지 체크 (리셋 버튼 표시용)
  const isAnyModuleUnlocked = moduleSlots.some(mod => (progress[`module_unlock_${mod.id}`] || 0) > 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {renderTable("Ultimate Weapon Unlock", unlockCosts.unlock_costs, "base")}
        {renderTable("UW+ Unlock", unlockCosts.plus_unlock_costs, "plus")}

        {/* 3. Module Slot Unlock (Updated) */}
        <div className={styles.card + " h-fit"}>
          <div className={styles.uwHeader}>
            <span>Module Slots</span>
            {isAnyModuleUnlocked && <ResetButton onClick={(e) => { e.stopPropagation(); resetModules(); }} />}
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Next Cost</th>
              </tr>
            </thead>
            <tbody>
              {moduleSlots.map((mod) => {
                const key = `module_unlock_${mod.id}`;
                const currentLevel = progress[key] || 0; // 0 ~ 4
                const rarity = moduleRarities[currentLevel];
                const isMaxed = currentLevel >= 4;

                return (
                  <tr 
                    key={mod.id} 
                    onClick={() => handleModuleUpgrade(mod.id)}
                    className={`border-b border-slate-800/50 transition-colors ${!isMaxed ? 'cursor-pointer hover:bg-slate-800/30' : 'cursor-default'}`}
                    title={!isMaxed ? 'Click to Upgrade' : 'Max Level'}
                  >
                    {/* 모듈 이름 & 아이콘 */}
                    <td className={styles.td}>
                      <div className="flex items-center gap-2">
                        <mod.icon size={14} className={currentLevel > 0 ? mod.color : 'text-slate-500'} />
                        <span className={currentLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-500'}>{mod.label}</span>
                      </div>
                    </td>
                    
                    {/* 현재 등급 */}
                    <td className={styles.td}>
                      <span className={`font-bold ${rarity.color}`}>
                        {rarity.label}
                      </span>
                    </td>

                    {/* 업그레이드 비용 */}
                    <td className={styles.td}>
                      {isMaxed ? (
                        <span className="text-slate-600 font-mono">-</span>
                      ) : (
                        <div className="flex items-center gap-1 text-green-400 font-bold">
                          {formatNum(rarity.nextCost)}
                          <ArrowUpCircle size={10} className="opacity-50" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* 모듈 총 남은 비용 */}
            <tfoot>
              <tr>
                <td className={styles.tfootTd} colSpan={2}>Remaining Total</td>
                <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(moduleTotalRemaining)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 무기 선택 모달 (기존 유지) */}
      {selectingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MousePointerClick size={18} className="text-blue-400"/>
                  Select <span className="text-blue-400">{selectingState.count}</span> Weapons
                </h3>
                <p className="text-xs text-slate-400 mt-1">선택됨: <span className="text-white font-bold">{selectingState.selected.length}</span> / {selectingState.count}</p>
              </div>
              <button onClick={() => setSelectingState(null)} className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 mb-4 pr-1">
              {allWeaponKeys.map(uwKey => {
                const displayName = uwKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const isSelected = selectingState.selected.includes(uwKey);
                let isDisabled = false;
                if (selectingState.type === 'base') {
                  if (unlockedBase.includes(uwKey)) isDisabled = true;
                } else {
                  if (!unlockedBase.includes(uwKey)) isDisabled = true;
                  if (unlockedPlus.includes(uwKey)) isDisabled = true;
                }
                if (isDisabled) return null;
                return (
                  <button
                    key={uwKey}
                    onClick={() => toggleWeaponSelection(uwKey)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-bold border relative overflow-hidden ${isSelected ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-200'}`}
                  >
                    <span>{displayName}</span>
                    {isSelected && <Check size={16} className="text-blue-400" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={confirmUnlock}
              disabled={selectingState.selected.length !== selectingState.count}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${selectingState.selected.length === selectingState.count ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
            >
              {selectingState.selected.length === selectingState.count ? (
                <>Unlock for <span className="text-yellow-400">{formatNum(selectingState.totalCost)}</span> Stones</>
              ) : (
                <>{selectingState.count - selectingState.selected.length} more to select...</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}