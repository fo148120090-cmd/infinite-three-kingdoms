import type { Equip } from '../types';

export const MAX_EQUIPMENT_LEVEL = 20;

export function getEquipmentRarity(level: number): number {
  if (level >= 16) return 5;
  if (level >= 11) return 4;
  if (level >= 6) return 3;
  if (level >= 3) return 2;
  return 1;
}

export function getEquipmentEnhanceCost(level: number): number {
  return (level + 1) * 5;
}

export function getEquipmentRerollCost(): number {
  return 20;
}

export function createDefaultEquipment(): Equip {
  return { level: 0, rarity: 1, equipped: true, optionA: 0, optionB: 1 };
}

export function enhanceEquipment(equipment: Equip): Equip | null {
  if (equipment.level >= MAX_EQUIPMENT_LEVEL) return null;
  const level = equipment.level + 1;
  return { ...equipment, level, rarity: getEquipmentRarity(level) };
}
