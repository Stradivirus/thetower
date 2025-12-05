import { Sword, ShieldAlert } from 'lucide-react';
import { parseGameNumber } from '../../utils/format'; 

interface Props {
  combatJson: Record<string, any>;
}

export default function CombatAnalysis({ combatJson }: Props) {
  const combatEntries = Object.entries(combatJson);
  
  // 1. 방어(수비) - [수정] 원하는 순서대로 배열 정의 (2 -> 4 -> 1 -> 3)
  const incomingKeys = ['받은 대미지', '장벽이 받은 대미지', '죽음 저항', '생명력 흡수'];
  
  // [수정] filter 후 sort를 사용하여 incomingKeys 순서대로 강제 정렬
  const incomingStats = combatEntries
    .filter(([key]) => incomingKeys.includes(key))
    .sort((a, b) => incomingKeys.indexOf(a[0]) - incomingKeys.indexOf(b[0]));

  // 2. 공격 (입힌 대미지 + 전자 손상 추가)
  const outgoingStats = combatEntries
    .filter(([key]) => {
      const isDamage = key.includes('대미지') || key === '전자 손상';
      const isBerserk = key.includes('광전사'); 
      return isDamage && !isBerserk && !incomingKeys.includes(key);
    })
    .sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));

  // 3. 기타 (나머지 항목들)
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