import type { Unit } from '../types';
import { isInRange } from './movement';

export type DamageResult = {
  damage: number;
  targetHp: number;
  defeated: boolean;
};

export function calculateBasicDamage(attacker: Pick<Unit, 'atk' | 'buff'>, target: Pick<Unit, 'currentHp'>): number {
  return Math.max(1, attacker.atk + attacker.buff);
}

export function applyDamage(target: Unit, damage: number): DamageResult {
  const nextHp = Math.max(0, target.currentHp - Math.max(0, damage));
  return { damage: Math.max(0, damage), targetHp: nextHp, defeated: nextHp <= 0 };
}

export function canAttack(attacker: Pick<Unit, 'x' | 'y' | 'range' | 'acted'>, target: Pick<Unit, 'x' | 'y'>): boolean {
  return !attacker.acted && isInRange(attacker, target);
}

export function gainRage(unit: Pick<Unit, 'rage'>, amount: number): number {
  return Math.min(100, Math.max(0, unit.rage + amount));
}

export function resetTurn(unit: Unit): Unit {
  return { ...unit, acted: false, movePoints: unit.move, rage: gainRage(unit, 10) };
}
