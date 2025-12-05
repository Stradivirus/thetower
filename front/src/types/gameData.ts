// front/src/types/gameData.ts

// 진행 상황 (UserProgress)
export interface UserProgress {
  // UW Unlock Status
  unlocked_weapons?: string[];
  unlocked_plus_weapons?: string[];

  // Module Slots
  module_unlock_attack?: number;
  module_unlock_defense?: number;
  module_unlock_generator?: number;
  module_unlock_core?: number;

  // Cards (Example)
  card_Damage?: number;
  card_Attack_Speed?: number;
  // ... 필요한 키들이 자동완성되도록 추가 가능

  // 동적 키 접근을 위한 인덱스 시그니처 (기존 코드 호환성 유지)
  [key: string]: any; 
}

// 모듈 아이템 (EquippedModule)
export interface ModuleItem {
  name: string;
  rarity: number;
}

// 모듈 상태 (UserModules)
export interface UserModules {
  // Equipped Slots
  equipped_cannon_main?: ModuleItem;
  equipped_cannon_sub?: ModuleItem;
  equipped_armor_main?: ModuleItem;
  equipped_armor_sub?: ModuleItem;
  equipped_generator_main?: ModuleItem;
  equipped_generator_sub?: ModuleItem;
  equipped_core_main?: ModuleItem;
  equipped_core_sub?: ModuleItem;

  // 보유 중인 모듈 (Inventory)
  [key: string]: any;
}