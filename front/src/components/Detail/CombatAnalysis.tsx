import { useState } from 'react';
import { Sword, ShieldAlert, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { parseGameNumber } from '../../utils/format'; 

interface Props {
  combatJson: Record<string, any>;
}

// [New] 순위별 색상 팔레트 정의 (상위 5위까지)
const RANK_COLORS = [
  { text: 'text-rose-400', bg: 'bg-rose-500' },      // 1위: Rose
  { text: 'text-orange-400', bg: 'bg-orange-500' },   // 2위: Orange
  { text: 'text-amber-400', bg: 'bg-amber-500' },     // 3위: Amber (Yellow-ish)
  { text: 'text-lime-400', bg: 'bg-lime-500' },       // 4위: Lime (Green-ish)
  { text: 'text-cyan-400', bg: 'bg-cyan-500' },       // 5위: Cyan (Blue-ish)
];
// 6위 이후 기본 색상
const DEFAULT_COLOR = { text: 'text-slate-400', bg: 'bg-slate-500' };

export default function CombatAnalysis({ combatJson }: Props) {
  const [showMinors, setShowMinors] = useState(false);

  const combatEntries = Object.entries(combatJson);
  
  // 0. 총 딜량 파싱
  const totalDamageStr = combatJson['입힌 대미지'] || '0';
  const totalDamageVal = parseGameNumber(String(totalDamageStr));

  // 1. 방어(수비) 데이터
  const incomingKeys = ['받은 대미지', '장벽이 받은 대미지', '죽음 저항', '생명력 흡수'];
  const incomingStats = combatEntries
    .filter(([key]) => incomingKeys.includes(key))
    .sort((a, b) => incomingKeys.indexOf(a[0]) - incomingKeys.indexOf(b[0]));

  // 2. 공격 데이터 전체 (입힌 대미지 제외, 내림차순 정렬)
  const allAttackStats = combatEntries
    .filter(([key]) => {
      const isDamage = key.includes('대미지') || key === '전자 손상';
      const isBerserk = key.includes('광전사'); 
      return isDamage && !isBerserk && !incomingKeys.includes(key) && key !== '입힌 대미지';
    })
    .sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));

  // [Logic] 1% 기준으로 그룹 분리
  const majorStats: [string, any, number][] = [];
  const minorStats: [string, any][] = [];

  allAttackStats.forEach(([key, value]) => {
    const valNum = parseGameNumber(String(value));
    const percentage = totalDamageVal > 0 ? (valNum / totalDamageVal) * 100 : 0;
    
    if (percentage >= 1.0) {
      majorStats.push([key, value, percentage]);
    } else {
      minorStats.push([key, value]);
    }
  });

  // 3. 기타 데이터
  const miscStats = combatEntries.filter(([key]) => {
    const isDamage = key.includes('대미지') || key === '전자 손상';
    const isBerserk = key.includes('광전사');
    return (!isDamage || isBerserk) && !incomingKeys.includes(key) && key !== '입힌 대미지';
  });

  const StatRow = ({ items }: { items: [string, any][] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-4 gap-x-4">
      {items.map(([key, value]) => (
        <div key={key} className="bg-slate-950/30 p-2 rounded border border-slate-800/50">
          <div className="text-[11px] text-slate-500 mb-0.5 truncate">{key}</div>
          <div className="text-slate-200 font-medium font-mono text-xs truncate" title={String(value)}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      {/* === Header: Total Damage === */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> 전투 통계
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">Total Damage</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {/* === 1. Major Stats (>= 1%) : Colored Bar Chart === */}
      {majorStats.length > 0 ? (
        <div className="mb-6 space-y-3">
          {majorStats.map(([key, value, percentage], idx) => {
            const displayPercent = percentage.toFixed(1);
            // 순위에 따른 색상 선택 (없으면 기본 색상)
            const colorSet = RANK_COLORS[idx] || DEFAULT_COLOR;

            return (
              <div key={key} className="group">
                <div className="flex justify-between items-end mb-1 text-xs">
                  <div className="flex items-center gap-2">
                    {/* 순위 번호 (상위 3위는 금색) */}
                    <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>{idx + 1}</span>
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      {key}
                      {percentage >= 50 && <Zap size={12} className="text-yellow-500 animate-pulse" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{String(value)}</span>
                    {/* 퍼센트 텍스트 색상 적용 */}
                    <span className={`font-bold w-12 text-right ${colorSet.text}`}>
                      {displayPercent}%
                    </span>
                  </div>
                </div>
                {/* Progress Bar: 배경색 적용 및 호버 시 밝기 증가 */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg} group-hover:brightness-110`}
                    style={{ width: `${Math.min(percentage, 100)}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-4 text-sm">주요 딜러 데이터 없음</div>
      )}

      {/* === 2. Minor Stats (< 1%) : Accordion === */}
      {minorStats.length > 0 && (
        <div className="mb-6">
           <button 
             onClick={() => setShowMinors(!showMinors)}
             className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4"
           >
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>기타 딜러 ({minorStats.length}개 항목 - 1% 미만)</span>
           </button>
           
           {showMinors && (
             <div className="animate-fade-in pl-2">
                <StatRow items={minorStats} />
             </div>
           )}
        </div>
      )}

      {/* ... (방어 및 기타 통계는 기존과 동일) ... */}
      {/* === 3. Defense Stats === */}
      {incomingStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-400">
            <ShieldAlert size={16} /> 방어 (피격)
          </h4>
          <StatRow items={incomingStats} />
        </>
      )}

      {/* === 4. Misc Stats === */}
      {miscStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}
    </div>
  );
}