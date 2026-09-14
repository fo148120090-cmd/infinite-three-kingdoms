import type { General, Terrain, Unit } from '../types';
import { gainRage } from './combat';
import { getBattleDamageReductionPct, getBattleRageGain, getBattleSkillPowerMultiplier, getUnitBattleModifiers } from './battleModifiers';
import { getManhattanDistance } from './movement';

export type BattlePosition = Pick<Unit, 'x' | 'y'>;

export type BattleStatSeed = Pick<Unit, 'hp' | 'atk' | 'range' | 'move'>;

/** Applies team + passive modifiers exactly once to a fresh battle unit. */
export function initializeBattleUnit(
  unit: Unit,
  generals: General[],
): Unit {
  const modifiers = getUnitBattleModifiers(unit, generals);
  const hpMultiplier = 1 + modifiers.hpPct / 100;
  const attackMultiplier = 1 + modifiers.attackPct / 100;
  const maxHp = Math.max(1, Math.floor(unit.maxHp * hpMultiplier));

  return {
    ...unit,
    atk: Math.max(1, Math.floor(unit.atk * attackMultiplier)),
    maxHp,
    currentHp: Math.min(maxHp, Math.floor(unit.currentHp * hpMultiplier)),
  };
}

export function calculateBattleDamage(
  attacker: Pick<Unit, 'id' | 'atk' | 'buff'>,
  target: Pick<Unit, 'id' | 'maxHp' | 'status'>,
  generals: General[],
  bonus = 0,
  isSkill = false,
  terrainBonus = 0,
): number {
  const powerMultiplier = isSkill ? getBattleSkillPowerMultiplier(attacker, generals) : 1;
  const raw = Math.floor((attacker.atk + attacker.buff + bonus * powerMultiplier + terrainBonus));
  const reduction = getBattleDamageReductionPct(target);
  const guarded = target.status === 'guard' ? 8 : 0;
  return Math.max(1, Math.floor(Math.max(1, raw - guarded) * (1 - reduction / 100)));
}

export function addBattleRage(unit: Unit, amount: number, generals: General[]): Unit {
  return { ...unit, rage: gainRage(unit, amount + getBattleRageGain(unit, generals)) };
}

export function resetBattleUnit(unit: Unit, generals: General[]): Unit {
  return {
    ...unit,
    acted: false,
    movePoints: unit.move,
    rage: gainRage(unit, 10 + getBattleRageGain(unit, generals)),
  };
}

export function isBattleInRange(attacker: BattlePosition & Pick<Unit, 'range'>, target: BattlePosition): boolean {
  return getManhattanDistance(attacker, target) <= attacker.range;
}

export function isBattleDefeated(unit: Pick<Unit, 'currentHp'>): boolean {
  return unit.currentHp <= 0;
}

export function applyBattleDamage(target: Unit, damage: number): Unit {
  return { ...target, currentHp: Math.max(0, target.currentHp - Math.max(0, damage)) };
}

export function getLivingUnits(units: Unit[], team: Unit['team']): Unit[] {
  return units.filter(unit => unit.team === team && unit.currentHp > 0);
}

export function getTerrainBonus(terrain: Terrain): number {
  if (terrain === 'fort') return 8;
  if (terrain === 'hill') return 4;
  return 0;
}
