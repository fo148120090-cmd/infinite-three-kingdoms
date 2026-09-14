import type { General, Unit } from '../types';
import { getFormationBonus } from './formation';
import { getRelationshipBonus } from './relationships';
import { getDamageReductionPct, getPassive, getSkillPowerMultiplier } from './passives';

export type BattleModifiers = {
  attackPct: number;
  hpPct: number;
  skillPowerPct: number;
  critPct: number;
  damageReductionPct: number;
  rageGain: number;
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

export function applyBattleModifiers(unit: Unit, generals: General[]): Unit {
  const modifiers = getBattleModifiers(generals);
  const passive = getPassive(unit.id);
  const attackMultiplier = 1 + (modifiers.attackPct + (passive.attackPct ?? 0)) / 100;
  const hpMultiplier = 1 + (modifiers.hpPct + (passive.hpPct ?? 0)) / 100;
  const nextMaxHp = Math.max(1, Math.floor(unit.maxHp * hpMultiplier));

  return {
    ...unit,
    atk: Math.floor(unit.atk * attackMultiplier),
    maxHp: nextMaxHp,
    currentHp: Math.min(nextMaxHp, Math.floor(unit.currentHp * hpMultiplier)),
  };
}

export function getBattleSkillPowerMultiplier(unit: Pick<Unit, 'id'>, generals: General[]): number {
  const modifiers = getBattleModifiers(generals);
  return (1 + modifiers.skillPowerPct / 100) * getSkillPowerMultiplier(unit);
}

export function getBattleDamageReductionPct(unit: Pick<Unit, 'id'>): number {
  return getDamageReductionPct(unit);
}
