import type { EnemyStats as EnemyStatsType } from '../types/report';

interface EnemyStatsProps {
  stats: EnemyStatsType;
}

export default function EnemyStats({ stats }: EnemyStatsProps) {
  return (
    <div className="grid gap-4">
      {/* 일반/보스/가디언 적 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-blue-800 border-b pb-2">몬스터 출현 및 파괴</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="col-span-full border-b pb-2 mb-2">
            <span className="text-gray-600 font-semibold">적 합계:</span> <span className="text-lg font-mono text-indigo-600">{stats.total_enemies}</span>
          </div>
          <StatItem label="기본" value={stats.basic} />
          <StatItem label="신속" value={stats.swift} />
          <StatItem label="탱킹" value={stats.tanking} />
          <StatItem label="원거리" value={stats.ranged} />
          <StatItem label="보스" value={stats.boss} />
          <StatItem label="수호자" value={stats.guardian} />
        </div>
      </div>

      {/* 엘리트 적 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-blue-800 border-b pb-2">엘리트 적 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="col-span-full border-b pb-2 mb-2">
            <span className="text-gray-600 font-semibold">총 엘리트:</span> <span className="text-lg font-mono text-indigo-600">{stats.total_elite}</span>
          </div>
          <StatItem label="뱀파이어" value={stats.vampire} />
          <StatItem label="광선" value={stats.beam} />
          <StatItem label="스캐터" value={stats.scatter} />
          <StatItem label="방해 공작원" value={stats.saboteur} />
          <StatItem label="사령관" value={stats.commander} />
          <StatItem label="에누리" value={stats.discount} />
        </div>
      </div>
      
      {/* 특수 능력 파괴 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-blue-800 border-b pb-2">특수 공격 파괴</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <StatItem label="오브에 의해 파괴" value={stats.destroyed_by_orb} />
          <StatItem label="가시로 파괴함" value={stats.destroyed_by_thorn} />
          <StatItem label="죽음의 광선으로 파괴함" value={stats.destroyed_by_death_ray} />
          <StatItem label="지뢰로 파괴함" value={stats.destroyed_by_mine} />
          <StatItem label="스포트라이트 속에서 파괴됨" value={stats.destroyed_in_spotlight} />
        </div>
      </div>
    </div>
  );
}

// 작은 통계 항목을 렌더링하는 헬퍼 컴포넌트
const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 p-2 rounded-lg border">
    <span className="text-gray-600 block text-xs">{label}:</span>
    <span className="font-mono text-base font-medium text-gray-900">{value}</span>
  </div>
);