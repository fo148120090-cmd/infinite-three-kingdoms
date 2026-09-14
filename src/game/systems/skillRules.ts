import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH } from '../data/constants';
import { calculateDamage, isInRange } from './battleRules';

export type SkillResult = {
  units: Unit[];
  message: string;
  success: boolean;
};

const aliveEnemies = (units: Unit[]) => units.filter((u) => u.team === 'enemy' && u.currentHp > 0);
const alivePlayers = (units: Unit[]) => units.filter((u) => u.team === 'player' && u.currentHp > 0);
const adjacentEnemies = (caster: Unit, units: Unit[]) => aliveEnemies(units).filter((u) => Math.abs(u.x - caster.x) + Math.abs(u.y - caster.y) <= 1);
const nearestEnemy = (caster: Unit, units: Unit[]) => aliveEnemies(units).sort((a, b) => Math.abs(a.x - caster.x) + Math.abs(a.y - caster.y) - (Math.abs(b.x - caster.x) + Math.abs(b.y - caster.y)))[0];

export function resolveGeneralSkill(units: Unit[], casterId: string, targetId: string | null, terrain: Terrain[]): SkillResult {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster || caster.acted) return { units, message: '스킬을 사용할 수 없습니다.', success: false };

  const target = targetId ? units.find((u) => u.id === targetId && u.team === 'enemy' && u.currentHp > 0) : undefined;
  const name = caster.skill;
  let next = units.map((u) => ({ ...u }));
  let message = `${caster.name}의 ${name}`;
  const finish = (): SkillResult => ({ units: next.map((u) => u.id === caster.id ? { ...u, acted: true } : u), message, success: true });

  if (name === '인덕의 격려' || name === '강동의 결의') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0 ? { ...u, buff: u.buff + (u.id === caster.id ? 3 : 8), status: 'guard', statusTurns: 1 } : u);
    message += ' · 아군 전체 강화';
    return finish();
  }

  if (name === '간웅의 명령') {
    next = next.map((u) => u.team === 'enemy' && u.currentHp > 0 ? { ...u, status: 'slow', statusTurns: 1 } : u);
    message += ' · 적 전체 둔화';
    return finish();
  }

  if (name === '맹격' || name === '호통') {
    const targets = adjacentEnemies(caster, next);
    if (!targets.length) return { units, message: '인접한 적이 필요합니다.', success: false };
    next = next.map((u) => {
      const hit = targets.find((t) => t.id === u.id);
      if (!hit) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x];
      if (!tile) return u;
      const damage = calculateDamage(caster, hit, tile, caster.skillPower);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: name === '호통' ? 'stun' : u.status, statusTurns: name === '호통' ? 1 : u.statusTurns };
    });
    message += ` · ${targets.length}명 타격`;
    return finish();
  }

  if (name === '용진') {
    const enemy = nearestEnemy(caster, next);
    if (!enemy || !isInRange(caster, enemy, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    const tile = terrain[enemy.y * BOARD_WIDTH + enemy.x];
    if (!tile) return { units, message: '전장 지형 정보를 찾을 수 없습니다.', success: false };
    const damage = calculateDamage(caster, enemy, tile, caster.skillPower);
    next = next.map((u) => u.id === enemy.id ? { ...u, currentHp: Math.max(0, u.currentHp - damage) } : u);
    const stepX = Math.sign(enemy.x - caster.x);
    const stepY = Math.sign(enemy.y - caster.y);
    const destination = { x: caster.x + stepX, y: caster.y + stepY };
    const occupied = next.some((u) => u.id !== caster.id && u.currentHp > 0 && u.x === destination.x && u.y === destination.y);
    next = next.map((u) => u.id === caster.id && !occupied ? { ...u, x: Math.max(0, Math.min(9, destination.x)), y: Math.max(0, Math.min(9, destination.y)) } : u);
    message += ` · 돌진 ${damage} 피해`;
    return finish();
  }

  if (name === '천뢰') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    const targets = aliveEnemies(next).filter((u) => Math.abs(u.x - target.x) + Math.abs(u.y - target.y) <= 1);
    next = next.map((u) => {
      const hit = targets.find((t) => t.id === u.id);
      if (!hit) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x];
      if (!tile) return u;
      const damage = calculateDamage(caster, hit, tile, caster.skillPower);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: 'stun', statusTurns: 1 };
    });
    message += ` · 번개 범위 ${targets.length}명`;
    return finish();
  }

  if (name === '매혹') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    next = next.map((u) => u.id === target.id ? { ...u, status: 'stun', statusTurns: 1 } : u);
    message += ` · ${target.name} 행동 봉쇄`;
    return finish();
  }

  if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
  const targetTerrain = terrain[target.y * BOARD_WIDTH + target.x];
  if (!targetTerrain) return { units, message: '대상 지형 정보를 찾을 수 없습니다.', success: false };
  const damage = calculateDamage(caster, target, targetTerrain, caster.skillPower);
  next = next.map((u) => u.id === target.id ? { ...u, currentHp: Math.max(0, u.currentHp - damage) } : u);
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
