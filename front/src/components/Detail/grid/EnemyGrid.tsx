/**
 * 파일명: thetower/front/src/components/Detail/grid/EnemyGrid.tsx
 * 용도: 적 통계(스폰, 처치, 엘리트 등) 및 적 타격 수 데이터를 그리드 형태로 표시
 */
import { useState } from 'react';
import { Skull, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format';
import { T } from '../../../locales';
import { HIDDEN_KEYS, ENEMY_LEFT_ORDER } from '../../../constants/reportRules';
import type { GameValue } from '../../../types/report';

interface EnemyGridProps {
  data: Record<string, GameValue | Record<string, GameValue> | undefined>;
  defaultOpen?: boolean;
}

// DefenseGrid로 이동된 생존/특수 기술 키 (중복 노출 방지)
const SURVIVAL_KEYS = [
  '죽음 저항', 'Death Defy',
  '에너지 보호막으로 흡수한 타격 수', 'Energy Shield',
  '핵무기', 'Nuke',
  '세컨드 윈드', 'Second Wind',
  '데몬 모드', 'Demon Mode'
];

// 타 섹션(CombatAnalysis 등)에서 표시 중인 처치 효과 키 (중복 노출 방지)
const EFFECT_KEYS = [
  '황금 타워', 'Golden Tower',
  '스포트라이트', 'Spotlight',
  '증폭 봇', 'Amplifier Bot',
  '황금 봇', 'Golden Bot',
  '사형 선고', 'Death Sentence'
];

export default function EnemyGrid({ data, defaultOpen = false }: EnemyGridProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Text = T.detail;

  // --- 데이터 병합 로직 ---
  let displayData: Record<string, GameValue> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && typeof v !== 'object') displayData[k] = v;
    else if (v !== undefined && typeof v === 'object') {
      Object.assign(displayData, v);
    }
  });

  /** 
   * 표시할 유효한 데이터 엔트리 필터링
   */
  const entries = Object.entries(displayData).filter(([key, value]) => {
    if (key.startsWith('_std_')) return false;
    if (HIDDEN_KEYS.includes(key)) return false;
    if (SURVIVAL_KEYS.includes(key)) return false; 
    if (EFFECT_KEYS.some(k => key.includes(k))) return false; // 처치 효과 항목 제외
    if (value === 0 || value === '0' || value === '0.00' || value === '$0') return false;
    return true;
  });

  // --- 1. 왼쪽 열: 주요 적 수치 ---
  const TARGET_LEFT_KEYS = [
    '적 합계', 'Total Enemies',
    '기본', 'Basic',
    '신속', 'Fast',
    '탱킹', 'Tank',
    '원거리', 'Ranged',
    '보스', 'Boss',
    '수호자', 'Guardian',
    '뱀파이어', 'Vampire',
    '광선', 'Ray',
    '스캐터', 'Scatter',
    '파괴 공작원', 'Saboteur', 'Saboteurs',
    '지휘관', 'Commander',
    '과전하', 'Overcharge'
  ];

  // --- 2. 오른쪽 열: 적 타격 수 ---
  const HITS_KEYS = [
    '투사체', '가시', '오브', '죽음의 광선', '연쇄 번개', '스마트 미사일', 
    '내부 지뢰', '유독성 늪', '죽음의 파동', '블랙홀', '크로노 필드', 
    '지뢰', '천둥 봇', '화염 봇', '공격 칩', '궤도 증강'
  ];

  let enemyLeftItems: [string, GameValue][] = [];
  let enemyHitsItems: [string, GameValue][] = [];
  let enemyMiscItems: [string, GameValue][] = [];

  entries.forEach(item => {
    const [key] = item;
    if (TARGET_LEFT_KEYS.includes(key) || ENEMY_LEFT_ORDER.includes(key)) {
      enemyLeftItems.push(item);
    } else if (HITS_KEYS.includes(key)) {
      enemyHitsItems.push(item);
    } else {
      enemyMiscItems.push(item);
    }
  });

  const sortByOrder = (orderList: string[]) => (a: [string, GameValue], b: [string, GameValue]) => {
    const idxA = orderList.indexOf(a[0]);
    const idxB = orderList.indexOf(b[0]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  };

  const sortByValueDesc = (a: [string, GameValue], b: [string, GameValue]) => 
    parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));

  enemyLeftItems.sort(sortByOrder([...TARGET_LEFT_KEYS, ...ENEMY_LEFT_ORDER]));
  
  // 요청 사항: 적 타격수 데이터는 내림차순 정렬
  enemyHitsItems.sort(sortByValueDesc);
  enemyMiscItems.sort(sortByValueDesc);

  const renderItem = ([key, value]: [string, GameValue]) => {
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

  if (entries.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md h-fit">
      {/* 아코디언 헤더 버튼 */}
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-left">
        <h3 className="text-lg font-bold flex items-center gap-2 text-orange-500">
          <Skull size={20} /> {Text.SECTION_ENEMY}
        </h3>
        {isOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 animate-fade-in-down">
          <div className="border-t border-slate-800 mb-4"></div>
          <div className="grid grid-cols-2 gap-x-8">
              {/* 왼쪽 열: 적 수치 */}
              <div className="flex flex-col">
                {enemyLeftItems.map(renderItem)}
              </div>

              {/* 오른쪽 열: 타격 수 */}
              <div className="flex flex-col">
                {/* 적 타격 수 섹션 */}
                {enemyHitsItems.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Enemy Hits</div>
                    <div className="flex flex-col">{enemyHitsItems.map(renderItem)}</div>
                  </div>
                )}

                {/* 기타 항목 (구분선 추가) */}
                {enemyMiscItems.length > 0 && (
                  <div className="mt-2 pt-6 border-t border-slate-800 border-dashed">
                    <div className="flex flex-col">{enemyMiscItems.map(renderItem)}</div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
