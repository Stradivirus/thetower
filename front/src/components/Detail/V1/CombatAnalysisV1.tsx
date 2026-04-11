/**
 * 파일명: thetower/front/src/components/Detail/V1/CombatAnalysisV1.tsx
 * 용도: V1 전투 리포트 상세 페이지에서 대미지 및 전투 데이터를 분석하여 시각화
 */
import { useState } from 'react';
import { Sword, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { parseGameNumber } from '../../../utils/format'; 
import { T } from '../../../locales'; 
import { 
  DEFENSE_KEYS, ATTACK_SPECIFIC_KEYS, RANK_COLORS, DEFAULT_RANK_COLOR 
} from '../../../constants/reportRules'; 

interface Props {
  combatJson?: Record<string, any>;   // V1 전투 섹션 원본 JSON 데이터
}

export default function CombatAnalysisV1({ combatJson }: Props) {
  const [showMinors, setShowMinors] = useState(false);
  const Text = T.detail;

  if (!combatJson) return null;

  const combatEntries = Object.entries(combatJson).filter(([key]) => !key.startsWith('_std_'));
  const stdTotal = combatJson['_std_damage_dealt'];
  const totalDamageStr = String(stdTotal || combatJson['입힌 대미지'] || combatJson['Damage dealt'] || '0');
  const totalDamageVal = parseGameNumber(totalDamageStr);

  /** [헬퍼] 0인 값 필터링 로직 */
  const isNotEmpty = (val: any) => {
    if (val === 0 || val === '0' || val === '0.00') return false;
    return true;
  };

  /** [헬퍼] 수치 기준 내림차순 정렬 함수 */
  const sortByValueDesc = (a: [string, any], b: [string, any]) => {
    return parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));
  };

  /** 1. 방어 관련 스탯 분류 및 내림차순 정렬 */
  const takenStats = combatEntries
    .filter(([key, val]) => (DEFENSE_KEYS.includes(key) && !key.includes('차단') && !key.includes('Block') && !key.includes('방어 %') && !key.includes('Defense %')) && isNotEmpty(val))
    .sort(sortByValueDesc);

  const absorbedStats = combatEntries
    .filter(([key, val]) => (DEFENSE_KEYS.includes(key) && (key.includes('차단') || key.includes('Block') || key.includes('방어 %') || key.includes('Defense %'))) && isNotEmpty(val))
    .sort(sortByValueDesc);

  /** [헬퍼] 키워드를 통해 공격 관련 스탯인지 확인 */
  const isAttackKey = (key: string) => {
    const lower = key.toLowerCase();
    return (key.endsWith(' 대미지') || lower.endsWith(' damage') || ATTACK_SPECIFIC_KEYS.includes(key));
  };

  /** 2. 모든 공격 스탯 필터링 및 정렬 */
  const allAttackStats = combatEntries
    .filter(([key, val]) => {
      if (DEFENSE_KEYS.includes(key)) return false;
      if (key === '입힌 대미지' || key === 'Damage dealt') return false; 
      if (key.includes('광전사') || key.includes('Berserk')) return false;
      return isAttackKey(key) && isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  /** 3. 기여도(%)에 따라 주요 딜러와 소수 딜러 분리 */
  const majorStats: [string, any, number][] = [];
  const minorStats: [string, any][] = [];

  allAttackStats.forEach(([key, value]) => {
    const valNum = parseGameNumber(String(value));
    const percentage = totalDamageVal > 0 ? (valNum / totalDamageVal) * 100 : 0;
    if (percentage >= 1.0) majorStats.push([key, value, percentage]);
    else minorStats.push([key, value]);
  });

  /** 4. 기타 전투 스탯 */
  const miscStats = combatEntries
    .filter(([key, val]) => {
        if (DEFENSE_KEYS.includes(key)) return false;
        if (key === '입힌 대미지' || key === 'Damage dealt') return false;
        if (key.includes('광전사') || key.includes('Berserk')) return isNotEmpty(val);
        return !isAttackKey(key) && isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  const StatRow = ({ items }: { items: [string, any][] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-5">
      {items.map(([key, value]) => (
        <div key={key} className="flex flex-col group">
          <div className="text-[11px] text-slate-500 mb-1 truncate group-hover:text-slate-400" title={key}>{key}</div>
          <div className="text-slate-200 font-bold font-mono text-sm truncate tracking-wide" title={String(value)}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> {Text.HEADER_COMBAT}
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">{Text.HEADER_TOTAL}</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {majorStats.length > 0 ? (
        <div className="mb-6 space-y-3">
          {majorStats.map(([key, value, percentage], idx) => {
            const displayPercent = percentage.toFixed(1);
            const colorSet = RANK_COLORS[idx] || DEFAULT_RANK_COLOR;
            return (
              <div key={key} className="group">
                <div className="flex justify-between items-end mb-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>{idx + 1}</span>
                    <span className="text-slate-300 font-medium">{key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{String(value)}</span>
                    <span className={`font-bold w-12 text-right ${colorSet.text}`}>{displayPercent}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-4 text-sm">{Text.NO_DATA}</div>
      )}

      {minorStats.length > 0 && (
        <div className="mb-6">
           <button onClick={() => setShowMinors(!showMinors)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4">
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>{Text.HEADER_MISC_DEALER} ({minorStats.length})</span>
           </button>
           {showMinors && <div className="animate-fade-in pl-2"><StatRow items={minorStats} /></div>}
        </div>
      )}

      {takenStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-blue-400 uppercase tracking-wider">
            <ShieldAlert size={16} /> {Text.HEADER_TAKEN}
          </h4>
          <StatRow items={takenStats} />
        </>
      )}

      {absorbedStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-emerald-400 uppercase tracking-wider">
            <ShieldCheck size={16} /> {Text.HEADER_ABSORBED}
          </h4>
          <StatRow items={absorbedStats} />
        </>
      )}

      {miscStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}
    </div>
  );
}
