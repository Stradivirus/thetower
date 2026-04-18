/**
 * 파일명: thetower/front/src/components/Detail/grid/UtilityGrid.tsx
 * 용도: 전투 리포트 상세 데이터(Utility, Records)를 통합하여 표시
 * 특징: 2열 레이아웃, 0값 필터링, 무료 업그레이드 정렬 순서 적용, 디자인 완전 통일
 */
import { useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp, Trophy, Activity } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import type { GameValue } from '../../../types/report';
import { HIDDEN_KEYS } from '../../../constants/reportRules';

interface UtilityGridProps {
  data: Record<string, GameValue | Record<string, GameValue> | undefined>;
  icon: LucideIcon;
  title: string;
  color: string;
  defaultOpen?: boolean;
}

export default function UtilityGrid({ data, icon: Icon, title, color, defaultOpen = false }: UtilityGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail;

  // --- 유효성 체크 함수 (0값 필터링) ---
  const isValidValue = (value: any) => {
    if (value === undefined || value === null) return false;
    const strVal = String(value);
    // 0, 0.00, $0, 비어있는 문자열 등 제외
    return strVal !== '0' && strVal !== '0.00' && strVal !== '$0' && strVal !== '' && strVal !== '0%';
  };

  // --- 1. 데이터 분류: Records (0값 제외) ---
  const rawRecords = data._records as Record<string, string> || {};
  const recordsEntries = Object.entries(rawRecords).filter(([, v]) => isValidValue(v));
  
  // --- 2. 데이터 분류: Utility ---
  let utilityData: Record<string, GameValue> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (k === '_records') return;
    if (v !== undefined && typeof v !== 'object') utilityData[k] = v;
    else if (v && typeof v === 'object') Object.assign(utilityData, v);
  });

  const utilityEntries = Object.entries(utilityData).filter(([key, value]) => {
    if (key.startsWith('_std_') || HIDDEN_KEYS.includes(key)) return false;
    return isValidValue(value);
  });

  // 코인 항목 정렬 (금액 내림차순)
  const coinItems = utilityEntries.filter(([key]) => key.includes('코인') || key.toLowerCase().includes('coin'));
  const sortedCoinItems = [...coinItems].sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])));

  // 기타 항목 정렬 (무료 업그레이드 순서 우선 적용)
  const FREE_UPGRADE_ORDER = [
    '무료 공격 업그레이드', 'Free Attack Upgrade',
    '무료 방어 업그레이드', 'Free Defense Upgrade',
    '무료 유틸리티 업그레이드', 'Free Utility Upgrade'
  ];

  const miscItems = utilityEntries.filter(([key]) => !key.includes('코인') && !key.toLowerCase().includes('coin'));
  const sortedMiscItems = [...miscItems].sort((a, b) => {
    const idxA = FREE_UPGRADE_ORDER.findIndex(orderKey => a[0].includes(orderKey));
    const idxB = FREE_UPGRADE_ORDER.findIndex(orderKey => b[0].includes(orderKey));
    
    // 둘 다 무료 업그레이드 항목인 경우 지정된 순서대로
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // 하나만 무료 업그레이드인 경우 우선순위 높임
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    
    // 그 외에는 값 내림차순
    return parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));
  });

  /**
   * 공통 아이템 렌더러 (디자인 완전 통일)
   */
  const renderItem = ([key, value]: [string, GameValue]) => {
    const isSpecial = ['코인 획득', 'Coins Earned', 'Coins earned'].includes(key);
    
    let displayLabel = key;
    // 텍스트 축약 (유틸리티 섹션만)
    displayLabel = displayLabel.replace('코인 업그레이드로 얻은 코인', '코인 업그레이드로 획득');
    displayLabel = displayLabel.replace('획득한 코인', '획득');

    // 모든 라벨 색상 slate-400으로 통일 (500보다 조금 더 밝음)
    // 모든 값 색상 slate-200으로 통일
    let labelColor = "text-slate-400";
    let valueColor = "text-slate-200";

    // 특수 강조 항목만 색상 부여
    if (isSpecial) {
        labelColor = "text-yellow-500 font-bold";
        valueColor = "text-yellow-400 font-bold";
    }

    return (
      <div key={key} className="relative flex flex-col mb-4 last:mb-0 group">
        <div className="relative z-10 pl-1">
          <span className={`text-xs mb-0.5 truncate block ${labelColor}`}>
            {displayLabel}
          </span>
          <div className="flex items-end justify-between gap-2">
            <span className={`font-medium font-mono truncate ${valueColor} text-sm`}>
              {String(value)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (recordsEntries.length === 0 && utilityEntries.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md h-fit">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${color}`}><Icon size={20} /> {title}</h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-6"></div>
          
          <div className="grid grid-cols-2 gap-x-10">
            {/* 왼쪽 열: RECORDS */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-1.5 border-b border-slate-800">
                <Trophy size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest">BATTLE RECORDS</span>
              </div>
              <div className="flex flex-col">
                {recordsEntries.map(item => renderItem(item))}
              </div>
            </div>

            {/* 오른쪽 열: UTILITY & COINS */}
            <div className="flex flex-col">
              {/* 코인 지표 */}
              {sortedCoinItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 pb-1.5 border-b border-slate-800">
                    <Activity size={14} className="text-yellow-500" />
                    <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest">{Text.SUB_COIN}</span>
                  </div>
                  {sortedCoinItems.map(item => renderItem(item))}
                </div>
              )}

              {/* 기타 유틸리티 (무료 업그레이드 순서 적용) */}
              {sortedMiscItems.length > 0 && (
                <div className={sortedCoinItems.length > 0 ? "mt-2 pt-6 border-t border-slate-800 border-dashed" : ""}>
                   <div className="flex items-center gap-2 mb-4 pb-1.5 border-b border-slate-800">
                    <Activity size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{Text.SUB_MISC}</span>
                  </div>
                  {sortedMiscItems.map(renderItem)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
