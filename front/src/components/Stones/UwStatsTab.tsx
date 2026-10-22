/**
 * 파일명: thetower/front/src/components/Stones/UwStatsTab.tsx
 * 용도: 스톤 계산기 페이지의 'Base Stats' 및 'UW+ Stats' 탭 컨텐츠
 * 기능: 해금된 무기별 스탯 정보 리스트업, 레벨별 비용 및 누적 비용 계산, 연구(Lab) 효과 토글 기능
 */
import { useEffect, useMemo } from 'react';
import baseStats from '../../data/uw_base_stats.json';
import plusStats from '../../data/uw_plus_stats.json';
import labConfig from '../../data/uw_lab_config.json'; 
import { formatNum } from './StoneShared';
import { Lock } from 'lucide-react'; 
import { T } from '../../locales';
import { calculateUwStones } from '../../utils/stoneCalculations';
import { LabCard, UwStatCard } from './UwStatCard';

interface Props {
  category: 'base' | 'plus';
  progress: Record<string, any>; 
  updateProgress: (key: string, level: number) => void;
  selectedUw: string;
  onSelectUw: (uw: string) => void;
}

export default function UwStatsTab({ category, progress, updateProgress, selectedUw, onSelectUw }: Props) {
  const statsData = category === 'base' ? baseStats : plusStats;

  const unlockedList: string[] = category === 'base' 
    ? (progress['unlocked_weapons'] || []) 
    : (progress['unlocked_plus_weapons'] || []);

  // 현재 해금된 무기들만 필터링
  const availableUwKeys = Object.keys(statsData).filter(key => unlockedList.includes(key));

  /** [정렬] 선택된 무기를 목록의 최상단으로 올립니다. */
  const sortedUwKeys = useMemo(() => {
    if (!selectedUw) return availableUwKeys;
    const filtered = availableUwKeys.filter(key => key !== selectedUw);
    return [selectedUw, ...filtered];
  }, [availableUwKeys, selectedUw]);
  
  const labStats = (labConfig as any)[selectedUw]; 

  // 유효하지 않은 무기가 선택되어 있으면 첫 번째 무기로 자동 전환
  useEffect(() => {
    if (availableUwKeys.length > 0 && !availableUwKeys.includes(selectedUw)) {
      onSelectUw(availableUwKeys[0]);
    }
  }, [availableUwKeys, selectedUw, onSelectUw]);

  /** 무기 키를 번역된 표시 이름으로 변환합니다. */
  const getUwDisplayName = (uwKey: string) => {
    const localizedName = (T.data as any)?.UW_NAMES?.[uwKey];
    if (localizedName) return localizedName;
    return uwKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const allWeaponKeys = Object.keys(baseStats);
  const unlockedBase: string[] = progress['unlocked_weapons'] || [];
  const isAllBaseUnlocked = unlockedBase.length === allWeaponKeys.length;

  if (category === 'plus' && !isAllBaseUnlocked) {
    return (
      <div className="text-center py-20 text-slate-500 animate-fade-in flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
          <Lock size={22} className="text-slate-500" />
        </div>
        <p className="text-lg font-bold mb-2 text-slate-300">
          Requires all Ultimate Weapons unlocked
        </p>
        <p className="text-sm text-slate-500 mb-2">
          You must unlock all 9 Ultimate Weapons before accessing UW+ Stats.
        </p>
        <span className="text-xs text-slate-600 font-mono bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
          {unlockedBase.length}/{allWeaponKeys.length} Unlocked
        </span>
      </div>
    );
  }

  if (availableUwKeys.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 animate-fade-in">
        <p className="text-lg font-bold mb-2">
          {category === 'base' ? 'No Ultimate Weapons unlocked.' : 'No weapons with UW+ unlocked.'}
        </p>
        <p className="text-sm">Please unlock weapons in the Unlock tab first.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* 1. 상단 무기 선택 탭 버튼 영역 (Sticky) */}
      <div className="mb-6 pb-2 scrollbar-hide sticky top-16 bg-slate-950/95 z-10 pt-2">
        {/* 모바일: 줄바꿈 적용 */}
        <div className="md:hidden flex flex-wrap gap-2">
          {availableUwKeys.map((uwKey) => {
            const uwStones = calculateUwStones(progress, uwKey, category);
            return (
              <button
                key={uwKey}
                onClick={() => onSelectUw(uwKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center min-w-[70px] ${
                  selectedUw === uwKey 
                    ? 'bg-slate-800 text-white border-green-500 shadow-sm ring-1 ring-green-500/30' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <span className="whitespace-nowrap">{getUwDisplayName(uwKey)}</span>
                <span className={`text-sm font-mono font-bold leading-tight mt-0.5 ${
                  selectedUw === uwKey ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {formatNum(uwStones)}
                </span>
              </button>
            );
          })}
        </div>
        {/* 데스크톱: 스크롤 적용 */}
        <div className="hidden md:flex gap-2 overflow-x-auto">
          {availableUwKeys.map((uwKey) => {
            const uwStones = calculateUwStones(progress, uwKey, category);
            return (
              <button
                key={uwKey}
                onClick={() => onSelectUw(uwKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex flex-col items-center justify-center min-w-[76px] ${
                  selectedUw === uwKey 
                    ? 'bg-slate-800 text-white border-green-500 shadow-sm ring-1 ring-green-500/30' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <span className="whitespace-nowrap">{getUwDisplayName(uwKey)}</span>
                <span className={`text-sm font-mono font-bold leading-tight mt-0.5 ${
                  selectedUw === uwKey ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {formatNum(uwStones)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 연구실(Lab) 옵션 영역 (Base Stats 카테고리 전용) */}
      {category === 'base' && labStats && (
        <div className={`mb-8 animate-fade-in ${
          selectedUw === 'golden_tower' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
            : selectedUw === 'chrono_field'
            ? 'flex justify-center' 
            : 'grid grid-cols-1 gap-6' 
        }`}>
          {Object.entries(labStats).map(([labKey, labInfo]) => (
            <div 
              key={labKey} 
              className={selectedUw === 'chrono_field' ? 'max-w-md w-full' : ''} 
            >
              <LabCard 
                labKey={`${selectedUw}_${labKey}`} 
                labInfo={labInfo}
                progress={progress}
                updateProgress={updateProgress}
              />
            </div>
          ))}
        </div>
      )}

      {/* 3. 스탯별 비용 테이블 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedUwKeys.map((uwKey) => {
          const uwDetail = (statsData as any)[uwKey];
          const isSelected = uwKey === selectedUw;
          const uwDisplayName = getUwDisplayName(uwKey);

          return Object.entries(uwDetail).map(([statName, detail]: [string, any]) => (
            <UwStatCard
              key={`${uwKey}-${statName}`}
              category={category}
              uwKey={uwKey}
              uwDisplayName={uwDisplayName}
              statName={statName}
              detail={detail}
              isSelected={isSelected}
              progress={progress}
              updateProgress={updateProgress}
            />
          ));
        })}
      </div>
    </div>
  );
}
