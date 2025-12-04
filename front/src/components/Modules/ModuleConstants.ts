import { Crosshair, Shield, Zap, Hexagon } from 'lucide-react';

// [중요] export interface가 있어야 합니다.
export interface EquippedModule {
  name: string;
  rarity: number;
}

export const RARITIES = [
  { id: 0, label: 'Epic', short: 'E', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  { id: 1, label: 'Legendary', short: 'L', color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10' },
  { id: 2, label: 'Mythic', short: 'M', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' },
  { id: 3, label: 'Ancestral', short: 'A', color: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10' },
];

export const MODULE_TYPES = [
  { id: 'cannon', label: 'Cannon', icon: Crosshair, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'armor', label: 'Armor', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'generator', label: 'Generator', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 'core', label: 'Core', icon: Hexagon, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
] as const;

export const DISPLAY_ORDER = ['cannon', 'generator', 'armor', 'core'];