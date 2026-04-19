/**
 * 파일명: thetower/front/src/components/Detail/Combat/DefenseSection.tsx
 * 용도: 방어 관련 통계(피해 차단, 재생, 흡수 등) 및 생존 기술(죽음 저항 등) 표시
 * 특징: 3열 레이아웃, 아코디언 접기/펼치기 지원 (기본: 접힘)
 */
import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { HIDDEN_KEYS } from '../../../constants/reportRules';
import type { GameValue } from '../../../types/report';

interface Props {
  data: Record<string, GameValue | Record<string, GameValue> | undefined>;
  v2Sections?: string[];
  defaultOpen?: boolean;
}

export default function DefenseSection({ data, v2Sections, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail;

  // --- 1. 생존 및 특수 기술 필터링 ---
  const SURVIVAL_KEYS = [
    '죽음 저항', 'Death Defy',
    '에너지 보호막으로 흡수한 타격 수', 'Hits Absorbed By Energy Shield',
    '핵무기', 'Nuke',
    '세컨드 윈드', 'Second Wind',
    '데몬 모드', 'Demon Mode'
  ];

  const survivalItems: [string, GameValue][] = [];
  SURVIVAL_KEYS.forEach(key => {
    if (data[key] !== undefined && typeof data[key] !== 'object') {
      survivalItems.push([key, data[key] as GameValue]);
    }
  });

  // --- 2. 방어 데이터 병합 로직 ---
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

  const entries = Object.entries(displayData).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
    return true;
  });

  // --- 3. 섹션 분류 로직 ---
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

  const renderItem = ([key, value]: [string, GameValue], isSurvival = false) => {
    let displayLabel = key;
    if (key === '에너지 보호막으로 흡수한 타격 수') displayLabel = '에너지 보호막';
    if (key === 'Hits Absorbed By Energy Shield') displayLabel = 'Energy Shield';
    
    let labelColor = isSurvival ? "text-rose-400/80" : "text-slate-500";
    let valueColor = isSurvival ? "text-rose-200" : "text-slate-200";

    return (
      <div key={key} className="relative flex flex-col mb-5 last:mb-0 group">
        <div className="relative z-10 pl-1">
          <span className={`text-sm mb-1 ${labelColor} truncate block`} title={displayLabel}>{displayLabel}</span>
          <div className="flex items-end justify-between gap-2">
            <span className={`font-medium font-mono truncate ${valueColor} text-base`} title={String(value)}>{String(value)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 pt-10 border-t-2 border-slate-800">
      {/* 아코디언 헤더 버튼 */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full mb-8 flex items-center justify-between group/btn hover:bg-slate-800/30 p-4 -ml-4 rounded-xl transition-all"
      >
        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
          <Shield size={26} className="text-blue-500" />
          DEFENSE ANALYSIS
        </h2>
        <div className="bg-slate-800/50 p-1.5 rounded-lg text-slate-500 group-hover/btn:text-white transition-colors">
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>

      {/* 확장 영역 컨텐츠 */}
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-10 animate-fade-in-down">
          {/* 1열: 받은 대미지 & 재생 */}
          <div className="flex flex-col">
            {defenseTakenItems.length > 0 && (
              <div className="mb-5 text-xs font-bold text-blue-400/70 uppercase tracking-widest border-b border-slate-800 pb-1.5">{Text.HEADER_TAKEN}</div>
            )}
            {defenseTakenItems.map(item => renderItem(item))}
            
            {defenseRegenItems.length > 0 && (
              <div className="mt-10">
                <div className="mb-5 text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-1.5">{Text.SUB_REGEN}</div>
                {defenseRegenItems.map(item => renderItem(item))}
              </div>
            )}
          </div>

          {/* 2열: 차단 & 흡수 */}
          <div className="flex flex-col">
            {defenseAbsorbedItems.length > 0 && (
              <div className="mb-5 text-xs font-bold text-emerald-400/70 uppercase tracking-widest border-b border-slate-800 pb-1.5">{Text.HEADER_ABSORBED}</div>
            )}
            {defenseAbsorbedItems.map(item => renderItem(item))}
          </div>

          {/* 3열: 생존 & 특수 기술 */}
          <div className="flex flex-col">
            <div className="mb-5 text-xs font-bold text-rose-500/80 uppercase tracking-widest border-b border-slate-800 pb-1.5">Survival & Special</div>
            {survivalItems.length > 0 ? (
              survivalItems.map(item => renderItem(item, true))
            ) : (
              <div className="text-sm text-slate-600 italic">No survival events recorded</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
