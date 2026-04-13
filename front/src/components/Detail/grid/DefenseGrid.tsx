/**
 * 파일명: thetower/front/src/components/Detail/grid/DefenseGrid.tsx
 * 용도: 방어 관련 데이터(받은 대미지, 체력 재생, 대미지 차단 등)를 통합하여 표시
 */
import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { HIDDEN_KEYS } from '../../../constants/reportRules';
import type { GameValue } from '../../../types/report';

interface DefenseGridProps {
  data: Record<string, any> | undefined;
}

export default function DefenseGrid({ data }: DefenseGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Text = T.detail;

  // 데이터 필터링 및 병합 로직
  const getDefenseEntries = () => {
    if (!data) return [];
    
    // V2 방어 관련 섹션 병합
    const targetSections = ['damage_taken', 'bonus_hp', 'hp_regen', 'damage_block'];
    const combined: Record<string, GameValue> = {};
    
    targetSections.forEach(sec => {
      const section = data[sec];
      if (section && typeof section === 'object') {
        Object.assign(combined, section);
      }
    });

    return Object.entries(combined).filter(([key, value]) => {
      if (key.startsWith('_std_')) return false;
      if (HIDDEN_KEYS.includes(key)) return false;
      if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
      return true;
    });
  };

  const entries = getDefenseEntries();

  // 분류 로직
  const isAbsorbed = (key: string, val: GameValue) => {
    const damageBlock = data?.['damage_block'];
    if (damageBlock && typeof damageBlock === 'object' && damageBlock[key] === val) return true;
    const keywords = ['차단', 'Block', '방어 %', 'Defense %', '절대 방어', '필드', '천둥', '붕괴', '프로젝터'];
    return keywords.some(k => key.includes(k));
  };

  const isRegen = (key: string) => {
    const keywords = ['재생', '흡수', '체력', 'Regen', 'Lifesteal', 'Health', 'Bonus', '로부터'];
    if (['타워', '장벽', 'Tower', 'Wall'].includes(key)) return false;
    return keywords.some(k => key.includes(k));
  };

  let defenseTakenItems: [string, GameValue][] = [];
  let defenseRegenItems: [string, GameValue][] = [];
  let defenseAbsorbedItems: [string, GameValue][] = [];

  entries.forEach(item => {
    if (isAbsorbed(item[0], item[1])) defenseAbsorbedItems.push(item);
    else if (isRegen(item[0])) defenseRegenItems.push(item);
    else defenseTakenItems.push(item);
  });

  const sortFn = (a: [string, GameValue], b: [string, GameValue]) => 
    parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));

  defenseTakenItems.sort(sortFn);
  defenseRegenItems.sort(sortFn);
  defenseAbsorbedItems.sort(sortFn);

  const renderItem = ([key, value]: [string, GameValue]) => (
    <div key={key} className="relative flex flex-col mb-4 last:mb-0 group">
      <div className="relative z-10 pl-1">
        <span className="text-xs mb-0.5 text-slate-500 truncate block" title={key}>{key}</span>
        <div className="flex items-end justify-between gap-2">
          <span className="font-medium font-mono truncate text-slate-200 text-sm" title={String(value)}>{String(value)}</span>
        </div>
      </div>
    </div>
  );

  if (entries.length === 0) return null;

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
            {/* 왼쪽: 받은 대미지 & 재생 */}
            <div className="flex flex-col">
              <div>
                {defenseTakenItems.length > 0 && (
                  <div className="mb-3 text-xs font-bold text-blue-400/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.HEADER_TAKEN}</div>
                )}
                {defenseTakenItems.map(renderItem)}
              </div>
              
              {defenseRegenItems.length > 0 && (
                <div className="mt-6">
                  <div className="border-t border-slate-800 border-dashed my-4 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                      {Text.SUB_REGEN}
                    </span>
                  </div>
                  <div className="flex flex-col">{defenseRegenItems.map(renderItem)}</div>
                </div>
              )}
            </div>

            {/* 오른쪽: 대미지 차단 */}
            <div className="flex flex-col">
              {defenseAbsorbedItems.length > 0 && (
                <div className="mb-3 text-xs font-bold text-emerald-400/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.HEADER_ABSORBED}</div>
              )}
              {defenseAbsorbedItems.map(renderItem)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
