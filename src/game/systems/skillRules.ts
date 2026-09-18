import type { Terrain, Unit } from '../types';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../data/constants';
import { calculateDamage, isInRange } from './battleRules';
import { applyBattleDamageReduction, getBattleSkillPowerMultiplier } from './battleModifiers';

export type SkillResult = { units: Unit[]; message: string; success: boolean };
const aliveEnemies = (units: Unit[]) => units.filter((u) => u.team === 'enemy' && u.currentHp > 0);
const alivePlayers = (units: Unit[]) => units.filter((u) => u.team === 'player' && u.currentHp > 0);
const allPlayers = (units: Unit[]) => units.filter((u) => u.team === 'player');
const adjacentEnemies = (caster: Unit, units: Unit[]) => aliveEnemies(units).filter((u) => Math.abs(u.x - caster.x) + Math.abs(u.y - caster.y) <= 1);

export type SkillAvailability = { ready: boolean; needsTarget: boolean; targetIds: string[]; message: string };

export function getGeneralSkillTargetIds(units: Unit[], casterId: string, terrain: Terrain[] = []): string[] {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster || caster.acted || (caster.status === 'stun' && caster.statusTurns > 0)) return [];
  const enemies = aliveEnemies(units);
  const name = caster.skill;
  if (name === '인덕의 격려' || name === '강동의 결의' || name === '간웅의 명령') return [];
  if (name === '맹격' || name === '호통') return adjacentEnemies(caster, enemies).map((u) => u.id);
  if (name === '용진') return enemies.filter((u) => isInRange(caster, u, caster.range) && (u.x === caster.x || u.y === caster.y)).filter((u) => {
    const dx = Math.sign(u.x - caster.x), dy = Math.sign(u.y - caster.y);
    const distance = Math.abs(u.x - caster.x) + Math.abs(u.y - caster.y);
    if (distance === 0 || !terrain.length) return distance > 0;
    for (let step = 1; step <= distance; step += 1) {
      const x = caster.x + dx * step, y = caster.y + dy * step;
      if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || !terrain[y * BOARD_WIDTH + x]) return false;
    }
    return true;
  }).map((u) => u.id);
  return enemies.filter((u) => isInRange(caster, u, caster.range)).map((u) => u.id);
}

export function getGeneralSkillAvailability(units: Unit[], casterId: string, terrain: Terrain[] = []): SkillAvailability {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster) return { ready: false, needsTarget: true, targetIds: [], message: '사용할 장수를 선택하세요.' };
  if (caster.acted) return { ready: false, needsTarget: true, targetIds: [], message: '이미 행동한 장수입니다.' };
  if (caster.status === 'stun' && caster.statusTurns > 0) return { ready: false, needsTarget: true, targetIds: [], message: '기절 상태라 스킬을 사용할 수 없습니다.' };
  const name = caster.skill;
  if (name === '인덕의 격려' || name === '강동의 결의' || name === '간웅의 명령') return { ready: true, needsTarget: false, targetIds: [], message: '즉시 사용할 수 있습니다.' };
  const targetIds = getGeneralSkillTargetIds(units, casterId, terrain);
  if (!targetIds.length) return { ready: false, needsTarget: name !== '맹격' && name !== '호통', targetIds, message: name === '맹격' || name === '호통' ? '인접한 적이 필요합니다.' : name === '용진' ? '사거리 내 직선 방향의 적이 필요합니다.' : '사거리 내 적이 필요합니다.' };
  if (name === '맹격' || name === '호통') return { ready: true, needsTarget: false, targetIds, message: '인접한 적에게 사용할 수 있습니다.' };
  return { ready: true, needsTarget: true, targetIds, message: '대상을 선택하세요.' };
}

export function resolveGeneralSkill(units: Unit[], casterId: string, targetId: string | null, terrain: Terrain[]): SkillResult {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster || caster.acted || (caster.status === 'stun' && caster.statusTurns > 0)) return { units, message: '스킬을 사용할 수 없습니다.', success: false };
  const target = targetId ? units.find((u) => u.id === targetId && u.team === 'enemy' && u.currentHp > 0) : undefined;
  const name = caster.skill;
  const skillPower = Math.floor(caster.skillPower * getBattleSkillPowerMultiplier(caster, allPlayers(units)));
  let next = units.map((u) => ({ ...u }));
  let message = `${caster.name}의 ${name}`;
  const finish = (): SkillResult => ({ units: next.map((u) => u.id === caster.id ? { ...u, acted: true } : u), message, success: true });

  if (name === '인덕의 격려') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0 ? { ...u, buff: u.buff + 8, status: 'guard', statusTurns: 2 } : u);
    message += ' · 아군 전체 공격 강화 + 가드(2턴)'; return finish();
  }
  if (name === '강동의 결의') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0 ? { ...u, buff: u.buff + 5, currentHp: Math.min(u.maxHp, u.currentHp + 12), status: 'guard', statusTurns: 2 } : u);
    message += ' · 아군 전체 회복 + 방어(2턴)'; return finish();
  }
  if (name === '간웅의 명령') {
    next = next.map((u) => u.team === 'enemy' && u.currentHp > 0 ? { ...u, status: 'slow', statusTurns: 2 } : u);
    message += ' · 적 전체 둔화(2턴)'; return finish();
  }
  if (name === '맹격' || name === '호통') {
    const targets = adjacentEnemies(caster, next);
    if (!targets.length) return { units, message: '인접한 적이 필요합니다.', success: false };
    next = next.map((u) => {
      const hit = targets.find((t) => t.id === u.id); if (!hit) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x]; if (!tile) return u;
      const rawDamage = calculateDamage(caster, hit, tile, skillPower);
      const damage = applyBattleDamageReduction(hit, rawDamage);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: name === '호통' ? 'stun' : u.status, statusTurns: name === '호통' ? 2 : u.statusTurns };
    });
    message += ` · ${targets.length}명 타격`; return finish();
  }
  if (name === '청룡참') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    const tile = terrain[target.y * BOARD_WIDTH + target.x]; if (!tile) return { units, message: '전장 지형 정보를 찾을 수 없습니다.', success: false };
    const rawDamage = calculateDamage(caster, target, tile, skillPower);
    const damage = applyBattleDamageReduction(target, rawDamage);
    next = next.map((u) => u.id === target.id ? { ...u, currentHp: Math.max(0, u.currentHp - damage), status: 'burn', statusTurns: 2 } : u);
    message += ` · ${target.name} ${damage} 피해 + 화상`; return finish();
  }
  if (name === '용진') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상을 지정해야 합니다.', success: false };
    const dx = Math.sign(target.x - caster.x);
    const dy = Math.sign(target.y - caster.y);
    if (dx !== 0 && dy !== 0) return { units, message: '용진은 가로 또는 세로 직선 방향의 적만 지정할 수 있습니다.', success: false };
    const distance = Math.abs(target.x - caster.x) + Math.abs(target.y - caster.y);
    if (distance === 0) return { units, message: '자신을 대상으로 할 수 없습니다.', success: false };

    const path: Array<{ x: number; y: number }> = [];
    for (let step = 1; step <= distance; step += 1) {
      const x = caster.x + dx * step;
      const y = caster.y + dy * step;
      if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) break;
      path.push({ x, y });
    }
    if (path.length !== distance) return { units, message: '돌진 경로가 전장을 벗어납니다.', success: false };

    let landing: { x: number; y: number } | null = null;
    for (let step = distance + 1; ; step += 1) {
      const x = caster.x + dx * step;
      const y = caster.y + dy * step;
      if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) break;
      const occupant = next.find((u) => u.currentHp > 0 && u.x === x && u.y === y && u.id !== caster.id);
      if (!occupant) {
        landing = { x, y };
        break;
      }
      if (occupant.team === 'enemy') {
        path.push({ x, y });
        continue;
      }
      break;
    }

    const pathKeys = new Set(path.map(({ x, y }) => `${x},${y}`));
    const hitEnemies = aliveEnemies(next).filter((u) => pathKeys.has(`${u.x},${u.y}`));
    if (!hitEnemies.length) return { units, message: '돌진 경로에 적이 필요합니다.', success: false };

    next = next.map((u) => {
      if (!pathKeys.has(`${u.x},${u.y}`) || u.team !== 'enemy' || u.currentHp <= 0) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x]; if (!tile) return u;
      const rawDamage = calculateDamage(caster, u, tile, skillPower);
      const damage = applyBattleDamageReduction(u, rawDamage);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage) };
    });

    if (landing) next = next.map((u) => u.id === caster.id ? { ...u, x: landing!.x, y: landing!.y } : u);
    const landingText = landing ? ` · ${landing.x + 1},${landing.y + 1}칸 착지` : ' · 착지 가능한 칸 없음';
    message += ` · 직선 ${path.length}칸 관통 · ${hitEnemies.length}명 타격${landingText}`;
    return finish();
  }
  if (name === '천뢰') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    const targets = aliveEnemies(next).filter((u) => Math.abs(u.x-target.x)+Math.abs(u.y-target.y)<=1);
    next = next.map((u) => {
      const hit = targets.find((t) => t.id === u.id); if (!hit) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x]; if (!tile) return u;
      const rawDamage = calculateDamage(caster, hit, tile, skillPower);
      const damage = applyBattleDamageReduction(hit, rawDamage);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: 'stun', statusTurns: 2 };
    });
    message += ` · 번개 범위 ${targets.length}명`; return finish();
  }
  if (name === '매혹') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    next = next.map((u) => u.id === target.id ? { ...u, status: 'stun', statusTurns: 2 } : u);
    message += ` · ${target.name} 행동 봉쇄(2턴)`; return finish();
  }
  if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
  const targetTerrain = terrain[target.y * BOARD_WIDTH + target.x]; if (!targetTerrain) return { units, message: '대상 지형 정보를 찾을 수 없습니다.', success: false };
  const rawDamage = calculateDamage(caster, target, targetTerrain, skillPower);
  const damage = applyBattleDamageReduction(target, rawDamage);
  next = next.map((u) => u.id === target.id ? { ...u, currentHp: Math.max(0, u.currentHp - damage) } : u);
  message += ` · ${target.name} ${damage} 피해`; return finish();
}

export function getBattleOutcome(units: Unit[]): 'player' | 'enemy' | null {
  if (!alivePlayers(units).length) return 'enemy';
  if (!aliveEnemies(units).length) return 'player';
  return null;
}
