import type { UtilityStats as UtilityStatsType } from '../types/report';

interface UtilityStatsProps {
  stats: UtilityStatsType;
}

export default function UtilityStats({ stats }: UtilityStatsProps) {
  return (
    <div className="grid gap-4">
      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold text-lg mb-3">유틸리티</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">건너뛴 웨이브:</span> {stats.waves_skipped}
          </div>
          <div>
            <span className="text-gray-600">회복 패키지:</span> {stats.recovery_packages}
          </div>
          <div>
            <span className="text-gray-600">무료 공격 업그레이드:</span> {stats.free_attack_upgrades}
          </div>
          <div>
            <span className="text-gray-600">무료 방어 업그레이드:</span> {stats.free_defense_upgrades}
          </div>
          <div>
            <span className="text-gray-600">무료 유틸리티 업그레이드:</span> {stats.free_utility_upgrades}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold text-lg mb-3">코인 획득</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">죽음의 파동:</span> {stats.death_wave_coins}
            <div className="text-sm text-gray-500">체력: {stats.death_wave_health}</div>
          </div>
          <div>
            <span className="text-gray-600">황금 타워:</span> {stats.golden_tower_coins}
            <div className="text-sm text-gray-500">캐시: {stats.golden_tower_cash}</div>
          </div>
          <div>
            <span className="text-gray-600">블랙홀:</span> {stats.black_hole_coins}
          </div>
          <div>
            <span className="text-gray-600">스포트라이트:</span> {stats.spotlight_coins}
          </div>
          <div>
            <span className="text-gray-600">오브:</span> {stats.orb_coins}
          </div>
          <div>
            <span className="text-gray-600">코인 업그레이드:</span> {stats.coin_upgrade_coins}
          </div>
          <div>
            <span className="text-gray-600">코인 보너스:</span> {stats.coin_bonus_coins}
          </div>
        </div>
      </div>
    </div>
  );
}