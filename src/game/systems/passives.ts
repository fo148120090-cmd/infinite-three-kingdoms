import type { Unit } from '../types';

export type PassiveEffect = {
  attackPct?: number;
  hpPct?: number;
  damageReductionPct?: number;
  skillPowerPct?: number;
  rageGain?: number;
  label: string;
};

const PASSIVES: Record<string, PassiveEffect> = {
  'liu-bei': { hpPct: 5, rageGain: 5, label: '인덕 · 아군 생존력이 높을수록 분노 회복' },
  'guan-yu': { attackPct: 6, label: '무신 · 공격력 +6%' },
  'zhang-fei': { damageReductionPct: 8, label: '만인지적 · 피해 8% 감소' },
  'zhao-yun': { attackPct: 4, rageGain: 8, label: '용담 · 기동 후 공격력 +4%' },
  'zhuge-liang': { skillPowerPct: 10, label: '와룡 · 스킬 위력 +10%' },
  'cao-cao': { attackPct: 5, rageGain: 6, label: '간웅 · 공격력 +5%' },
  'xiahou-dun': { damageReductionPct: 6, label: '독안 · 피해 6% 감소' },
  'sun-quan': { skillPowerPct: 6, hpPct: 4, label: '강동 · HP +4%, 스킬 위력 +6%' },
  'lu-bu': { attackPct: 10, label: '천하무쌍 · 공격력 +10%' },
  'diao-chan': { skillPowerPct: 8, label: '경국지색 · 스킬 위력 +8%' },
};

export function getPassive(generalId: string): PassiveEffect {
  return PASSIVES[generalId] ?? { label: '고유 패시브 없음' };
}

export function applyPassiveStats(unit: Unit): Unit {
  const passive = getPassive(unit.id);
  const attackMultiplier = 1 + (passive.attackPct ?? 0) / 100;
  const hpMultiplier = 1 + (passive.hpPct ?? 0) / 100;
  const nextMaxHp = Math.max(unit.maxHp, Math.floor(unit.maxHp * hpMultiplier));
  const nextHp = Math.min(nextMaxHp, Math.floor(unit.currentHp * hpMultiplier));
  return {
    ...unit,
    atk: Math.floor(unit.atk * attackMultiplier),
    maxHp: nextMaxHp,
    currentHp: nextHp,
  };
}

export function getDamageReductionPct(unit: Pick<Unit, 'id'>): number {
  return getPassive(unit.id).damageReductionPct ?? 0;
}

export function getSkillPowerMultiplier(unit: Pick<Unit, 'id'>): number {
  return 1 + (getPassive(unit.id).skillPowerPct ?? 0) / 100;
}

export function getPassiveRageGain(unit: Pick<Unit, 'id'>): number {
  return getPassive(unit.id).rageGain ?? 0;
}
