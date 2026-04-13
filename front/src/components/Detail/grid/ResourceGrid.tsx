/**
 * 파일명: thetower/front/src/components/Detail/grid/ResourceGrid.tsx
 * 용도: 코인 및 각종 화폐(셀, 파편 등) 획득 현황을 통합하여 표시
 */
import { useState } from 'react';
import { Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { V2_CURRENCY_KEYS, HIDDEN_KEYS } from '../../../constants/reportRules';
import type { GameValue } from '../../../types/report';

interface ResourceGridProps {
  coinData: Record<string, GameValue> | undefined;
  currencyData: Record<string, GameValue> | undefined;
}

export default function ResourceGrid({ coinData, currencyData }: ResourceGridProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Text = T.detail;

  // 데이터 필터링 함수
  const filterEntries = (data: Record<string, GameValue> | undefined) => {
    if (!data) return [];
    return Object.entries(data).filter(([key, value]) => {
      if (key.startsWith('_std_')) return false;
      if (HIDDEN_KEYS.includes(key)) return false;
      if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
      return true;
    });
  };

  // 1. 코인 데이터 분류 및 정렬
  const coinKeywords = [
    '코인', 'Coin', '황금 타워', 'Golden Tower', '블랙홀', 'Black Hole', 
    '스포트라이트', 'Spotlight', '황금 봇', 'Golden Bot', '죽음의 파동', 'Death Wave',
    '웨이브 건너뛰기', 'Wave Skip', '골든 콤보', 'Golden Combo', '현상금', 'Bounty'
  ];

  // 모든 데이터를 합친 후 분류
  const allData = { ...(coinData || {}), ...(currencyData || {}) };
  const allEntries = filterEntries(allData);

  const resCoinItems = allEntries.filter(item => coinKeywords.some(k => item[0].includes(k)));
  const resCurrencyItems = allEntries.filter(item => !coinKeywords.some(k => item[0].includes(k)));

  // 코인은 금액순 정렬
  resCoinItems.sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])));
  
  /** 
   * 화폐 섹션 그룹화 및 정렬
   */
  const gemItems = resCurrencyItems.filter(([key]) => key.includes('보석') || key.toLowerCase().includes('gem'));
  
  const coreKeywords = ['셀', 'Cells', '다시 뽑기', 'Reroll'];
  const coreItems = resCurrencyItems.filter(([key]) => 
    !gemItems.some(gem => gem[0] === key) && coreKeywords.some(k => key.includes(k))
  );
  
  const otherItems = resCurrencyItems.filter(([key]) => 
    !gemItems.some(gem => gem[0] === key) && !coreItems.some(core => core[0] === key)
  );

  const sortFn = (arr: [string, GameValue][]) => {
    return arr.sort((a, b) => {
      const idxA = V2_CURRENCY_KEYS.indexOf(a[0]);
      const idxB = V2_CURRENCY_KEYS.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  };

  const sortedGemItems = sortFn(gemItems);
  const sortedCoreItems = sortFn(coreItems);
  const sortedOtherItems = sortFn(otherItems);

  const renderItem = ([key, value]: [string, GameValue]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";
    
    if (['코인 획득', 'Coins Earned', 'Coins earned'].includes(key)) {
        labelColor = "text-yellow-500 font-bold";
        valueColor = "text-yellow-400 font-bold";
        valueSize = "text-base";
    }

    return (
      <div key={key} className="relative flex flex-col mb-4 last:mb-0 group">
        <div className="relative z-10 pl-1">
          <span className={`text-xs mb-0.5 ${labelColor} truncate block`} title={key}>{key}</span>
          <div className="flex items-end justify-between gap-2">
            <span className={`font-medium font-mono truncate ${valueColor} ${valueSize}`} title={String(value)}>{String(value)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (allEntries.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-500">
          <Coins size={20} /> {Text.SECTION_COIN} & {Text.SECTION_CURRENCY}
        </h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col">
              {resCoinItems.length > 0 && <div className="mb-3 text-xs font-bold text-yellow-500/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.SECTION_COIN}</div>}
              {resCoinItems.map(renderItem)}
            </div>
            <div className="flex flex-col">
               {resCurrencyItems.length > 0 && <div className="mb-3 text-xs font-bold text-emerald-500/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.SECTION_CURRENCY}</div>}
               
               {/* 1. 보석 그룹 */}
               {sortedGemItems.map(renderItem)}

               {/* 구분선 1 (보석과 핵심 자원 사이) */}
               {sortedGemItems.length > 0 && (sortedCoreItems.length > 0 || sortedOtherItems.length > 0) && (
                 <div className="border-t border-slate-800 border-dashed my-4" />
               )}

               {/* 2. 핵심 자원 그룹 (셀, 다시뽑기 파편) */}
               {sortedCoreItems.map(renderItem)}

               {/* 구분선 2 (핵심 자원과 기타 사이) */}
               {sortedCoreItems.length > 0 && sortedOtherItems.length > 0 && (
                 <div className="border-t border-slate-800 border-dashed my-4" />
               )}

               {/* 3. 기타 그룹 */}
               {sortedOtherItems.map(renderItem)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
