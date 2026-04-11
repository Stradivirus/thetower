/**
 * 파일명: thetower/front/src/components/Detail/V1/StatGridV1.tsx
 * 용도: V1 전투 리포트 상세 데이터를 그리드 형태로 표시
 */
import { useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales'; 
import { 
  HIDDEN_KEYS, ENEMY_LEFT_ORDER, ENEMY_RIGHT_ORDER, RESOURCE_ORDER 
} from '../../../constants/reportRules'; 

interface StatGridProps {
  data: Record<string, any>;
  icon: LucideIcon;
  title: string;
  color: string;
  defaultOpen?: boolean;
}

export default function StatGridV1({ data, icon: Icon, title, color, defaultOpen = false }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail; 

  const isUtility = title === Text.SECTION_UTILITY;
  const isEnemy = title === Text.SECTION_ENEMY; 
  const isBot = title === Text.SECTION_BOT; 

  const entries = Object.entries(data).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (value === 0 || value === '0' || value === '0.00') return false;
    return true;
  });

  // --- [A] 유틸리티 섹션 ---
  let utilCoinItems: [string, string | number][] = [];
  let utilMiscItems: [string, string | number][] = [];

  if (isUtility) {
    const coinItems = entries.filter(([key]) => key.includes('코인') || key.toLowerCase().includes('coin'));
    coinItems.sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));
    const otherItems = entries.filter(([key]) => !key.includes('코인') && !key.toLowerCase().includes('coin'));
    utilCoinItems = coinItems;
    utilMiscItems = otherItems;
  }

  // --- [B] 적 통계 섹션 ---
  let enemyLeftItems: [string, string | number][] = [];
  let enemyRightItems: [string, string | number][] = [];
  let enemyKillItems: [string, string | number][] = [];

  if (isEnemy) {
    enemyKillItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        return key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed');
    });
    const spawnItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        return !(key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed'));
    });

    spawnItems.forEach(item => {
      if (ENEMY_LEFT_ORDER.includes(item[0])) enemyLeftItems.push(item);
      else enemyRightItems.push(item);
    });

    const sortFn = (orderList: string[]) => (a: [string, any], b: [string, any]) => {
      const idxA = orderList.indexOf(a[0]);
      const idxB = orderList.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    };

    enemyLeftItems.sort(sortFn(ENEMY_LEFT_ORDER));
    enemyRightItems.sort(sortFn(ENEMY_RIGHT_ORDER));
  }

  // --- [C] 봇 & 가디언 섹션 ---
  let botLeftItems: [string, string | number][] = [];
  let botRightItems: [string, string | number][] = [];

  if (isBot) {
    const isRightSide = (key: string) => {
        if (RESOURCE_ORDER.includes(key)) return false;
        return true;
    };
    entries.forEach(item => {
      if (isRightSide(item[0])) botRightItems.push(item);
      else botLeftItems.push(item);
    });
    botLeftItems.sort((a, b) => {
        const idxA = RESOURCE_ORDER.indexOf(a[0]);
        const idxB = RESOURCE_ORDER.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });
  }

  const renderItem = ([key, value]: [string, string | number]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";
    
    if (['적 합계', 'Total Enemies', '총 엘리트', 'Total Elites'].includes(key)) {
        labelColor = "text-orange-400 font-bold";
        valueColor = "text-white font-bold";
        valueSize = "text-base";
    }

    let displayLabel = key;
    if (isUtility) {
      displayLabel = displayLabel.replace('코인 업그레이드로 얻은 코인', '코인 업그레이드로 획득');
    }

    return (
      <div key={key} className="flex flex-col mb-4 last:mb-0">
        <span className={`text-xs mb-0.5 ${labelColor} truncate`} title={displayLabel}>{displayLabel}</span>
        <span className={`font-medium font-mono truncate ${valueColor} ${valueSize}`}>{String(value)}</span>
      </div>
    );
  };

  if (entries.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}><Icon size={20} /> {title}</h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          {isUtility ? (
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex flex-col">{utilCoinItems.map(renderItem)}</div>
              <div className="flex flex-col">{utilMiscItems.map(renderItem)}</div>
            </div>
          ) : isEnemy ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex flex-col">{enemyLeftItems.map(renderItem)}</div>
                <div className="flex flex-col">{enemyRightItems.map(renderItem)}</div>
              </div>
              {enemyKillItems.length > 0 && (
                <div className="grid grid-cols-2 gap-x-8 border-t border-slate-800 pt-4">
                  {enemyKillItems.map(renderItem)}
                </div>
              )}
            </div>
          ) : isBot ? (
            <div className="grid grid-cols-2 gap-x-8">
               <div className="flex flex-col">{botLeftItems.map(renderItem)}</div>
               <div className="flex flex-col">{botRightItems.map(renderItem)}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">{entries.map(renderItem)}</div>
          )}
        </div>
      )}
    </div>
  );
}
