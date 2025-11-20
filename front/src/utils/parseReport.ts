export function parseReportText(reportText: string) {
  const lines = reportText.split('\n').map(line => line.trim()).filter(line => line);
  const data: Record<string, string> = {};
  
  // 각 줄을 "키\t값" 형식으로 파싱
  lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();
      data[key] = value;
    }
  });

  // 날짜 파싱 함수
  const parseBattleDate = (dateStr: string): string => {
    // "11월 20, 2025 17:36" -> "2025-11-20T17:36:00"
    const monthMap: Record<string, string> = {
      '1월': '01', '2월': '02', '3월': '03', '4월': '04',
      '5월': '05', '6월': '06', '7월': '07', '8월': '08',
      '9월': '09', '10월': '10', '11월': '11', '12월': '12'
    };
    
    const match = dateStr.match(/(\d+)월 (\d+), (\d+) (\d+):(\d+)/);
    if (match) {
      const [, month, day, year, hour, minute] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
    }
    return new Date().toISOString();
  };

  const battleDate = parseBattleDate(data['전투 날짜'] || '');

  return {
    battle_report: {
      battle_date: battleDate,
      game_time: data['게임 시간'] || '',
      real_time: data['실시간'] || '',
      tier: data['티어'] || '',
      wave: data['웨이브'] || '',
      killer: data['처치자'] || '',
      coin_earned: data['코인 획득'] || '',
      coin_per_hour: data['시간당 코인'] || '',
      cash_earned: data['캐시 획득'] || '',
      profit_earned: data['이익 획득'] || '',
      gem_block_tap: data['보석 블록 탭'] || '',
      cells_earned: data['획득한 셀'] || '',
      reroll_shards_earned: data['다시 뽑기 파편 획득함'] || '',
    },
    combat_stats: {
      battle_date: battleDate,
      damage_dealt: data['입힌 대미지'] || '',
      damage_taken: data['받은 대미지'] || '',
      barrier_damage_taken: data['장벽이 받은 대미지'] || '',
      berserker_damage_taken: data['광전사 효과 동안 받은 대미지'] || '',
      berserker_damage_multiplier: data['광전사 효과로 획득한 대미지'] || '',
      death_resistance: data['죽음 저항'] || '',
      lifesteal: data['생명력 흡수'] || '',
      projectile_damage: data['투사체 대미지'] || '',
      projectile_count: data['투사체 수'] || '',
      thorn_damage: data['가시 대미지'] || '',
      orb_damage: data['오브 대미지'] || '',
      orb_hits: data['오브에 맞은 적'] || '',
      mine_damage: data['지뢰 대미지'] || '',
      mines_created: data['생성된 지뢰'] || '',
      armor_shred_damage: data['방어구 가르기 대미지'] || '',
      death_ray_damage: data['죽음의 광선 대미지'] || '',
      smart_missile_damage: data['스마트 미사일 대미지'] || '',
      inner_mine_damage: data['내부 지뢰 대미지'] || '',
      chain_lightning_damage: data['연쇄 번개 대미지'] || '',
      death_wave_damage: data['죽음의 파동 대미지'] || '',
      death_wave_tagged: data['Deathwave로 태그됨'] || '',
      swamp_damage: data['늪 대미지'] || '',
      black_hole_damage: data['블랙홀 대미지'] || '',
    },
    utility_stats: {
      battle_date: battleDate,
      waves_skipped: data['건너뛴 웨이브'] || '',
      recovery_packages: data['회복 패키지'] || '',
      free_attack_upgrades: data['무료 공격 업그레이드'] || '',
      free_defense_upgrades: data['무료 방어 업그레이드'] || '',
      free_utility_upgrades: data['무료 유틸리티 업그레이드'] || '',
      death_wave_health: data['죽음의 파동으로 획득한 체력'] || '',
      death_wave_coins: data['죽음의 파동으로 획득한 코인'] || '',
      golden_tower_cash: data['황금 타워로 획득한 캐시'] || '',
      golden_tower_coins: data['황금 타워로 획득한 코인'] || '',
      black_hole_coins: data['블랙홀로 획득한 코인'] || '',
      spotlight_coins: data['스포트라이트로 획득한 코인'] || '',
      orb_coins: data['오브로 획득한 코인'] || '',
      coin_upgrade_coins: data['코인 업그레이드로 얻은 코인'] || '',
      coin_bonus_coins: data['코인 보너스의 코인'] || '',
    },
    enemy_stats: {
      battle_date: battleDate,
      total_enemies: data['적 합계'] || '',
      basic: data['기본'] || '',
      swift: data['신속'] || '',
      tanking: data['탱킹'] || '',
      ranged: data['원거리'] || '',
      boss: data['보스'] || '',
      guardian: data['수호자'] || '',
      total_elite: data['총 엘리트'] || '',
      vampire: data['뱀파이어'] || '',
      beam: data['광선'] || '',
      scatter: data['스캐터'] || '',
      saboteur: data['방해 공작원'] || '',
      commander: data['사령관'] || '',
      discount: data['에누리'] || '',
      destroyed_by_orb: data['오브에 의해 파괴'] || '',
      destroyed_by_thorn: data['가시로 파괴함'] || '',
      destroyed_by_death_ray: data['죽음의 광선으로 파괴함'] || '',
      destroyed_by_mine: data['지뢰로 파괴함'] || '',
      destroyed_in_spotlight: data['스포트라이트 속에서 파괴됨'] || '',
    },
    bot_guardian_stats: {
      battle_date: battleDate,
      flame_bot_damage: data['화염 봇 대미지'] || '',
      thunder_bot_stuns: data['천둥 봇 기절'] || '',
      golden_bot_coins: data['황금 봇 코인 획득'] || '',
      destroyed_by_golden_bot: data['골든봇에서 파괴됨'] || '',
      guardian_damage: data['대미지'] || '',
      guardian_summoned_enemies: data['소환된 적들'] || '',
      guardian_stolen_coins: data['가디언이 훔친 코인'] || '',
      guardian_returned_coins: data['가져온 동전'] || '',
      gems: data['보석'] || '',
      medals: data['메달'] || '',
      reroll_shards: data['샤드 재롤'] || '',
      cannon_shards: data['대포 파편'] || '',
      armor_shards: data['갑옷 파편'] || '',
      generator_shards: data['발전기 파편'] || '',
      core_shards: data['코어 샤드'] || '',
      common_modules: data['공통 모듈'] || '',
      rare_modules: data['희귀 모듈'] || '',
    },
  };
}