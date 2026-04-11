/**
 * 파일명: thetower/front/src/components/Detail/CombatAnalysis.tsx
 * 용도: 전투 리포트 상세 페이지에서 대미지 및 전투 데이터를 분석하여 시각화
 * 기능: 총 대미지 대비 기여도 계산, 상위 딜러 순위 표시, 처치 수단(Pie Chart) 및 처치 효과(Side-by-Side) 통합 분석
 */
import { useState } from 'react';
import { Sword, ChevronDown, ChevronUp, Zap, Target, Skull } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { parseGameNumber, formatNumber } from '../../utils/format'; 
import { T } from '../../locales'; 
import { 
  DEFENSE_KEYS, ATTACK_SPECIFIC_KEYS, RANK_COLORS, DEFAULT_RANK_COLOR 
} from '../../constants/reportRules'; 

interface Props {
  combatJson?: Record<string, any>;   // V1 전투 섹션 원본 JSON 데이터
  damageJsonV2?: Record<string, any>; // V2 대미지 관련 통합 JSON 데이터
  enemyJson?: Record<string, any>;    // V2 적 통계 데이터 (Fallback용)
  killEffects?: Record<string, any>;  // V2 처치 효과 데이터
  killSourceJson?: Record<string, any>; // V2 처치 수단 데이터 (Destroyed By)
  totalEnemies?: number;              // V2 전체 적 처치 수
}

/** 차트 색상 팔레트 */
const CHART_COLORS = [
  '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', 
  '#06b6d4', '#f43f5e', '#a855f7', '#14b8a6', '#f97316'
];

export default function CombatAnalysis({ combatJson, damageJsonV2, enemyJson, killEffects, killSourceJson, totalEnemies }: Props) {
  const [showMinors, setShowMinors] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

  /** [헬퍼] 키워드 판별 */
  const isAttackKey = (key: string) => {
    const lower = key.toLowerCase();
    if (key === '입힌 대미지' || key === 'Damage dealt') return false;
    if (DEFENSE_KEYS.includes(key)) return false;
    return (
        (damageJsonV2 && damageJsonV2.damage?.[key]) || 
        key.endsWith(' 대미지') || lower.endsWith(' damage') || 
        ATTACK_SPECIFIC_KEYS.includes(key) ||
        key.includes('봇') || lower.includes('bot') || 
        key.includes('칩') || lower.includes('chip')
    );
  };

  /** 1. 모든 공격 스탯 필터링 및 정렬 */
  const allAttackStats = combatEntries
    .filter(([key, val]) => isAttackKey(key) && isNotEmpty(val))
    .sort(sortByValueDesc);

  /** 2. 주요 딜러와 소수 딜러 분리 */
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

  /** 3. 기타 전투 스탯 (방어 및 공격 제외) */
  const attackKeys = allAttackStats.map(([k]) => k);
  const miscStats = (damageJsonV2 ? Object.entries(combatJson || {}) : combatEntries)
    .filter(([key, val]) => {
        if (key.startsWith('_std_')) return false;
        if (DEFENSE_KEYS.includes(key)) return false;
        if (attackKeys.includes(key)) return false;
        if (key === '입힌 대미지' || key === 'Damage dealt') return false;
        return isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  /** 4. 처치 보너스 데이터 가공 */
  const killBonusEntries = killEffects 
    ? Object.entries(killEffects).filter(([_key, val]) => {
        return parseGameNumber(String(val)) > 0;
      }).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])))
    : [];

  /** 5. 파괴 수단 데이터 가공 (원형 차트용) */
  const allKillSourceItems = killSourceJson
    ? Object.entries(killSourceJson)
        .filter(([key, val]) => key !== '기타' && key !== 'Other' && parseGameNumber(String(val)) > 0)
        .sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])))
        .map(([name, value], index) => ({
            name,
            value: parseGameNumber(String(value)),
            displayValue: String(value),
            color: CHART_COLORS[index % CHART_COLORS.length],
            originalIndex: index
        }))
    : [];

  const totalKills = allKillSourceItems.reduce((sum, item) => sum + item.value, 0);

  // 비중에 따른 분리 (5% 기준)
  const majorKillSources = allKillSourceItems.filter(item => (item.value / totalKills) * 100 >= 5);
  const minorKillSources = allKillSourceItems.filter(item => (item.value / totalKills) * 100 < 5);

  /** [헬퍼] 원형 차트 지시선 라벨 렌더링 - 항상 밝게 표시 */
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.55; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={CHART_COLORS[index % CHART_COLORS.length]} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        className="text-[13px] font-black pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
        style={{ opacity: 1 }}
      >
        {name}
      </text>
    );
  };

  /** [내부 컴포넌트] 리스트 아이템 렌더러 */
  const KillSourceItem = ({ item, isMajor }: { item: any, isMajor: boolean }) => {
    const ratio = totalKills > 0 ? (item.value / totalKills) * 100 : 0;
    const isHovered = activeIndex === item.originalIndex;
    return (
        <div 
            className={`flex flex-col p-2.5 rounded-xl transition-all border ${isHovered ? 'bg-slate-800 border-slate-600 scale-[1.05]' : 'border-transparent hover:bg-slate-800/50'}`}
            onMouseEnter={() => setActiveIndex(item.originalIndex)}
            onMouseLeave={() => setActiveIndex(-1)}
        >
            <span className="text-[11px] font-black mb-1 truncate uppercase tracking-tight" style={{ color: item.color }}>{item.name}</span>
            <div className="flex items-baseline justify-between">
                {isMajor ? (
                    <>
                        <span className="text-base font-mono font-bold text-white leading-none">{item.displayValue}</span>
                        <span className="text-[10px] font-black text-slate-500 font-mono leading-none">{ratio.toFixed(1)}%</span>
                    </>
                ) : (
                    <span className="text-xs font-mono font-bold text-slate-300 leading-none">{item.displayValue}</span>
                )}
            </div>
        </div>
    );
  };

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
      {/* 1. 분석 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-500">
          <Sword size={20} /> {Text.HEADER_COMBAT}
        </h3>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-500 font-bold uppercase">{Text.HEADER_TOTAL}</span>
          <span className="text-xl font-mono font-bold text-white tracking-tight">{totalDamageStr}</span>
        </div>
      </div>
      
      {/* 2. 주요 딜러 리스트 */}
      <div className="mb-6 space-y-3">
        {majorStats.map(([key, value, percentage], idx) => {
          const colorSet = RANK_COLORS[idx] || DEFAULT_RANK_COLOR;
          return (
            <div key={key} className="group">
              <div className="flex justify-between items-end mb-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-yellow-500' : 'text-slate-500'}`}>{idx + 1}</span>
                  <span className="text-slate-300 font-medium flex items-center gap-1">{key} {percentage >= 50 && <Zap size={12} className="text-yellow-500 animate-pulse" />}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">{String(value)}</span>
                  <span className={`font-bold w-12 text-right ${colorSet.text}`}>{percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorSet.bg}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 소수 딜러 섹션 */}
      {minorStats.length > 0 && (
        <div className="mb-10">
           <button onClick={() => setShowMinors(!showMinors)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3 w-full border-t border-slate-800 pt-4">
             {showMinors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
             <span>{Text.HEADER_MISC_DEALER} ({minorStats.length}개 항목)</span>
           </button>
           {showMinors && <div className="animate-fade-in pl-2"><StatRow items={minorStats} /></div>}
        </div>
      )}

      {/* 4. 복합 분석 영역 (Destroyed By [3/4] + Kill Bonuses [1/4]) */}
      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        
        {/* [좌] Destroyed By 분석 (3/4 영역) - 3컬럼 재배치 */}
        <div className="lg:w-3/4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Skull size={18} className="text-blue-400" />
                <h4 className="text-base font-black text-blue-400 uppercase tracking-widest">Destroyed By</h4>
            </div>
            
            <div className="flex flex-col xl:flex-row items-stretch gap-2 flex-1">
                {/* [좌] Major Sources (5% 이상) */}
                <div className="w-full xl:w-1/4 flex flex-col gap-2 justify-center py-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-2 px-2 border-b border-slate-800/50 pb-1">Major (≥ 5%)</div>
                    {majorKillSources.map(item => <KillSourceItem key={item.name} item={item} isMajor={true} />)}
                </div>

                {/* [중] 초대형 원형 차트 */}
                <div className="w-full xl:w-2/4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allKillSourceItems}
                                cx="50%"
                                cy="50%"
                                labelLine={{ stroke: '#475569', strokeWidth: 2 }}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                innerRadius={75}
                                dataKey="value"
                                stroke="none"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(-1)}
                                isAnimationActive={false}
                            >
                                {allKillSourceItems.map((item, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={item.color} 
                                        opacity={activeIndex === -1 || activeIndex === item.originalIndex ? 1 : 0.3}
                                        style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                                formatter={(value: any) => [value.toLocaleString(), 'Count']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* [우] Minor Sources (5% 미만) */}
                <div className="w-full xl:w-1/4 flex flex-col gap-2 justify-center py-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mb-2 px-2 border-b border-slate-800/50 pb-1">Minor (&lt; 5%)</div>
                    <div className="grid grid-cols-1 gap-1 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {minorKillSources.map(item => <KillSourceItem key={item.name} item={item} isMajor={false} />)}
                    </div>
                </div>
            </div>
        </div>

        {/* [우측 끝] Kill Bonus 분석 (1/4 영역) */}
        <div className="lg:w-1/4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-emerald-400" />
                    <h4 className="text-base font-black text-emerald-400 uppercase tracking-widest">{Text.DASH_KILL_BONUS}</h4>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {killBonusEntries.map(([key, val]) => {
                    const valNum = parseGameNumber(String(val));
                    const ratio = actualTotalEnemies > 0 ? (valNum / actualTotalEnemies) * 100 : 0;
                    return (
                        <div key={key} className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl p-3 group hover:border-emerald-500/30 transition-all">
                            <span className="text-[12px] font-bold text-slate-300 mb-1.5 truncate group-hover:text-emerald-400" title={key}>{key}</span>
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-mono font-bold text-white leading-none">{formatNumber(valNum)}</span>
                                <span className="text-[11px] font-black text-emerald-400/80 font-mono leading-none">{ratio.toFixed(1)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {actualTotalEnemies > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-800/50">
                    <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                        <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-tighter mb-1">{Text.DASH_TOTAL_ENEMIES}</span>
                        <span className="text-base font-mono font-bold text-emerald-400">{actualTotalEnemies.toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 5. 기타 전투 스탯 */}
      {miscStats.length > 0 && (
        <>
          <div className="my-10 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}
    </div>
  );
}
