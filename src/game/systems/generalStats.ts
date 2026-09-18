import type { Equip, General } from '../types';

export type GeneralStatEquipment = Partial<Equip>;

export type GeneralEffectiveStats = {
  level: number;
  star: number;
  equipLevel: number;
  equipmentEquipped: boolean;
  hp: number;
  atk: number;
  defense: number;
  critChance: number;
  skillPower: number;
};

const clampLevel = (value: number) => Math.max(1, Math.min(60, Math.floor(value || 1)));
const clampStar = (value: number) => Math.max(1, Math.min(6, Math.floor(value || 1)));

function getOptionLevel(equipment: GeneralStatEquipment | undefined, option: number, equipLevel: number) {
  if (!equipment || equipment.equipped === false) return 0;
  if (equipment.optionA === option || equipment.optionB === option) return equipLevel;
  return 0;
}

export function getGeneralCombatPower(stats: Pick<GeneralEffectiveStats, 'hp' | 'atk' | 'defense' | 'critChance' | 'skillPower'>) {
  return Math.floor(stats.hp / 10 + stats.atk * 4 + stats.defense * 3 + stats.critChance * 5 + stats.skillPower * 2);
}

export function getGeneralEffectiveStats(
  general: General,
  {
    level = 1,
    star = 1,
    equipment,
  }: {
    level?: number;
    star?: number;
    equipment?: GeneralStatEquipment;
  } = {},
): GeneralEffectiveStats {
  const normalizedLevel = clampLevel(level);
  const normalizedStar = clampStar(star);
  const equipmentEquipped = equipment?.equipped !== false;
  const equipLevel = equipmentEquipped ? Math.max(0, Math.floor(Number(equipment?.level) || 0)) : 0;
  const multiplier = 1 + 0.05 * (normalizedStar - 1);

  const hpOption = getOptionLevel(equipment, 1, equipLevel) * 5;
  const atkOption = getOptionLevel(equipment, 0, equipLevel) * 2;
  const defenseOption = getOptionLevel(equipment, 1, equipLevel) * 0.8;
  const critChance = Math.floor(getOptionLevel(equipment, 2, equipLevel) / 2);
  const skillOption = getOptionLevel(equipment, 3, equipLevel);

  const hp = Math.floor((general.hp + (normalizedLevel - 1) * 12 + equipLevel * 10 + hpOption) * multiplier);
  const atk = Math.floor((general.atk + (normalizedLevel - 1) * 3 + equipLevel * 4 + atkOption) * multiplier);
  const defense = Math.floor((general.defense + (normalizedLevel - 1) * 1.5 + equipLevel * 2 + defenseOption) * multiplier);

  return {
    level: normalizedLevel,
    star: normalizedStar,
    equipLevel,
    equipmentEquipped,
    hp,
    atk,
    defense,
    critChance,
    skillPower: general.skillPower + skillOption,
  };
}
