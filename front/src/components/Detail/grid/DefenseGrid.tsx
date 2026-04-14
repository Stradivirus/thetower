/**
 * 파일명: thetower/front/src/components/Detail/grid/DefenseGrid.tsx
 * 용도: 방어 관련 통계(피해 차단, 재생, 흡수 등) 및 생존 기술(죽음 저항 등) 표시
 */
import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { HIDDEN_KEYS } from '../../../constants/reportRules';
import type { GameValue } from '../../../types/report';

interface DefenseGridProps {
  data: Record<string, GameValue | Record<string, GameValue> | undefined>;
  v2Sections?: string[];
  defaultOpen?: boolean;
}

export default function DefenseGrid({ data, v2Sections, defaultOpen = false }: DefenseGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail;

  // --- 1. 생존 및 특수 기술 필터링 (data의 루트에서 직접 추출) ---
  const SURVIVAL_KEYS = [
    '죽음 저항', 'Death Defy',
    '에너지 보호막으로 흡수한 타격 수', 'Energy Shield',
    '핵무기', 'Nuke',
    '세컨드 윈드', 'Second Wind',
    '데몬 모드', 'Demon Mode'
  ];

  const survivalItems: Record<string, GameValue> = {};
  SURVIVAL_KEYS.forEach(key => {
    // data 루트에 있거나, v2_detail?.stats_json?.stats에 있는 경우를 모두 대응
    if (data[key] !== undefined && typeof data[key] !== 'object') {
      survivalItems[key] = data[key] as GameValue;
    }
  });

  // --- 2. V2 방어 데이터 병합 로직 ---
  let displayData: Record<string, GameValue> = {};
  if (v2Sections) {
    v2Sections.forEach(sec => {
      const section = data[sec];
      if (section && typeof section === 'object') {
        Object.assign(displayData, section);
      }
    });
  } else {
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && typeof v !== 'object' && !SURVIVAL_KEYS.includes(k)) {
        displayData[k] = v;
      }
    });
  }

  /** 
   * 표시할 유효한 데이터 엔트리 필터링
   */
  const entries = Object.entries(displayData).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
    return true;
  });

  // --- 방어 섹션 분류 로직 ---
  let defenseTakenItems: [string, GameValue][] = [];
  let defenseRegenItems: [string, GameValue][] = [];
  let defenseAbsorbedItems: [string, GameValue][] = [];

  const isAbsorbed = (key: string, val: GameValue) => {
    const damageBlock = data['damage_block'];
    if (v2Sections && damageBlock && typeof damageBlock === 'object' && (damageBlock as Record<string, GameValue>)[key] === val) return true;
    const keywords = ['차단', 'Block', '방어 %', 'Defense %', '절대 방어', '필드', '천둥', '붕괴', '프로젝터'];
    return keywords.some(k => key.includes(k));
  };

  const isRegen = (key: string) => {
    const keywords = ['재생', '흡수', '체력', 'Regen', 'Lifesteal', 'Health', 'Bonus', '로부터'];
    if (['타워', '장벽', 'Tower', 'Wall'].includes(key)) return false;
    return keywords.some(k => key.includes(k));
  };

  entries.forEach(item => {
    if (isAbsorbed(item[0], item[1])) defenseAbsorbedItems.push(item);
    else if (isRegen(item[0])) defenseRegenItems.push(item);
    else defenseTakenItems.push(item);
  });

  const uniqueItems = (arr: [string, GameValue][]) => {
    const map = new Map();
    arr.forEach(item => map.set(item[0], item[1]));
    return Array.from(map.entries()) as [string, GameValue][];
  };

  const sortByValue = (a: [string, GameValue], b: [string, GameValue]) => 
    parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));

  defenseTakenItems = uniqueItems(defenseTakenItems).sort(sortByValue);
  defenseRegenItems = uniqueItems(defenseRegenItems).sort(sortByValue);
  defenseAbsorbedItems = uniqueItems(defenseAbsorbedItems).sort(sortByValue);

  const renderItem = ([key, value]: [string, GameValue]) => {
    let displayLabel = key;
    if (key === '에너지 보호막으로 흡수한 타격 수') displayLabel = '에너지 보호막';
    
    return (
      <div key={key} className="relative flex flex-col mb-4 last:mb-0 group">
        <div className="relative z-10 pl-1">
          <span className="text-xs mb-0.5 text-slate-500 truncate block" title={displayLabel}>{displayLabel}</span>
          <div className="flex items-end justify-between gap-2">
            <span className="font-medium font-mono truncate text-slate-200 text-sm" title={String(value)}>{String(value)}</span>
          </div>
        </div>
      </div>
    );
  };

  // 생존 기술 아이템 렌더링 (2열 배치용)
  const renderSurvivalPair = (leftKey: string, rightKey: string) => {
    const leftVal = survivalItems[leftKey];
    const rightVal = survivalItems[rightKey];
    
    if (leftVal === undefined && rightVal === undefined) return null;

    return (
      <div className="grid grid-cols-2 gap-x-8 mb-4 last:mb-0">
        <div>{leftVal !== undefined && renderItem([leftKey, leftVal])}</div>
        <div>{rightVal !== undefined && renderItem([rightKey, rightVal])}</div>
      </div>
    );
  };

  const hasSurvival = Object.keys(survivalItems).length > 0;

  if (entries.length === 0 && !hasSurvival) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
          <Shield size={20} /> {Text.HEADER_DEFENSE}
        </h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col">
              <div className="flex flex-col">
                  {defenseTakenItems.length > 0 && <div className="mb-3 text-xs font-bold text-blue-400/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.HEADER_TAKEN}</div>}
                  {defenseTakenItems.map(renderItem)}
              </div>
              {defenseRegenItems.length > 0 && (
                  <div className="mt-6">
                      <div className="border-t border-slate-800 border-dashed my-4 relative">
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">{Text.SUB_REGEN}</span>
                      </div>
                      <div className="mt-4 flex flex-col">{defenseRegenItems.map(renderItem)}</div>
                  </div>
              )}
            </div>
            <div className="flex flex-col">
               {defenseAbsorbedItems.length > 0 && <div className="mb-3 text-xs font-bold text-emerald-400/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.HEADER_ABSORBED}</div>}
              {defenseAbsorbedItems.map(renderItem)}
            </div>
          </div>

          {/* 생존 및 특수 기술 섹션 (하단 배치 및 구분선) */}
          {hasSurvival && (
            <div className="mt-8 pt-6 border-t border-slate-800 border-dashed">
               <div className="mb-4 text-xs font-bold text-rose-400/70 uppercase tracking-wider">Survival & Special</div>
               {renderSurvivalPair('죽음 저항', '세컨드 윈드')}
               {renderSurvivalPair('에너지 보호막으로 흡수한 타격 수', '데몬 모드')}
               {survivalItems['핵무기'] !== undefined && (
                 <div className="grid grid-cols-2 gap-x-8">
                   <div></div>
                   <div>{renderItem(['핵무기', survivalItems['핵무기']])}</div>
                 </div>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
