import { Target, Shield, Zap, Cpu } from 'lucide-react';

// [1] 장착 모듈 인터페이스 (부옵션 effects 추가)
export interface EquippedModule {
  name: string;
  rarity: number;
  effects?: string[]; 
}

// [2] 등급 상수 (리롤 시뮬레이터와 호환되도록 6단계로 정의)
// 주의: 기존에 0을 Epic으로 쓰셨다면, 이제 0은 Common이 됩니다. 
// (데이터가 꼬일 수 있으나 시뮬레이터를 위해 표준 6단계로 맞춥니다)
export const RARITY = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHIC: 4,
  ANCESTRAL: 5
};

// [3] 등급 표시 데이터 (6단계)
export const RARITIES = [
  { id: 0, label: 'Common', short: 'C', color: 'text-slate-400', border: 'border-slate-500/50', bg: 'bg-slate-500/10' },
  { id: 1, label: 'Rare', short: 'R', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
  { id: 2, label: 'Epic', short: 'E', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  { id: 3, label: 'Legendary', short: 'L', color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
  { id: 4, label: 'Mythic', short: 'M', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' },
  { id: 5, label: 'Ancestral', short: 'A', color: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10' },
];

// [4] 모듈 타입 정의 (아이콘 포함 복구)
export const MODULE_TYPES = [
  { id: 'cannon', label: 'Cannon', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'armor', label: 'Armor', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 'core', label: 'Core', icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
] as const;

// [5] 표시 순서 (SummaryModules에서 필요)
export const DISPLAY_ORDER = ['cannon', 'generator', 'armor', 'core'];