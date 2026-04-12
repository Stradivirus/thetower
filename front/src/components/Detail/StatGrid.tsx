/**
 * 파일명: thetower/front/src/components/Detail/StatGrid.tsx
 * 용도: 전투 리포트 상세 데이터(Utility, Enemy, Bot)를 그리드 형태로 표시
 * 기능: 섹션별 데이터 필터링(0 제외) 및 정렬, 중요 스탯(적 합계 등) 강조, 접기/펼치기 및 다국어 지원
 * 특징: V2 전용 시각화 (막대 차트) 지원
 */
import { useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../utils/format';
import { T } from '../../locales';
import type { GameValue } from '../../types/report';
import {
  HIDDEN_KEYS, ENEMY_LEFT_ORDER, ENEMY_RIGHT_ORDER, RESOURCE_ORDER
} from '../../constants/reportRules';

interface StatGridProps {
  data: Record<string, GameValue | Record<string, GameValue> | undefined>;
  icon: LucideIcon;                      // 타이틀 옆에 표시할 아이콘
  title: string;                         // 섹션 제목
  color: string;                         // 섹션 테마 색상
  defaultOpen?: boolean;                 // 기본 확장 여부
  v2Sections?: string[];                 // V2 다중 섹션 병합용
  order?: string[];                      // 커스텀 정렬 배열 (신규 섹션용)
  totalEnemies?: number;                 // 신규: 비율 계산용 전체 적 수
}

export default function StatGrid({ data, icon: Icon, title, color, defaultOpen = false, v2Sections, order, totalEnemies }: StatGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail; 

  // 섹션 타입 판별
  const isUtility = title === Text.SECTION_UTILITY;
  const isEnemy = title === Text.SECTION_ENEMY; 
  const isBot = title === Text.SECTION_BOT; 
  const isDefense = title === Text.HEADER_DEFENSE; 
  const isKillAnalysis = title === Text.DASH_KILL_BONUS; 
  const isDestroyedBy = title === "Destroyed By"; // V2 전용

  // --- V2 데이터 병합 로직 ---
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
      if (v !== undefined && typeof v !== 'object') displayData[k] = v;
    });
  }

  /** 
   * 표시할 유효한 데이터 엔트리 필터링
   * - 내부 필드(_std_), 숨김 설정 필드, 값이 0인 데이터는 제외
   */
  const entries = Object.entries(displayData).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
    return true;
  });

  // V2 신규 섹션들을 위한 커스텀 정렬
  if (order && !isUtility && !isEnemy && !isBot && !isDefense && !isKillAnalysis) {
    entries.sort((a, b) => {
        const idxA = order.indexOf(a[0]);
        const idxB = order.indexOf(b[0]);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
    });
  }

  // --- [A] 유틸리티 섹션 분류 ---
  let utilCoinItems: [string, GameValue][] = [];
  let utilMiscItems: [string, GameValue][] = [];

  if (isUtility) {
    const coinItems = entries.filter(([key]) => key.includes('코인') || key.toLowerCase().includes('coin'));
    coinItems.sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));
    const otherItems = entries.filter(([key]) => !key.includes('코인') && !key.toLowerCase().includes('coin'));
    utilCoinItems = coinItems;
    utilMiscItems = otherItems;
  }

  // --- [B] 적 통계 섹션 분류 ---
  let enemyLeftItems: [string, GameValue][] = [];
  let enemyRightItems: [string, GameValue][] = [];

  if (isEnemy) {
    // 처치 관련 키워드 (제외할 항목들)
    const killKeywords = ['황금 타워', '죽음의 파동', '스포트라이트', '증폭 봇', '황금 봇', '사형 선고', '파괴', 'Destroyed', 'Killed'];
    
    // 순수 등장/히트 관련 스탯만 필터링
    const spawnItems = entries.filter(([key]) => {
        const lower = key.toLowerCase();
        // 파괴 공작원(Saboteur)은 적 종류이므로 유지
        if (['파괴 공작원', 'Saboteur', 'Saboteurs'].includes(key)) return true;
        // 그 외 처치 관련 키워드가 포함된 항목은 제외
        return !killKeywords.some(k => key.includes(k) || lower.includes(k.toLowerCase()));
    });

    spawnItems.forEach(item => {
      if (ENEMY_LEFT_ORDER.includes(item[0])) enemyLeftItems.push(item);
      else enemyRightItems.push(item);
    });

    const sortFn = (orderList: string[]) => (a: [string, GameValue], b: [string, GameValue]) => {
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

  // --- [C] 봇 & 가디언 섹션 분류 ---
  let botLeftItems: [string, GameValue][] = [];
  let botRightItems: [string, GameValue][] = [];

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

  // --- [D] 방어 섹션 분류 ---
  let defenseTakenItems: [string, GameValue][] = [];
  let defenseRegenItems: [string, GameValue][] = [];
  let defenseAbsorbedItems: [string, GameValue][] = [];

  if (isDefense) {
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
        return Array.from(map.entries()) as [string, string | number][];
    };
    defenseTakenItems = uniqueItems(defenseTakenItems).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])));
    defenseRegenItems = uniqueItems(defenseRegenItems).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])));
    defenseAbsorbedItems = uniqueItems(defenseAbsorbedItems).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])));
  }

  // --- [E] 시각화 비율 계산 (V2 전용) ---
  const showBar = isDestroyedBy || isKillAnalysis;
  const totalValue = isDestroyedBy 
    ? entries.reduce((sum, [, val]) => sum + parseGameNumber(String(val)), 0)
    : isKillAnalysis ? (totalEnemies || 0) : 0;

  /** 
   * 개별 스탯 항목을 렌더링합니다. 
   */
  const renderItem = ([key, value]: [string, GameValue]) => {
    let labelColor = "text-slate-500";
    let valueColor = "text-slate-200";
    let valueSize = "text-sm";
    
    // 특수 강조 항목
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

    // 이름 간소화
    let displayLabel = key;
    if (isUtility) {
      displayLabel = displayLabel.replace('코인 업그레이드로 얻은 코인', '코인 업그레이드로 획득');
      displayLabel = displayLabel.replace('획득한 코인', '획득');
    }

    // 시각화 비율
    const percentage = totalValue > 0 ? (parseGameNumber(String(value)) / totalValue) * 100 : 0;
    const barColor = isDestroyedBy ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30";
    const percentColor = isDestroyedBy ? "text-rose-500/60" : "text-emerald-500/60";

    return (
      <div key={key} className="relative flex flex-col mb-4 last:mb-0 group">
        {showBar && percentage > 0 && (
          <div 
            className={`absolute inset-y-0 left-0 ${barColor} border-l-2 rounded-r transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        )}
        <div className="relative z-10 pl-1">
          <span className={`text-xs mb-0.5 ${labelColor} truncate block`} title={displayLabel}>{displayLabel}</span>
          <div className="flex items-end justify-between gap-2">
            <span className={`font-medium font-mono truncate ${valueColor} ${valueSize}`} title={String(value)}>{String(value)}</span>
            {showBar && percentage > 0 && (
              <span className={`text-[10px] font-bold font-mono ${percentColor}`}>{percentage.toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (entries.length === 0) return null;

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
          
          {/* 1. 유틸리티 레이아웃 */}
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
          /* 2. 적 통계 레이아웃 (순수 스폰/정보만 표시) */
          isEnemy ? (
            <div className="grid grid-cols-2 gap-x-8">
                <div className="flex flex-col">{enemyLeftItems.map(renderItem)}</div>
                <div className="flex flex-col">{enemyRightItems.map(renderItem)}</div>
            </div>
          ) : 
          /* 3. 봇 레이아웃 */
          isBot ? (
            <div className="grid grid-cols-2 gap-x-8">
               <div className="flex flex-col">{botLeftItems.map(renderItem)}</div>
               <div className="flex flex-col">{botRightItems.map(renderItem)}</div>
            </div>
          ) : 
          /* 4. 방어 레이아웃 */
          isDefense ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col">
                <div className="flex flex-col">
                    {defenseTakenItems.length > 0 && <div className="mb-3 text-xs font-bold text-blue-400/70 uppercase tracking-wider border-b border-slate-800 pb-1">{Text.HEADER_TAKEN}</div>}
                    {defenseTakenItems.map(renderItem)}
                </div>
                {defenseRegenItems.length > 0 && (
                    <div className="mt-6">
                        <div className="border-t border-slate-800 border-dashed my-2 relative">
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
          ) : 
          /* 5. 기본 그리드 레이아웃 (시각화 지원 포함) */
          (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-4 gap-x-2">
              {showBar ? (
                <div className="col-span-2 space-y-1">{entries.sort((a,b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]))).map(renderItem)}</div>
              ) : (
                entries.map(renderItem)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
