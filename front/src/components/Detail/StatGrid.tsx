/**
 * 파일명: thetower/front/src/components/Detail/StatGrid.tsx
 * 용도: 전투 리포트 상세 데이터(Utility, Enemy, Bot)를 그리드 형태로 표시
 * 기능: 섹션별 데이터 필터링(0 제외) 및 정렬, 중요 스탯(적 합계 등) 강조, 접기/펼치기 및 다국어 지원
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../utils/format';
import { T } from '../../locales'; 
import { 
  HIDDEN_KEYS, ENEMY_LEFT_ORDER, ENEMY_RIGHT_ORDER, RESOURCE_ORDER 
} from '../../constants/reportRules'; 

interface StatGridProps {
  data: Record<string, string | number>; // 섹션별 스탯 데이터 객체
  icon: any;                             // 타이틀 옆에 표시할 아이콘
  title: string;                         // 섹션 제목
  color: string;                         // 섹션 테마 색상
  defaultOpen?: boolean;                 // 기본 확장 여부
}

export default function StatGrid({ data, icon: Icon, title, color, defaultOpen = false }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail; 

  // 섹션 타입 판별
  const isUtility = title === Text.SECTION_UTILITY;
  const isEnemy = title === Text.SECTION_ENEMY; 
  const isBot = title === Text.SECTION_BOT; 

  /** 
   * 표시할 유효한 데이터 엔트리 필터링
   * - 내부 필드(_std_), 숨김 설정 필드, 값이 0인 데이터는 제외
   */
  const entries = Object.entries(data).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (value === 0 || value === '0' || value === '0.00') return false;
    return true;
  });

  // --- [A] 유틸리티 섹션: 코인 관련 항목과 기타 항목으로 분류 ---
  let utilCoinItems: [string, string | number][] = [];
  let utilMiscItems: [string, string | number][] = [];

  if (isUtility) {
    const coinItems = entries.filter(([key]) => key.includes('코인') || key.toLowerCase().includes('coin'));
    coinItems.sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));
    const otherItems = entries.filter(([key]) => !key.includes('코인') && !key.toLowerCase().includes('coin'));
    utilCoinItems = coinItems;
    utilMiscItems = otherItems;
  }

  // --- [B] 적 통계 섹션: 스폰 정보(좌/우)와 처치 정보(Kill)로 분류 ---
  let enemyLeftItems: [string, string | number][] = [];
  let enemyRightItems: [string, string | number][] = [];
  let enemyKillItems: [string, string | number][] = [];

  if (isEnemy) {
    // 처치 관련 스탯 분리
    enemyKillItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        const isKillStat = key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed');
        if (['파괴 공작원', 'Saboteur', 'Saboteurs'].includes(key)) return false;
        return isKillStat;
    });
    // 스폰/등장 관련 스탯 분리
    const spawnItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        const isKillStat = key.includes('파괴') || lower.includes('destroyed') || lower.includes('killed');
        if (['파괴 공작원', 'Saboteur', 'Saboteurs'].includes(key)) return true;
        return !isKillStat;
    });

    // 사전에 정의된 순서에 따라 좌측/우측 배치
    spawnItems.forEach(item => {
      if (ENEMY_LEFT_ORDER.includes(item[0])) enemyLeftItems.push(item);
      else enemyRightItems.push(item);
    });

    /** 지정된 리스트 순서에 맞춰 정렬하는 함수 */
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

  // --- [C] 봇 & 가디언 섹션: 자원 정보와 봇 효과 정보로 분류 ---
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

  /** 
   * 개별 스탯 항목을 렌더링합니다. 
   * - 중요도에 따른 색상 및 폰트 크기 조정
   */
  const renderItem = ([key, value]: [string, string | number]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";
    
    // 특수 강조 항목 (총합 정보 등)
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

    // 이름 간소화 (UI 가독성 향상)
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
      {/* 아코디언 헤더 버튼 */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}><Icon size={20} /> {title}</h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {/* 확장 영역 컨텐츠 */}
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          
          {/* 1. 유틸리티 레이아웃 (코인 vs 기타) */}
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
          ) : 
          /* 2. 적 통계 레이아웃 (스폰 vs 처치) */
          isEnemy ? (
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
          ) : 
          /* 3. 봇 레이아웃 */
          isBot ? (
            <div className="grid grid-cols-2 gap-x-8">
               <div className="flex flex-col">{botLeftItems.map(renderItem)}</div>
               <div className="flex flex-col">{botRightItems.map(renderItem)}</div>
            </div>
          ) : 
          /* 4. 기본 그리드 레이아웃 */
          (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-4 gap-x-2">{entries.map(renderItem)}</div>
          )}
        </div>
      )}
    </div>
  );
}