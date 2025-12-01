import { Sword, ShieldAlert } from 'lucide-react';

interface Props {
  combatJson: Record<string, any>;
}

// 단위 파싱 함수
const parseGameNumber = (str: string): number => {
  if (!str) return 0;
  const clean = str.replace(/[$,x]/g, '').trim();
  const match = clean.match(/^([\d.]+)([a-zA-Z]*)$/);
  if (!match) return 0;
  
  const val = parseFloat(match[1]);
  const suffix = match[2];

  const powers: Record<string, number> = {
    'k': 3, 'K': 3, 'm': 6, 'M': 6, 'b': 9, 'B': 9, 't': 12, 'T': 12,
    'q': 15, 'Q': 18, 's': 21, 'S': 24, 'o': 27, 'O': 27, 'n': 30, 'N': 30, 'd': 33, 'D': 33
  };
  return val * Math.pow(10, powers[suffix] || 0);
};

export default function CombatAnalysis({ combatJson }: Props) {
  const combatEntries = Object.entries(combatJson);
  
  // 1. 방어(수비)
  const incomingKeys = ['받은 대미지', '장벽이 받은 대미지'];
  const incomingStats = combatEntries.filter(([key]) => incomingKeys.includes(key));

  // 2. 공격(입힌 대미지 - 정렬됨)
  const outgoingStats = combatEntries
    .filter(([key]) => key.includes('대미지') && !key.includes('광전사') && !incomingKeys.includes(key))
    .sort(([, valA], [, valB]) => parseGameNumber(String(valB)) - parseGameNumber(String(valA)));

  // 3. 기타
  const miscStats = combatEntries.filter(([key]) => !key.includes('대미지') || key.includes('광전사'));

  // [Updated] 그리드 컬럼 수 변경 (md:3 -> xl:5)
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