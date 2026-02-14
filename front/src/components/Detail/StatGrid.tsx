import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../utils/format';
import { T } from '../../locales'; // [New]
import { 
  HIDDEN_KEYS, ENEMY_LEFT_ORDER, ENEMY_RIGHT_ORDER, RESOURCE_ORDER 
} from '../../constants/reportRules'; // [New]

interface StatGridProps {
  data: Record<string, string | number>;
  icon: any;
  title: string;
  color: string;
  defaultOpen?: boolean;
}

export default function StatGrid({ data, icon: Icon, title, color, defaultOpen = false }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail; // 언어팩

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
        const isKillStat = key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed');
        if (['파괴 공작원', 'Saboteur', 'Saboteurs'].includes(key)) return false;
        return isKillStat;
    });
    const spawnItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        const isKillStat = key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed');
        if (['파괴 공작원', 'Saboteur', 'Saboteurs'].includes(key)) return true;
        return !isKillStat;
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
        if (key.includes('파편') || key.includes('Shard')) return true;
        if (key.includes('봇') || key.includes('Bot')) return true;
        return false;
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
    botRightItems.sort((a, b) => {
        const isShardA = a[0].includes('파편') || a[0].includes('Shard');
        const isShardB = b[0].includes('파편') || b[0].includes('Shard');
        if (isShardA && !isShardB) return -1;
        if (!isShardA && isShardB) return 1;
        return 0;
    });
  }

  const renderItem = ([key, value]: [string, string | number]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";
    if (['적 합계', 'Total Enemies'].includes(key)) {
        labelColor = "text-orange-400 font-bold";
        valueColor = "text-orange-300 font-bold";
        valueSize = "text-base";
    }
    else if (['총 엘리트', 'Total Elites'].includes(key)) {
        labelColor = "text-purple-400 font-bold";
        valueColor = "text-purple-300 font-bold";
        valueSize = "text-base";
    }

    let displayLabel = key;
    if (isUtility) {
      displayLabel = displayLabel.replace('코인 업그레이드로 얻은 코인', '코인 업그레이드로 획득');
      displayLabel = displayLabel.replace('획득한 코인', '획득');
    }

    return (
      <div key={key} className="flex flex-col mb-4 last:mb-0">
        <span className={`text-xs mb-0.5 ${labelColor} truncate`} title={displayLabel}>{displayLabel}</span>
        <span className={`font-medium font-mono truncate ${valueColor} ${valueSize}`} title={String(value)}>{String(value)}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}><Icon size={20} /> {title}</h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          {isUtility ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col">
                {utilCoinItems.length > 0 && <div className="mb-3 text-xs font-bold text-yellow-500/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.SUB_COIN}</div>}
                {utilCoinItems.map(renderItem)}
              </div>
              <div className="flex flex-col">
                 {utilMiscItems.length > 0 && <div className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.SUB_MISC}</div>}
                {utilMiscItems.map(renderItem)}
              </div>
            </div>
          ) : isEnemy ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex flex-col">{enemyLeftItems.map(renderItem)}</div>
                <div className="flex flex-col">{enemyRightItems.map(renderItem)}</div>
              </div>
              {enemyKillItems.length > 0 && (
                <div>
                  <div className="border-t border-slate-800 border-dashed my-2 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">{Text.SUB_KILL}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 mt-4">
                    {enemyKillItems.map((item, idx) => <div key={item[0]} className={`${idx % 2 === 0 ? 'pr-2' : 'pl-2'}`}>{renderItem(item)}</div>)}
                  </div>
                </div>
              )}
            </div>
          ) : isBot ? (
            <div className="grid grid-cols-2 gap-x-8">
               <div className="flex flex-col">{botLeftItems.map(renderItem)}</div>
               <div className="flex flex-col">{botRightItems.map(renderItem)}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-4 gap-x-2">{entries.map(renderItem)}</div>
          )}
        </div>
      )}
    </div>
  );
}