import type { Unit } from '../types';
import { calculateDamage, isInRange } from './battleRules';

export type SkillResult = {
  units: Unit[];
  message: string;
  success: boolean;
};

const aliveEnemies = (units: Unit) => units.filter((u) => u.team === 'enemy' && u.currentHp > 0);
const alivePlayers = (units: Unit) => units.filter((u) => u.team === 'player' && u.currentHp > 0);

/**
 * Resolves a general's unique skill without introducing an ultimate system.
 * Skills consume the unit's action and always remain deterministic from the
 * current board state, which keeps the battle suitable for manual SRPG play.
 */
export function resolveGeneralSkill(units: Unit[], casterId: string, targetId: string | null, terrain: Unit extends never ? never : any[]): SkillResult {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster || caster.acted) return { units, message: '스킬을 사용할 수 없습니다.', success: false };

  const target = targetId ? units.find((u) => u.id === targetId && u.team === 'enemy' && u.currentHp > 0) : undefined;
  const name = caster.skill;
  let next = units.map((u) => ({ ...u }));
  let message = `${caster.name}의 ${name}`;

  const finish = (ok = true): SkillResult => ({
    units: next.map((u) => u.id === caster.id ? { ...u, acted: ok ? true : u.acted } : u),
    message,
    success: ok,
  });

  if (name === '인덕의 격려' || name === '강동의 결의') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0
      ? { ...u, buff: u.buff + (u.id === caster.id ? 3 : 8), status: 'guard', statusTurns: 1 }
      : u);
    return finish();
  }

  if (name === '간웅의 명령') {
    next = next.map((u) => u.team === 'enemy' && u.currentHp > 0
      ? { ...u, atk: Math.max(1, u.atk - 6), status: 'slow', statusTurns: 1 }
      : u);
    message += ' · 적 전체 약화';
    return finish();
  }

  if (!target || !isInRange(caster, target, caster.range)) {
    return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
  }

  const targetTerrain = terrain[target.y * 7 + target.x];
  const damage = calculateDamage(caster, target, targetTerrain, caster.skillPower);
  next = next.map((u) => u.id === target.id
    ? { ...u, currentHp: Math.max(0, u.currentHp - damage) }
    : u);
  message += ` · ${target.name} ${damage} 피해`;
  return finish();
}

export function getBattleOutcome(units: Unit[]): 'player' | 'enemy' | null {
  const players = alivePlayers(units);
  const enemies = aliveEnemies(units);
  if (!players.length) return 'enemy';
  if (!enemies.length) return 'player';
  return null;
}
