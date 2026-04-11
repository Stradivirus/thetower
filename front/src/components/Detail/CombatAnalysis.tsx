/**
 * 파일명: thetower/front/src/components/Detail/CombatAnalysis.tsx
 * 용도: 전투 리포트 상세 페이지에서 대미지 및 전투 데이터를 분석하여 시각화
 * 기능: 총 대미지 대비 기여도 계산, 상위 딜러 순위 표시, 기타 전투 스탯 정렬, 처치 효과 분석 포함
 */
import { useState } from 'react';
import { Sword, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';
import { parseGameNumber } from '../../utils/format'; 
import { T } from '../../locales'; 
import { 
  DEFENSE_KEYS, ATTACK_SPECIFIC_KEYS, RANK_COLORS, DEFAULT_RANK_COLOR 
} from '../../constants/reportRules'; 

interface Props {
  combatJson?: Record<string, any>;   // V1 전투 섹션 원본 JSON 데이터
  damageJsonV2?: Record<string, any>; // V2 대미지 관련 통합 JSON 데이터
  enemyJson?: Record<string, any>;    // V2 적 통계 데이터 (Fallback용)
  killEffects?: Record<string, any>;  // V2 처치 효과 데이터
  totalEnemies?: number;              // V2 전체 적 처치 수
}

export default function CombatAnalysis({ combatJson, damageJsonV2, enemyJson, killEffects, totalEnemies }: Props) {
  const [showMinors, setShowMinors] = useState(false);
  const Text = T.detail;

  let combatEntries: [string, any][] = [];
  let totalDamageStr = '0';

  if (damageJsonV2) {
    const dmg = damageJsonV2.damage || {};
    totalDamageStr = String(dmg['입힌 대미지'] || dmg['Damage dealt'] || '0');
    combatEntries = Object.entries(dmg);
  } else if (combatJson) {
    combatEntries = Object.entries(combatJson).filter(([key]) => !key.startsWith('_std_'));
    const stdTotal = combatJson['_std_damage_dealt'];
    totalDamageStr = String(stdTotal || combatJson['입힌 대미지'] || combatJson['Damage dealt'] || '0');
  }

  const totalDamageVal = parseGameNumber(totalDamageStr);

  // 전체 적 수 결정
  const actualTotalEnemies = totalEnemies || (enemyJson ? parseGameNumber(String(enemyJson['적 합계'] || enemyJson['Total Enemies'] || 0)) : 0);

  /** [헬퍼] 0인 값 필터링 로직 */
  const isNotEmpty = (val: any) => {
    if (val === 0 || val === '0' || val === '0.00') return false;
    return true;
  };

  /** [헬퍼] 수치 기준 내림차순 정렬 함수 */
  const sortByValueDesc = (a: [string, any], b: [string, any]) => {
    return parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));
  };

  /** [헬퍼] 키워드를 통해 공격 관련 스탯인지 확인 */
  const isAttackKey = (key: string) => {
    const lower = key.toLowerCase();
    if (damageJsonV2 && damageJsonV2.damage?.[key]) {
        return key !== '입힌 대미지' && key !== 'Damage dealt';
    }
    return (key.endsWith(' 대미지') || lower.endsWith(' damage') || ATTACK_SPECIFIC_KEYS.includes(key));
  };

  /** 1. 모든 공격 스탯 필터링 및 정렬 */
  const allAttackStats = combatEntries
    .filter(([key, val]) => {
      if (DEFENSE_KEYS.includes(key)) return false;
      if (damageJsonV2) {
          if (damageJsonV2.damage_taken?.[key] || damageJsonV2.damage_block?.[key]) return false;
      }
      if (key === '입힌 대미지' || key === 'Damage dealt') return false; 
      if (key.includes('광전사') || key.includes('Berserk')) return false;
      return isAttackKey(key) && isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  /** 2. 기여도(%)에 따라 주요 딜러와 소수 딜러 분리 */
  const majorStats: [string, any, number][] = [];
  const minorStats: [string, any][] = [];

  allAttackStats.forEach(([key, value], idx) => {
    const valNum = parseGameNumber(String(value));
    const percentage = totalDamageVal > 0 ? (valNum / totalDamageVal) * 100 : 0;
    
    if (idx < 3 || percentage >= 1.0) {
      majorStats.push([key, value, percentage]);
    } else {
      minorStats.push([key, value]);
    }
  });

  /** 3. 기타 전투 스탯 (방어 관련 완전 제외) */
  const miscStats = (damageJsonV2 ? Object.entries(combatJson || {}) : combatEntries)
    .filter(([key, val]) => {
        if (key.startsWith('_std_')) return false;
        if (DEFENSE_KEYS.includes(key)) return false;
        if (damageJsonV2) {
            if (damageJsonV2.damage_taken?.[key] || damageJsonV2.hp_regen?.[key] || damageJsonV2.damage_block?.[key] || damageJsonV2.bonus_hp?.[key]) return false;
            if (damageJsonV2.damage?.[key] && isAttackKey(key)) return false;
        }
        if (key === '입힌 대미지' || key === 'Damage dealt') return false;
        if (key.includes('광전사') || key.includes('Berserk')) return isNotEmpty(val);
        return !isAttackKey(key) && isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  /** 4. 처치 보너스 데이터 가공 (V2 전용) */
  const killBonusEntries = killEffects 
    ? Object.entries(killEffects).filter(([key, val]) => {
        return parseGameNumber(String(val)) > 0;
      }).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])))
    : [];

  /** [내부 컴포넌트] 소형 스탯 그리드 행 */
  const StatRow = ({ items }: { items: [string, any][] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-5">
      {items.map(([key, value]) => (
        <div key={key} className="flex flex-col group">
          <div className="text-[11px] text-slate-500 mb-1 truncate transition-colors group-hover:text-slate-400" title={key}>{key}</div>
          <div className="text-slate-200 font-bold font-mono text-sm truncate tracking-wide" title={String(value)}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      {/* 분석 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> {Text.HEADER_COMBAT}
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">{Text.HEADER_TOTAL}</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {/* 1. 주요 딜러 리스트 */}
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

      {/* 2. 소수 딜러 섹션 (기타 딜러) */}
      {minorStats.length > 0 && (
        <div className="mb-6">
           <button onClick={() => setShowMinors(!showMinors)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4">
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>{Text.HEADER_MISC_DEALER} ({minorStats.length}개 항목)</span>
           </button>
           {showMinors && <div className="animate-fade-in pl-2"><StatRow items={minorStats} /></div>}
        </div>
      )}

      {/* 3. 처치 보너스 분석 (동적 그리드 레이아웃) */}
      {killBonusEntries.length > 0 && (
        <div className="mb-4 mt-8 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-emerald-400" />
                    <h4 className="text-base font-black text-emerald-400 uppercase tracking-widest">{Text.DASH_KILL_BONUS}</h4>
                </div>
                {actualTotalEnemies > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                        <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-tighter">{Text.DASH_TOTAL_ENEMIES}</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">{actualTotalEnemies.toLocaleString()}</span>
                    </div>
                )}
            </div>
            
            <div 
                className="grid gap-4"
                style={{ 
                    // 모바일에서는 2열, 큰 화면에서는 항목 수에 맞춰 동적 열 생성
                    gridTemplateColumns: window.innerWidth > 1024 
                        ? `repeat(${killBonusEntries.length}, minmax(0, 1fr))` 
                        : `repeat(auto-fill, minmax(140px, 1fr))`
                }}
            >
                {killBonusEntries.map(([key, val]) => {
                    const valNum = parseGameNumber(String(val));
                    const ratio = actualTotalEnemies > 0 ? (valNum / actualTotalEnemies) * 100 : 0;
                    
                    return (
                        <div key={key} className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3 group hover:border-emerald-500/30 transition-all">
                            <span className="text-[13px] font-bold text-slate-300 mb-2 truncate group-hover:text-emerald-400 transition-colors" title={key}>{key}</span>
                            <span className="text-base font-mono font-bold text-white tracking-tight leading-none mb-1">{valNum.toLocaleString()}</span>
                            <span className="text-xs font-black text-emerald-400/80 font-mono leading-none">{ratio.toFixed(1)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* 4. 기타 전투 스탯 (최하단) */}
      {miscStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}
    </div>
  );
}
