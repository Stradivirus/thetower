import type { BotGuardianStats as BotGuardianStatsType } from '../types/report';

interface BotGuardianStatsProps {
  stats: BotGuardianStatsType;
}

export default function BotGuardianStats({ stats }: BotGuardianStatsProps) {
  return (
    <div className="grid gap-4">
      {/* 봇 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-green-700 border-b pb-2">봇 활동 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <StatItem label="화염 봇 대미지" value={stats.flame_bot_damage} />
          <StatItem label="천둥 봇 기절" value={stats.thunder_bot_stuns} />
          <StatItem label="황금 봇 코인 획득" value={stats.golden_bot_coins} />
          <StatItem label="골든봇에서 파괴됨" value={stats.destroyed_by_golden_bot} />
        </div>
      </div>

      {/* 가디언 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-green-700 border-b pb-2">가디언 활동 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <StatItem label="가디언 대미지" value={stats.guardian_damage} />
          <StatItem label="소환된 적들" value={stats.guardian_summoned_enemies} />
          <StatItem label="가디언이 훔친 코인" value={stats.guardian_stolen_coins} />
          <StatItem label="가져온 동전 (반환)" value={stats.guardian_returned_coins} />
        </div>
      </div>
      
      {/* 보상 및 파편 통계 */}
      <div className="p-4 bg-white border rounded-xl shadow-lg">
        <h3 className="font-bold text-xl mb-4 text-green-700 border-b pb-2">획득 보상</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <StatItem label="보석" value={stats.gems} />
          <StatItem label="메달" value={stats.medals} />
          <StatItem label="다시 뽑기 파편" value={stats.reroll_shards} />
          <StatItem label="대포 파편" value={stats.cannon_shards} />
          <StatItem label="갑옷 파편" value={stats.armor_shards} />
          <StatItem label="발전기 파편" value={stats.generator_shards} />
          <StatItem label="코어 샤드" value={stats.core_shards} />
          <StatItem label="공통 모듈" value={stats.common_modules} />
          <StatItem label="희귀 모듈" value={stats.rare_modules} />
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