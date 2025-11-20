import type { CombatStats as CombatStatsType } from '../types/report';

interface CombatStatsProps {
  stats: CombatStatsType;
}

export default function CombatStats({ stats }: CombatStatsProps) {
  return (
    <div className="grid gap-4">
      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold text-lg mb-3">대미지</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          
          <div>
            <span className="text-gray-600">받은 대미지:</span> {stats.damage_taken}
          </div>
          <div>
            <span className="text-gray-600">장벽이 받은 대미지:</span> {stats.barrier_damage_taken}
          </div>
          <div>
            <span className="text-gray-600">광전사 받은 대미지:</span> {stats.berserker_damage_taken}
          </div>
          <div>
            <span className="text-gray-600">광전사 배율:</span> {stats.berserker_damage_multiplier}
          </div>
          <div>
            <span className="text-gray-600">생명력 흡수:</span> {stats.lifesteal}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold text-lg mb-3">공격 타입별 대미지</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">입힌 대미지:</span> {stats.damage_dealt}
          </div>
          <div>
            <span className="text-gray-600">투사체:</span> {stats.projectile_damage}
            <div className="text-sm text-gray-500">수: {stats.projectile_count}</div>
          </div>
          <div>
            <span className="text-gray-600">오브:</span> {stats.orb_damage}
            <div className="text-sm text-gray-500">맞은 적: {stats.orb_hits}</div>
          </div>
          <div>
            <span className="text-gray-600">가시:</span> {stats.thorn_damage}
          </div>
          <div>
            <span className="text-gray-600">지뢰:</span> {stats.mine_damage}
            <div className="text-sm text-gray-500">생성: {stats.mines_created}</div>
          </div>
          <div>
            <span className="text-gray-600">내부 지뢰:</span> {stats.inner_mine_damage}
          </div>
          <div>
            <span className="text-gray-600">방어구 가르기:</span> {stats.armor_shred_damage}
          </div>
          <div>
            <span className="text-gray-600">죽음의 광선:</span> {stats.death_ray_damage}
          </div>
          <div>
            <span className="text-gray-600">스마트 미사일:</span> {stats.smart_missile_damage}
          </div>
          <div>
            <span className="text-gray-600">연쇄 번개:</span> {stats.chain_lightning_damage}
          </div>
          <div>
            <span className="text-gray-600">죽음의 파동:</span> {stats.death_wave_damage}
            <div className="text-sm text-gray-500">태그됨: {stats.death_wave_tagged}</div>
          </div>
          <div>
            <span className="text-gray-600">늪:</span> {stats.swamp_damage}
          </div>
          <div>
            <span className="text-gray-600">블랙홀:</span> {stats.black_hole_damage}
          </div>
        </div>
      </div>
    </div>
  );
}