/**
 * 파일명: thetower/front/src/components/Detail/CombatAnalysis.tsx
 * 용도: 전투 리포트 상세 페이지에서 대미지 및 전투 데이터를 분석하여 시각화 (Refactored)
 */
import { parseGameNumber } from '../../utils/format';
import {
  DEFENSE_KEYS, ATTACK_SPECIFIC_KEYS
} from '../../constants/reportRules';
import type { GameValue, DamageJson } from '../../types/report';

// 분리된 하위 컴포넌트 임포트
import DamageDealerSection, { StatRow } from './Combat/DamageDealerSection';
import KillSourceSection from './Combat/KillSourceSection';
import KillBonusSection from './Combat/KillBonusSection';
import DefenseSection from './Combat/DefenseSection';

interface Props {
  combatJson?: Record<string, GameValue>;  // V1 전투 섹션 원본 JSON 데이터
  damageJsonV2?: DamageJson;               // V2 대미지 관련 통합 JSON 데이터
  enemyJson?: Record<string, GameValue>;   // V2 적 통계 데이터 (Fallback용)
  killEffects?: Record<string, GameValue>; // V2 처치 효과 데이터
  killSourceJson?: Record<string, GameValue>; // V2 처치 수단 데이터 (Destroyed By)
  totalEnemies?: number;                   // V2 전체 적 처치 수
  stats?: Record<string, GameValue>;       // 추가: DefenseSection용 통계 데이터
}

/** 차트 및 리스트에서 사용할 색상 팔레트 */
const CHART_COLORS = [
  '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', 
  '#06b6d4', '#f43f5e', '#a855f7', '#14b8a6', '#f97316'
];

export default function CombatAnalysis({ combatJson, damageJsonV2, enemyJson, killEffects, killSourceJson, totalEnemies, stats }: Props) {
  // --- 1. 데이터 파싱 및 초기화 ---
  let combatEntries: [string, any][] = [];
  let totalDamageStr = '0';

  if (damageJsonV2) {
    const dmg = damageJsonV2.damage || {};
    const totalKey = Object.keys(dmg).find(k => k === '입힌 대미지' || k.toLowerCase() === 'damage dealt');
    totalDamageStr = String(totalKey ? dmg[totalKey] : '0');
    combatEntries = Object.entries(dmg);
  } else if (combatJson) {
    combatEntries = Object.entries(combatJson).filter(([key]) => !key.startsWith('_std_'));
    const stdTotal = combatJson['_std_damage_dealt'];
    const totalKey = Object.keys(combatJson).find(k => k === '입힌 대미지' || k.toLowerCase() === 'damage dealt');
    totalDamageStr = String(stdTotal || (totalKey ? combatJson[totalKey] : '0'));
  }

  const totalDamageVal = parseGameNumber(totalDamageStr);
  const actualTotalEnemies = totalEnemies || (enemyJson ? parseGameNumber(String(enemyJson['적 합계'] || enemyJson['Total Enemies'] || 0)) : 0);

  // --- 2. 헬퍼 함수 ---
  const isNotEmpty = (val: any) => val !== 0 && val !== '0' && val !== '0.00';
  const sortByValueDesc = (a: [string, any], b: [string, any]) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1]));
  const isAttackKey = (key: string) => {
    const lower = key.toLowerCase();
    if (key === '입힌 대미지' || lower === 'damage dealt') return false;
    if (DEFENSE_KEYS.some(dk => dk.toLowerCase() === lower)) return false;
    return (
        (damageJsonV2 && damageJsonV2.damage?.[key]) || 
        key.endsWith(' 대미지') || lower.endsWith(' damage') || 
        ATTACK_SPECIFIC_KEYS.some(ak => ak.toLowerCase() === lower) ||
        key.includes('봇') || lower.includes('bot') || 
        key.includes('칩') || lower.includes('chip')
    );
  };

  // --- 3. 섹션별 데이터 가공 ---
  
  // A. 딜러 데이터 (Major vs Minor)
  const allAttackStats = combatEntries.filter(([key, val]) => isAttackKey(key) && isNotEmpty(val)).sort(sortByValueDesc);
  const majorStats: [string, any, number][] = [];
  const minorStats: [string, any][] = [];

  allAttackStats.forEach(([key, value], idx) => {
    const valNum = parseGameNumber(String(value));
    const percentage = totalDamageVal > 0 ? (valNum / totalDamageVal) * 100 : 0;
    if (idx < 3 || percentage >= 1.0) majorStats.push([key, value, percentage]);
    else minorStats.push([key, value]);
  });

  // B. 기타 전투 스탯
  const SURVIVAL_KEYS = [
    '죽음 저항', 'Death Defy',
    '에너지 보호막으로 흡수한 타격 수', 'Energy Shield',
    '핵무기', 'Nuke',
    '세컨드 윈드', 'Second Wind',
    '데몬 모드', 'Demon Mode'
  ];

  const attackKeys = allAttackStats.map(([k]) => k);
  const miscStats = (damageJsonV2 ? Object.entries(combatJson || {}) : combatEntries)
    .filter(([key, val]) => {
        const lower = key.toLowerCase();
        if (key.startsWith('_std_') || key === '입힌 대미지' || lower === 'damage dealt') return false;
        if (DEFENSE_KEYS.some(dk => dk.toLowerCase() === lower) || attackKeys.includes(key)) return false;
        if (SURVIVAL_KEYS.includes(key)) return false; // 방어 탭으로 이동된 항목 제외
        return isNotEmpty(val);
    })
    .sort(sortByValueDesc);

  // C. 처치 보너스
  const killBonusEntries = killEffects 
    ? Object.entries(killEffects).filter(([, val]) => parseGameNumber(String(val)) > 0).sort((a, b) => parseGameNumber(String(b[1])) - parseGameNumber(String(a[1])))
    : [];

  // D. 처치 수단 (Destroyed By)
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
  const majorKillSources = allKillSourceItems.filter(item => (item.value / totalKills) * 100 >= 3);
  const minorKillSources = allKillSourceItems.filter(item => (item.value / totalKills) * 100 < 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      {/* 1. 대미지 딜러 분석 섹션 */}
      <DamageDealerSection 
        majorStats={majorStats} 
        minorStats={minorStats} 
        totalDamageStr={totalDamageStr} 
      />

      {/* 2. 복합 분석 영역 (Kill Source + Kill Bonus) */}
      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        <KillSourceSection 
          allKillSourceItems={allKillSourceItems}
          majorKillSources={majorKillSources}
          minorKillSources={minorKillSources}
          totalKills={totalKills}
        />
        <KillBonusSection 
          killBonusEntries={killBonusEntries}
          actualTotalEnemies={actualTotalEnemies}
        />
      </div>

      {/* 3. 기타 전투 스탯 그리드 */}
      {miscStats.length > 0 && (
        <>
          <div className="my-10 border-t border-slate-800 border-dashed"></div>
          <StatRow items={miscStats} />
        </>
      )}

      {/* 4. 방어 분석 통합 */}
      <DefenseSection 
        data={{ 
          ...(damageJsonV2 || {}), 
          ...(stats || {}) 
        }} 
        v2Sections={['damage_taken', 'bonus_hp', 'hp_regen', 'damage_block']} 
      />
    </div>
  );
}
