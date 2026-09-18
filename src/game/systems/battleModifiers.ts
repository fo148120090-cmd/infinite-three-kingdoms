import type { General, Unit } from '../types';
import { getFormationBonus } from './formation';
import { getRelationshipBonus } from './relationships';
import { getDamageReductionPct, getPassive } from './passives';

export type BattleModifiers = {
  attackPct: number;
  hpPct: number;
  skillPowerPct: number;
  damageReductionPct: number;
  rageGain: number;
  critPct: number;
};

export function getBattleModifiers(generals: General[]): BattleModifiers {
  const formation = getFormationBonus(generals);
  const relationship = getRelationshipBonus(generals);

  return {
    attackPct: formation.attackPct + relationship.attackPct,
    hpPct: formation.hpPct + relationship.hpPct,
    skillPowerPct: formation.skillPowerPct + relationship.skillPowerPct,
    critPct: formation.critPct + relationship.critPct,
    damageReductionPct: 0,
    rageGain: 0,
  };
}

export function getUnitBattleModifiers(unit: Pick<Unit, 'id'>, generals: General[]): BattleModifiers {
  const team = getBattleModifiers(generals);
  const passive = getPassive(unit.id);

  return {
    attackPct: team.attackPct + (passive.attackPct ?? 0),
    hpPct: team.hpPct + (passive.hpPct ?? 0),
    skillPowerPct: team.skillPowerPct + (passive.skillPowerPct ?? 0),
    critPct: team.critPct,
    damageReductionPct: passive.damageReductionPct ?? 0,
    rageGain: team.rageGain + (passive.rageGain ?? 0),
  };
}

export function applyBattleModifiers(unit: Unit, generals: General[]): Unit {
  const modifiers = getUnitBattleModifiers(unit, generals);
  const attackMultiplier = 1 + modifiers.attackPct / 100;
  const hpMultiplier = 1 + modifiers.hpPct / 100;
  const nextMaxHp = Math.max(1, Math.floor(unit.maxHp * hpMultiplier));

  return {
    ...unit,
    atk: Math.floor(unit.atk * attackMultiplier),
    maxHp: nextMaxHp,
    currentHp: Math.min(nextMaxHp, Math.floor(unit.currentHp * hpMultiplier)),
    critChance: Math.max(0, Math.min(100, (unit.critChance ?? 0) + modifiers.critPct)),
  };
}

export function getBattleSkillPowerMultiplier(unit: Pick<Unit, 'id'>, generals: General[]): number {
  return 1 + getUnitBattleModifiers(unit, generals).skillPowerPct / 100;
}

export function getBattleDamageReductionPct(unit: Pick<Unit, 'id'>): number {
  return getDamageReductionPct(unit);
}

export function applyBattleDamageReduction(unit: Pick<Unit, 'id'>, damage: number): number {
  const reduction = Math.max(0, Math.min(100, getBattleDamageReductionPct(unit)));
  return Math.max(1, Math.floor(damage * (1 - reduction / 100)));
}

export function getBattleRageGain(unit: Pick<Unit, 'id'>, generals: General[]): number {
  return getUnitBattleModifiers(unit, generals).rageGain;
}
