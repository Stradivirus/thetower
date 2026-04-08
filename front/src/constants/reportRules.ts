// src/constants/language.ts

// 1. 공통 필터링 (화면에 보여주지 않을 키)
export const HIDDEN_KEYS = [
  '황금 타워로 획득한 캐시', 
  'Cash From Golden Tower'
];

// 2. [전투 통계] 방어(피격) 관련 키
export const DEFENSE_KEYS = [
  '받은 대미지', '장벽이 받은 대미지', '죽음 저항', '생명력 흡수',
  'Damage Taken', 'Damage Taken Wall', 'Death Defy', 'Lifesteal'
];

// 3. [전투 통계] 공격(딜러) 관련 특수 키 (Suffix로 감지 안 되는 것들)
export const ATTACK_SPECIFIC_KEYS = [
  '전자 손상', 'Electrons Damage'
];

// 4. [전투 통계] 랭킹 색상 팔레트
export const RANK_COLORS = [
  { text: 'text-rose-400', bg: 'bg-rose-500' },      // 1위
  { text: 'text-orange-400', bg: 'bg-orange-500' },   // 2위
  { text: 'text-amber-400', bg: 'bg-amber-500' },     // 3위
  { text: 'text-lime-400', bg: 'bg-lime-500' },       // 4위
  { text: 'text-cyan-400', bg: 'bg-cyan-500' },       // 5위
];
export const DEFAULT_RANK_COLOR = { text: 'text-slate-400', bg: 'bg-slate-500' };

// 5. [적 통계] 정렬 순서 (왼쪽: 일반 유닛)
export const ENEMY_LEFT_ORDER = [
  '적 합계', 'Total Enemies',
  '기본', 'Basic',
  '신속', 'Fast',
  '원거리', 'Ranged',
  '탱킹', 'Tank',
  '수호자', 'Protector',
  '보스', 'Boss'
];

// 6. [적 통계] 정렬 순서 (오른쪽: 엘리트 및 특수)
export const ENEMY_RIGHT_ORDER = [
  '총 엘리트', 'Total Elites',
  '광선', 'Rays', 'Ray',
  '스캐터', 'Scatters', 'Scatter',
  '뱀파이어', 'Vampires', 'Vampire',
  '과전하', 'Overcharge',
  '파괴 공작원', 'Saboteur', 'Saboteurs',
  '지휘관', 'Commander'
];

// 7. [봇 & 가디언] 자원 목록 (왼쪽에 배치할 항목들)
export const RESOURCE_ORDER = [
  '보석', 'Gems', 
  '메달', 'Medals', 
  '공통 모듈', 'Common Modules', 
  '희귀 모듈', 'Rare Modules', 
  '코어 샤드', 'Core Shards',
  '다시 뽑기 파편', 'Reroll Shards',
  '회수한 코인', 'Coins Fetched'
];

// 8. [V2 전용] 섹션 정의
export const V2_DAMAGE_JSON_SECTIONS = ['damage', 'damage_taken', 'bonus_hp', 'hp_regen', 'damage_block'];
export const V2_STATS_JSON_SECTIONS = ['enemy_json', 'stats', 'enemy_hits', 'kill_effects'];

// 9. [V2 전용] 화폐 섹션 필터링
export const V2_CURRENCY_KEYS = [
  '획득한 셀', 'Cells Earned',
  '보석', 'Gems',
  '광고 보석', 'Ad Gems',
  '메달', 'Medals',
  '다시 뽑기 파편 획득함', 'Reroll Shards Earned',
  '대포 파편', 'Cannon Shards',
  '방어구 파편', 'Armor Shards',
  '발전기 파편', 'Generator Shards',
  '코어 파편', 'Core Shards',
  '일반 모듈', 'Common Modules',
  '희귀 모듈', 'Rare Modules'
];
