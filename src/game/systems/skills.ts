import type { Status, Unit } from '../types';
import { isInRange } from './movement';
import { gainRage } from './combat';

export type SkillEffect = {
  damage?: number;
  heal?: number;
  buff?: number;
  status?: Status;
  statusTurns?: number;
  rageGain?: number;
};

export function canUseSkill(caster: Pick<Unit, 'x' | 'y' | 'range' | 'acted'>, target: Pick<Unit, 'x' | 'y'>): boolean {
  return !caster.acted && isInRange(caster, target);
}

export function buildSkillEffect(caster: Pick<Unit, 'skillPower' | 'atk'>): SkillEffect {
  return { damage: Math.max(0, caster.atk + caster.skillPower) };
}

export function buildUltimateEffect(caster: Pick<Unit, 'ultimatePower' | 'atk'>): SkillEffect {
  return { damage: Math.max(0, caster.atk + caster.ultimatePower), rageGain: -100 };
}

export function applyStatus(target: Unit, status: Status, turns: number): Unit {
  return { ...target, status, statusTurns: Math.max(0, turns) };
}

export function tickStatus(unit: Unit): Unit {
  if (unit.status === 'none' || unit.statusTurns <= 0) return unit;
  const nextTurns = unit.statusTurns - 1;
  return { ...unit, status: nextTurns === 0 ? 'none' : unit.status, statusTurns: nextTurns };
}

export function addSkillRage(unit: Unit, amount = 15): Unit {
  return { ...unit, rage: gainRage(unit, amount) };
}
