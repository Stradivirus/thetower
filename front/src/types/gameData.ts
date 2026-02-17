/**
 * 파일명: thetower/front/src/types/gameData.ts
 * 용도: 게임 진행도 및 모듈 관련 공통 타입 정의
 * 기능: UserProgress, ModuleItem, UserModules 등 데이터 구조 타입 가이드 제공
 */

/** 
 * 사용자의 게임 진행 상황(진척도) 인터페이스
 */
export interface UserProgress {
  // UW 해금 상태
  unlocked_weapons?: string[];
  unlocked_plus_weapons?: string[];

  // 모듈 슬롯 해금 등급
  module_unlock_attack?: number;
  module_unlock_defense?: number;
  module_unlock_generator?: number;
  module_unlock_core?: number;

  // 카드 마스터리 상태 (예시)
  card_Damage?: number;
  card_Attack_Speed?: number;

  // 동적 키 접근을 위한 인덱스 시그니처
  [key: string]: any; 
}

/** 
 * 개별 모듈 아이템 정보
 */
export interface ModuleItem {
  name: string;    // 모듈 이름
  rarity: number;  // 모듈 등급 (0: Common ~ 5: Ancestral)
}

/** 
 * 사용자의 모듈 인벤토리 및 장착 상태 인터페이스
 */
export interface UserModules {
  // 장착 중인 슬롯 정보
  equipped_cannon_main?: ModuleItem;
  equipped_cannon_sub?: ModuleItem;
  equipped_armor_main?: ModuleItem;
  equipped_armor_sub?: ModuleItem;
  equipped_generator_main?: ModuleItem;
  equipped_generator_sub?: ModuleItem;
  equipped_core_main?: ModuleItem;
  equipped_core_sub?: ModuleItem;

  // 보유 중인 인벤토리 모듈들 (동적 키)
  [key: string]: any;
}