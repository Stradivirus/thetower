import { useState } from 'react';
import { Sword, Shield, Zap, Box, Disc, Star, Lock } from 'lucide-react';
import moduleCosts from '../../data/module_costs.json';
import { stoneStyles as styles, formatNum, ResetButton } from './StoneShared';

interface Props {
  progress: Record<string, any>;
  updateProgress: (key: string, level: number) => void;
}

export default function ModuleTab({ progress, updateProgress }: Props) {
  // 선택 상태 관리
  const [selectedType, setSelectedType] = useState<'attack' | 'defense' | 'generator' | 'core'>('attack');
  const [selectedStat, setSelectedStat] = useState<'main' | 'sub'>('main');

  // 모듈 종류 정의
  const moduleTypes = [
    { id: 'attack', label: 'Attack', icon: Sword, color: 'text-rose-400', border: 'border-rose-500/50' },
    { id: 'defense', label: 'Defense', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/50' },
    { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400', border: 'border-yellow-500/50' },
    { id: 'core', label: 'Core', icon: Box, color: 'text-purple-400', border: 'border-purple-500/50' },
  ] as const;

  // 스탯 종류 정의
  const statTypes = [
    { id: 'main', label: 'Main Stat', icon: Star },
    { id: 'sub', label: 'Sub Stat', icon: Disc },
  ] as const;

  // [New] 현재 선택된 모듈의 해금 여부 확인
  // UnlockTab에서 저장한 키: module_unlock_{id} (1이면 해금, 0이면 잠김)
  const isUnlocked = progress[`module_unlock_${selectedType}`] === 1;

  // 현재 선택된 키 생성 (예: module_attack_main)
  const currentKey = `module_${selectedType}_${selectedStat}`;
  const currentLevel = progress[currentKey] || 0;

  // 데이터 필터링
  const remainingLevels = moduleCosts.common_efficiency.levels
    .map((lv, idx) => ({ ...lv, displayLevel: idx === 0 ? 'Base' : idx }))
    .filter(lv => lv.level > currentLevel);

  const totalCost = remainingLevels.reduce((acc, cur) => acc + cur.cost, 0);

  // 현재 선택된 타입의 정보 가져오기 (스타일링용)
  const activeTypeInfo = moduleTypes.find(t => t.id === selectedType)!;

  return (
    <div className="flex flex-col items-center animate-fade-in w-full">
      
      {/* 1. 모듈 종류 선택 (4개) */}
      <div className="flex flex-wrap justify-center gap-3 mb-4 w-full max-w-3xl">
        {moduleTypes.map((type) => {
          // 각 버튼별 잠김 상태 확인
          const typeUnlocked = progress[`module_unlock_${type.id}`] === 1;
          
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl border transition-all flex-1 min-w-[140px] justify-center relative overflow-hidden
                ${selectedType === type.id 
                  ? `bg-slate-800 ${type.border} ring-1 ring-offset-0 ring-offset-transparent ${type.color.replace('text-', 'ring-')}` 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                }
                ${!typeUnlocked && selectedType !== type.id ? 'opacity-50' : ''}
              `}
            >
              {/* 잠김 아이콘 오버레이 (선택 안 된 잠긴 버튼일 때) */}
              {!typeUnlocked && (
                <div className="absolute top-1 right-1.5">
                  <Lock size={12} className="text-slate-600" />
                </div>
              )}

              <type.icon size={18} className={selectedType === type.id ? type.color : 'text-slate-500'} />
              <span className={`font-bold text-sm ${selectedType === type.id ? 'text-white' : ''}`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. 스탯 종류 선택 (2개) - 잠겨있으면 숨기거나 비활성화 */}
      {isUnlocked && (
        <div className="flex justify-center bg-slate-900/50 p-1 rounded-xl border border-slate-800 mb-8 animate-fade-in">
          {statTypes.map((stat) => (
            <button
              key={stat.id}
              onClick={() => setSelectedStat(stat.id)}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                ${selectedStat === stat.id 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              <stat.icon size={14} />
              {stat.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. 테이블 or 잠김 메시지 */}
      <div className={`w-full max-w-2xl ${styles.card} border-t-4 ${isUnlocked ? activeTypeInfo.border.replace('/50', '') : 'border-slate-700'} transition-colors duration-300`}>
        
        {/* 테이블 헤더 */}
        <div className={`${styles.uwHeader} ${!isUnlocked ? 'bg-slate-900/50' : ''}`}>
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <>
                <activeTypeInfo.icon size={16} className={activeTypeInfo.color} />
                <span className="capitalize">{activeTypeInfo.label} Module</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300 capitalize">{selectedStat} Efficiency</span>
              </>
            ) : (
              <>
                <Lock size={16} className="text-slate-500" />
                <span className="text-slate-400 font-bold">{activeTypeInfo.label} Module Locked</span>
              </>
            )}
          </div>
          
          {isUnlocked && currentLevel > 0 && (
            <ResetButton onClick={(e) => { e.stopPropagation(); updateProgress(currentKey, 0); }} />
          )}
        </div>

        {/* 컨텐츠 영역 */}
        {isUnlocked ? (
          <div className={styles.tableContainer}>
            <table className="w-full text-xs text-left">
              <thead>
                <tr>
                  <th className={styles.th}>Level</th>
                  <th className={styles.th}>Value</th>
                  <th className={styles.th}>Cost</th>
                  <th className={styles.th}>Cumul.</th>
                </tr>
              </thead>
              <tbody>
                {remainingLevels.map((lv, idx) => {
                   const cumulative = remainingLevels.slice(0, idx + 1).reduce((a, b) => a + b.cost, 0);
                   return (
                    <tr 
                      key={lv.level} 
                      className={styles.tr} 
                      onClick={() => updateProgress(currentKey, lv.level)}
                    >
                      <td className={styles.td}>
                        {lv.displayLevel === 'Base' ? <span className="text-slate-500 font-bold">Base</span> : lv.displayLevel}
                      </td>
                      <td className={`${styles.td} text-cyan-400`}>{lv.value}%</td>
                      <td className={`${styles.td} text-yellow-400`}>{lv.cost > 0 ? formatNum(lv.cost) : '-'}</td>
                      <td className={`${styles.td} text-slate-500`}>{cumulative > 0 ? formatNum(cumulative) : '-'}</td>
                    </tr>
                   );
                })}
                {remainingLevels.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Maximum Level Reached! 🎉
                  </td></tr>
                )}
              </tbody>
              {remainingLevels.length > 0 && (
                <tfoot>
                  <tr>
                    <td className={styles.tfootTd} colSpan={2}>Total Left</td>
                    <td className={`${styles.tfootTd} text-yellow-400`}>{formatNum(totalCost)}</td>
                    <td className={styles.tfootTd}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          // 잠김 상태 표시
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-full">
              <Lock size={32} className="text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-400 mb-1">Slot Locked</p>
              <p className="text-xs">Unlock this module slot in the <span className="text-blue-400 font-bold">Unlock Tab</span> first.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}