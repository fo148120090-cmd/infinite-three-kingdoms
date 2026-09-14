import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../data/constants';
import { calculateDamage, isInRange } from './battleRules';

export type SkillResult = { units: Unit[]; message: string; success: boolean };
const aliveEnemies = (units: Unit[]) => units.filter((u) => u.team === 'enemy' && u.currentHp > 0);
const alivePlayers = (units: Unit[]) => units.filter((u) => u.team === 'player' && u.currentHp > 0);
const adjacentEnemies = (caster: Unit, units: Unit[]) => aliveEnemies(units).filter((u) => Math.abs(u.x - caster.x) + Math.abs(u.y - caster.y) <= 1);

export function resolveGeneralSkill(units: Unit[], casterId: string, targetId: string | null, terrain: Terrain[]): SkillResult {
  const caster = units.find((u) => u.id === casterId && u.team === 'player' && u.currentHp > 0);
  if (!caster || caster.acted) return { units, message: '스킬을 사용할 수 없습니다.', success: false };
  const target = targetId ? units.find((u) => u.id === targetId && u.team === 'enemy' && u.currentHp > 0) : undefined;
  const name = caster.skill;
  let next = units.map((u) => ({ ...u }));
  let message = `${caster.name}의 ${name}`;
  const finish = (): SkillResult => ({ units: next.map((u) => u.id === caster.id ? { ...u, acted: true } : u), message, success: true });

  if (name === '인덕의 격려') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0 ? { ...u, buff: u.buff + 8, status: 'guard', statusTurns: 1 } : u);
    message += ' · 아군 전체 공격 강화 + 가드'; return finish();
  }
  if (name === '강동의 결의') {
    next = next.map((u) => u.team === 'player' && u.currentHp > 0 ? { ...u, buff: u.buff + 5, currentHp: Math.min(u.maxHp, u.currentHp + 12), status: 'guard', statusTurns: 1 } : u);
    message += ' · 아군 전체 회복 + 방어'; return finish();
  }
  if (name === '간웅의 명령') {
    next = next.map((u) => u.team === 'enemy' && u.currentHp > 0 ? { ...u, status: 'slow', statusTurns: 1 } : u);
    message += ' · 적 전체 둔화'; return finish();
  }
  if (name === '맹격' || name === '호통') {
    const targets = adjacentEnemies(caster, next);
    if (!targets.length) return { units, message: '인접한 적이 필요합니다.', success: false };
    next = next.map((u) => {
      const hit = targets.find((t) => t.id === u.id); if (!hit) return u;
      const tile = terrain[u.y * BOARD_WIDTH + u.x]; if (!tile) return u;
      const damage = calculateDamage(caster, hit, tile, caster.skillPower);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: name === '호통' ? 'stun' : u.status, statusTurns: name === '호통' ? 1 : u.statusTurns };
    });
    message += ` · ${targets.length}명 타격`; return finish();
  }
  if (name === '청룡참') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    const tile = terrain[target.y * BOARD_WIDTH + target.x]; if (!tile) return { units, message: '전장 지형 정보를 찾을 수 없습니다.', success: false };
    const damage = calculateDamage(caster, target, tile, caster.skillPower);
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

    // 목표 적 칸은 관통하고, 뒤에 연속 배치된 생존 적이 있으면 계속 타격한다.
    // 최초의 빈 칸에 도달하면 그 칸에 착지하며, 아군 칸에는 절대 겹치지 않는다.
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
      const damage = calculateDamage(caster, u, tile, caster.skillPower);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage) };
    });

    if (landing) {
      next = next.map((u) => u.id === caster.id ? { ...u, x: landing!.x, y: landing!.y } : u);
    }
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
      const damage = calculateDamage(caster, hit, tile, caster.skillPower);
      return { ...u, currentHp: Math.max(0, u.currentHp - damage), status: 'stun', statusTurns: 1 };
    });
    message += ` · 번개 범위 ${targets.length}명`; return finish();
  }
  if (name === '매혹') {
    if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
    next = next.map((u) => u.id === target.id ? { ...u, status: 'stun', statusTurns: 1 } : u);
    message += ` · ${target.name} 행동 봉쇄`; return finish();
  }
  if (!target || !isInRange(caster, target, caster.range)) return { units, message: '사거리 내 적 대상이 필요합니다.', success: false };
  const targetTerrain = terrain[target.y * BOARD_WIDTH + target.x]; if (!targetTerrain) return { units, message: '대상 지형 정보를 찾을 수 없습니다.', success: false };
  const damage = calculateDamage(caster, target, targetTerrain, caster.skillPower);
  next = next.map((u) => u.id === target.id ? { ...u, currentHp: Math.max(0, u.currentHp - damage) } : u);
  message += ` · ${target.name} ${damage} 피해`; return finish();
}

export function getBattleOutcome(units: Unit[]): 'player' | 'enemy' | null {
  if (!alivePlayers(units).length) return 'enemy';
  if (!aliveEnemies(units).length) return 'player';
  return null;
}
