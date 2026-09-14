import type { Unit } from '../types';
import { applyMonsterBossPattern } from './monsterBoss';

export type MonsterTurnEffect = {
  unitId: string;
  message: string;
  damage?: number;
};

/** Applies only the monster boss pattern at the start of a monster turn. */
export function applyMonsterBossTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  if (floor % 10 !== 0) return [];
  const boss = units.find(unit => unit.team === 'enemy' && unit.currentHp > 0 && unit.grade >= 6);
  if (!boss) return [];
  const result = applyMonsterBossPattern(boss, floor, turn);
  return result.applied ? [{ unitId: boss.id, message: result.message }] : [];
}

/** Region hazards are intentionally excluded from the tower combat flow. */
export function applyMonsterTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  return applyMonsterBossTurnEffects(units, floor, turn);
}
