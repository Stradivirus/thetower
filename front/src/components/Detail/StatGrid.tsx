import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../utils/format';

interface StatGridProps {
  data: Record<string, string | number>;
  icon: any;
  title: string;
  color: string;
  defaultOpen?: boolean;
}

export default function StatGrid({ data, icon: Icon, title, color, defaultOpen = false }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isUtility = title === '유틸리티';
  const isEnemy = title === '적 통계'; 
  const isBot = title === '봇 & 가디언'; 

  // 1. 데이터 필터링 (0값 및 특정 키 제외)
  const entries = Object.entries(data).filter(([key, value]) => {
    if (key === '황금 타워로 획득한 캐시') return false;
    // 0값 숨기기 로직
    if (value === 0 || value === '0' || value === '0.00') return false;
    return true;
  });

  // --- [A] 유틸리티 섹션 로직 ---
  let utilCoinItems: [string, string | number][] = [];
  let utilMiscItems: [string, string | number][] = [];

  if (isUtility) {
    const coinItems = entries.filter(([key]) => key.includes('코인'));
    coinItems.sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));
    const otherItems = entries.filter(([key]) => !key.includes('코인'));

    utilCoinItems = coinItems;
    utilMiscItems = otherItems;
  }

  // --- [B] 적 통계 섹션 로직 ---
  let enemyLeftItems: [string, string | number][] = [];
  let enemyRightItems: [string, string | number][] = [];
  let enemyKillItems: [string, string | number][] = [];

  if (isEnemy) {
    // [수정] '파괴' 단어가 포함되어 있어도 '파괴 공작원'은 처치 통계가 아니므로 제외
    enemyKillItems = entries.filter(([key]) => key.includes('파괴') && key !== '파괴 공작원');
    
    // [수정] 반대로 일반 유닛 목록에는 '파괴 공작원'을 포함시킴
    const spawnItems = entries.filter(([key]) => !key.includes('파괴') || key === '파괴 공작원');

    const leftOrder = ['적 합계', '기본', '신속', '원거리', '탱킹', '수호자', '보스'];
    const rightOrder = ['총 엘리트', '광선', '스캐터', '뱀파이어', '과전하', '파괴 공작원', '지휘관'];

    spawnItems.forEach(item => {
      const [key] = item;
      if (leftOrder.includes(key)) enemyLeftItems.push(item);
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

    enemyLeftItems.sort(sortFn(leftOrder));
    enemyRightItems.sort(sortFn(rightOrder));
  }

  // --- [C] 봇 & 가디언 섹션 로직 ---
  let botLeftItems: [string, string | number][] = [];
  let botRightItems: [string, string | number][] = [];

  if (isBot) {
    // 오른쪽으로 보낼 파편들 (순서 고정용 리스트)
    const shards = ['대표 파편', '대포 파편', '갑옷 파편', '발전기 파편', '코어 파편'];
    
    // 왼쪽으로 보낼 주요 자원들 (순서 지정)
    const resources = ['보석', '메달', '공통 모듈', '희귀 모듈', '코어 샤드', '샤드 재롤'];

    entries.forEach(item => {
      const [key] = item;
      // 파편이거나 이름에 '봇'이 포함되면 오른쪽으로 보냄
      if (shards.includes(key) || key.includes('파편') || key.includes('봇')) {
        botRightItems.push(item);
      } else {
        // 나머지는 왼쪽에 배치 (자원, 모듈, 가디언 등)
        botLeftItems.push(item);
      }
    });

    // 왼쪽 아이템 정렬: resources 목록에 있는 것을 위로
    botLeftItems.sort((a, b) => {
        const idxA = resources.indexOf(a[0]);
        const idxB = resources.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });
    
    // 오른쪽 아이템 정렬: 파편을 위로, 봇을 아래로 (선택 사항)
    botRightItems.sort((a, b) => {
        const isShardA = a[0].includes('파편');
        const isShardB = b[0].includes('파편');
        if (isShardA && !isShardB) return -1;
        if (!isShardA && isShardB) return 1;
        return 0;
    });
  }

  // --- 렌더링 헬퍼 ---
  const renderItem = ([key, value]: [string, string | number]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";

    if (key === '적 합계' || key === '총 엘리트') {
        labelColor = key === '적 합계' ? "text-orange-400 font-bold" : "text-purple-400 font-bold";
        valueColor = key === '적 합계' ? "text-orange-300 font-bold" : "text-purple-300 font-bold";
        valueSize = "text-base";
    }

    let displayLabel = key;
    if (isUtility) {
      if (displayLabel === '코인 업그레이드로 얻은 코인') displayLabel = '코인 업그레이드로 획득';
      else displayLabel = displayLabel.replace('획득한 코인', '획득');
    }

    return (
      <div key={key} className="flex flex-col mb-4 last:mb-0">
        <span className={`text-xs mb-0.5 ${labelColor}`}>{displayLabel}</span>
        <span className={`font-medium font-mono truncate ${valueColor} ${valueSize}`} title={String(value)}>
          {String(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left"
      >
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}>
          <Icon size={20} /> {title}
        </h3>
        {isOpen ? (
          <ChevronUp size={20} className="text-slate-500" />
        ) : (
          <ChevronDown size={20} className="text-slate-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          
          {isUtility ? (
            // Case 1: 유틸리티
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col">
                {utilCoinItems.length > 0 && (
                    <div className="mb-3 text-xs font-bold text-yellow-500/70 uppercase tracking-wider border-b border-slate-800 pb-1">
                        Coin Utility
                    </div>
                )}
                {utilCoinItems.map(renderItem)}
              </div>
              <div className="flex flex-col">
                 {utilMiscItems.length > 0 && (
                    <div className="mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-800 pb-1">
                        Misc
                    </div>
                )}
                {utilMiscItems.map(renderItem)}
              </div>
            </div>
          ) : isEnemy ? (
            // Case 2: 적 통계
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex flex-col">{enemyLeftItems.map(renderItem)}</div>
                <div className="flex flex-col">{enemyRightItems.map(renderItem)}</div>
              </div>
              {enemyKillItems.length > 0 && (
                <div>
                  <div className="border-t border-slate-800 border-dashed my-2 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                      Kill Methods
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 mt-4">
                    {enemyKillItems.map((item, idx) => (
                       <div key={item[0]} className={`${idx % 2 === 0 ? 'pr-2' : 'pl-2'}`}>
                          {renderItem(item)}
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isBot ? (
            // Case 3: 봇 & 가디언 (좌우 분할)
            <div className="grid grid-cols-2 gap-x-8">
               {/* 왼쪽: 자원, 모듈, 기타 */}
               <div className="flex flex-col">
                  {botLeftItems.map(renderItem)}
               </div>
               {/* 오른쪽: 파편, 봇 관련 */}
               <div className="flex flex-col">
                  {botRightItems.map(renderItem)}
               </div>
            </div>
          ) : (
            // Case 4: 그 외 (fallback)
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-4 gap-x-2">
              {entries.map(renderItem)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}