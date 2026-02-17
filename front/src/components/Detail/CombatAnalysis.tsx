/**
 * 파일명: thetower/front/src/components/Detail/CombatAnalysis.tsx
 * 용도: 전투 리포트 상세 페이지에서 대미지 및 전투 데이터를 분석하여 시각화
 * 기능: 총 대미지 대비 기여도 계산, 상위 딜러 순위 표시, 방어 관련 스탯 집계, 미미한 대미지 항목 접기/펼치기
 */
import { useState } from 'react';
import { Sword, ShieldAlert, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { parseGameNumber } from '../../utils/format'; 
import { T } from '../../locales'; 
import { 
  DEFENSE_KEYS, ATTACK_SPECIFIC_KEYS, RANK_COLORS, DEFAULT_RANK_COLOR 
} from '../../constants/reportRules'; 

interface Props {
  combatJson: Record<string, any>; // 전투 섹션 원본 JSON 데이터
}

export default function CombatAnalysis({ combatJson }: Props) {
  const [showMinors : boolean, setShowMinors] = useState(false);
  const Text = T.detail;

  // 표준화된 필드 및 원본 키 필터링
  const combatEntries = Object.entries(combatJson).filter(([key]) => !key.startsWith('_std_'));
  
  const stdTotal = combatJson['_std_damage_dealt'];
  const rawTotal = stdTotal || combatJson['입힌 대미지'] || combatJson['Damage dealt'] || '0';
  const totalDamageVal = parseGameNumber(String(rawTotal));
  const totalDamageStr = String(rawTotal);

  /** 1. 방어/수비 관련 스탯 필터링 및 정렬 */
  const incomingStats = combatEntries
    .filter(([key]) => DEFENSE_KEYS.includes(key))
    .sort((a, b) => DEFENSE_KEYS.indexOf(a[0]) - DEFENSE_KEYS.indexOf(b[0]));

  /** [헬퍼] 키워드를 통해 공격 관련 스탯인지 확인합니다. */
  const isAttackKey = (key: string) => {
    const lower = key.toLowerCase();
    return (
        key.endsWith(' 대미지') || lower.endsWith(' damage') || ATTACK_SPECIFIC_KEYS.includes(key)
    );
  };

  /** 2. 모든 공격 스탯 필터링 및 대미지량 기준 내림차순 정렬 */
  const allAttackStats = combatEntries
    .filter(([key]) => {
      if (DEFENSE_KEYS.includes(key)) return false;
      if (key === '입힌 대미지' || key === 'Damage dealt') return false; 
      if (key.includes('광전사') || key.includes('Berserk')) return false;
      return isAttackKey(key);
    })
    .sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));

  /** 3. 기여도(%)에 따라 주요 딜러와 소수 딜러 분리 (기준: 1.0%) */
  const majorStats: [string, any, number][] = [];
  const minorStats: [string, any][] = [];

  allAttackStats.forEach(([key, value]) => {
    const valNum = parseGameNumber(String(value));
    const percentage = totalDamageVal > 0 ? (valNum / totalDamageVal) * 100 : 0;
    if (percentage >= 1.0) majorStats.push([key, value, percentage]);
    else minorStats.push([key, value]);
  });

  /** 4. 기타 스탯 (공격/방어 분류에 해당하지 않는 잡다한 정보) */
  const miscStats = combatEntries.filter(([key]) => {
    if (DEFENSE_KEYS.includes(key)) return false;
    if (key === '입힌 대미지' || key === 'Damage dealt') return false;
    return !isAttackKey(key) || key.includes('광전사') || key.includes('Berserk');
  });

  /** [내부 컴포넌트] 소형 스탯 그리드 행 */
  const StatRow = ({ items }: { items: [string, any][] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-4 gap-x-4">
      {items.map(([key, value]) => (
        <div key={key} className="bg-slate-950/30 p-2 rounded border border-slate-800/50">
          <div className="text-[11px] text-slate-500 mb-0.5 truncate" title={key}>{key}</div>
          <div className="text-slate-200 font-medium font-mono text-xs truncate" title={String(value)}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      {/* 분석 헤더: 제목 및 총 입힌 대미지 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> {Text.HEADER_COMBAT}
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">{Text.HEADER_TOTAL}</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {/* 1. 주요 딜러 리스트 (프로그레스 바 포함) */}
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
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      {key} {percentage >= 50 && <Zap size={12} className="text-yellow-500 animate-pulse" />}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{String(value)}</span>
                    <span className={`font-bold w-12 text-right ${colorSet.text}`}>{displayPercent}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg} group-hover:brightness-110`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-4 text-sm">{Text.NO_DATA}</div>
      )}

      {/* 2. 소수 딜러 섹션 (접기/펼치기 가능) */}
      {minorStats.length > 0 && (
        <div className="mb-6">
           <button onClick={() => setShowMinors(!showMinors)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4">
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>{Text.HEADER_MISC_DEALER} ({minorStats.length}개 항목 - 1% 미만)</span>
           </button>
           {showMinors && <div className="animate-fade-in pl-2"><StatRow items={minorStats} /></div>}
        </div>
      )}

      {/* 3. 방어/수비 관련 스탯 */}
      {incomingStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-400">
            <ShieldAlert size={16} /> {Text.HEADER_DEFENSE}
          </h4>
          <StatRow items={incomingStats} />
        </>
      )}

      {/* 4. 기타 전투 스탯 */}
      {miscStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}
    </div>
  );
}