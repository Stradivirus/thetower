import { Sword, ShieldAlert } from 'lucide-react';
import { parseGameNumber } from '../../utils/format'; // [Modified] import 추가

interface Props {
  combatJson: Record<string, any>;
}

export default function CombatAnalysis({ combatJson }: Props) {
  const combatEntries = Object.entries(combatJson);
  
  // 1. 방어(수비)
  const incomingKeys = ['받은 대미지', '장벽이 받은 대미지'];
  const incomingStats = combatEntries.filter(([key]) => incomingKeys.includes(key));

  // 2. 공격 (입힌 대미지 + 전자 손상 추가)
  // [Modified] 필터 조건에 '전자 손상' 추가
  const outgoingStats = combatEntries
    .filter(([key]) => {
      const isDamage = key.includes('대미지') || key === '전자 손상';
      const isBerserk = key.includes('광전사'); // 광전사는 별도 표기
      return isDamage && !isBerserk && !incomingKeys.includes(key);
    })
    .sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));

  // 3. 기타 (나머지 항목들)
  // [Modified] 전자 손상이 기타에 포함되지 않도록 제외 조건 추가
  const miscStats = combatEntries.filter(([key]) => {
    const isDamage = key.includes('대미지') || key === '전자 손상';
    const isBerserk = key.includes('광전사');
    return (!isDamage || isBerserk) && !incomingKeys.includes(key);
  });

  const StatRow = ({ items }: { items: [string, any][] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-y-6 gap-x-4">
      {items.map(([key, value]) => (
        <div key={key}>
          <div className="text-xs text-slate-500 mb-1">{key}</div>
          <div className="text-slate-200 font-medium font-mono text-sm truncate" title={String(value)}>
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-rose-500">
        <Sword size={20} /> 전투 통계
      </h3>
      
      <StatRow items={outgoingStats} />

      {incomingStats.length > 0 && (
        <>
          <div className="my-6 border-t border-slate-800 border-dashed"></div>
          <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-blue-400">
            <ShieldAlert size={16} /> 방어 (피격)
          </h4>
          <StatRow items={incomingStats} />
        </>
      )}

      <div className="my-6 border-t border-slate-800 border-dashed"></div>
      <StatRow items={miscStats} />
    </div>
  );
}