import type { Terrain, Unit } from '../types';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../data/constants';

export { BOARD_WIDTH, BOARD_HEIGHT };

export const TERRAIN_COST: Record<Terrain, number> = {
  plain: 1,
  forest: 2,
  hill: 2,
  water: 2,
  fort: 1,
};

/** Target-tile defense modifier. Positive values reduce incoming damage. */
export const TERRAIN_DEFENSE_BONUS: Record<Terrain, number> = {
  plain: 0,
  forest: 4,
  hill: 2,
  water: -2,
  fort: 8,
};

export const TERRAIN_EFFECT_TEXT: Record<Terrain, string> = {
  plain: '이동 1 · 방어 보정 없음',
  forest: '이동 2 · 방어 +4',
  hill: '이동 2 · 방어 +2',
  water: '이동 2 · 방어 -2',
  fort: '이동 1 · 방어 +8',
};

export type BattleAction = 'move' | 'attack' | 'skill' | 'wait';

export type ReachableCell = {
  x: number;
  y: number;
  cost: number;
};

const key = (x: number, y: number) => `${x},${y}`;

/** Fixed 10×10 field movement. Terrain cost and occupied cells are respected. */
export function getReachableCells(
  unit: Pick<Unit, 'x' | 'y' | 'movePoints'>,
  terrain: Terrain[],
  occupied: Set<string> = new Set(),
): ReachableCell[] {
  const result: ReachableCell[] = [];
  const best = new Map<string, number>([[key(unit.x, unit.y), 0]]);
  const queue: ReachableCell[] = [{ x: unit.x, y: unit.y, cost: 0 }];

  while (queue.length) {
    const current = queue.shift()!;
    const neighbors = [
      [current.x + 1, current.y],
      [current.x - 1, current.y],
      [current.x, current.y + 1],
      [current.x, current.y - 1],
    ];

    for (const [x, y] of neighbors) {
      if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) continue;
      if (occupied.has(key(x, y)) && !(x === unit.x && y === unit.y)) continue;

      const terrainType = terrain[y * BOARD_WIDTH + x];
      if (!terrainType) continue;
      const nextCost = current.cost + TERRAIN_COST[terrainType];
      if (nextCost > unit.movePoints) continue;

      const cellKey = key(x, y);
      const previous = best.get(cellKey);
      if (previous !== undefined && previous <= nextCost) continue;

      best.set(cellKey, nextCost);
      queue.push({ x, y, cost: nextCost });
    }
  }

  for (const [cellKey, cost] of best) {
    const [x, y] = cellKey.split(',').map(Number);
    if (x === unit.x && y === unit.y) continue;
    result.push({ x, y, cost });
  }

  return result.sort((a, b) => a.cost - b.cost || a.y - b.y || a.x - b.x);
}

export function getMovementPath(
  unit: Pick<Unit, 'x' | 'y' | 'movePoints'>,
  terrain: Terrain[],
  occupied: Set<string> = new Set(),
  destination: { x: number; y: number },
): Array<{ x: number; y: number }> {
  const start = key(unit.x, unit.y);
  const goal = key(destination.x, destination.y);
  if (start === goal) return [];
  const best = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const open: ReachableCell[] = [{ x: unit.x, y: unit.y, cost: 0 }];

  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const current = open.shift()!;
    const currentKey = key(current.x, current.y);
    if (currentKey === goal) break;
    if (current.cost !== best.get(currentKey)) continue;

    const neighbors = [
      [current.x + 1, current.y],
      [current.x - 1, current.y],
      [current.x, current.y + 1],
      [current.x, current.y - 1],
    ];

    for (const [x, y] of neighbors) {
      if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) continue;
      if (occupied.has(key(x, y)) && !(x === unit.x && y === unit.y)) continue;
      const terrainType = terrain[y * BOARD_WIDTH + x];
      if (!terrainType) continue;
      const nextCost = current.cost + TERRAIN_COST[terrainType];
      if (nextCost > unit.movePoints) continue;
      const nextKey = key(x, y);
      if ((best.get(nextKey) ?? Number.POSITIVE_INFINITY) <= nextCost) continue;
      best.set(nextKey, nextCost);
      previous.set(nextKey, currentKey);
      open.push({ x, y, cost: nextCost });
    }
  }

  if (!best.has(goal)) return [];
  const path: Array<{ x: number; y: number }> = [];
  let cursor = goal;
  while (cursor !== start) {
    const [x, y] = cursor.split(',').map(Number);
    path.push({ x, y });
    const prev = previous.get(cursor);
    if (!prev) return [];
    cursor = prev;
  }
  return path.reverse();
}

export function isInRange(a: Pick<Unit, 'x' | 'y'>, b: Pick<Unit, 'x' | 'y'>, range: number): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= range;
}

export function canTargetEnemy(
  attacker: Pick<Unit, 'team' | 'x' | 'y' | 'range' | 'acted' | 'currentHp'>,
  target: Pick<Unit, 'team' | 'x' | 'y' | 'currentHp'>,
): boolean {
  return attacker.team === 'player'
    && target.team === 'enemy'
    && attacker.currentHp > 0
    && target.currentHp > 0
    && !attacker.acted
    && isInRange(attacker, target, attacker.range);
}

const ROLE_DEFENSE_BONUS: Record<string, number> = {
  '수호': 8,
  '전사': 5,
  '기병': 3,
  '지원': 2,
  '책사': 1,
};

export function getEffectiveDefense(unit: Pick<Unit, 'defense' | 'role' | 'status'>): number {
  const roleBonus = ROLE_DEFENSE_BONUS[unit.role] ?? 2;
  const guardBonus = unit.status === 'guard' ? 8 : 0;
  return Math.max(0, unit.defense + roleBonus + guardBonus);
}

export function calculateDamage(
  attacker: Pick<Unit, 'atk' | 'buff' | 'critChance'>,
  defender: Pick<Unit, 'defense' | 'role' | 'status'>,
  terrainType: Terrain,
  power = 0,
): number {
  const terrainDefense = TERRAIN_DEFENSE_BONUS[terrainType] ?? 0;
  const defense = Math.max(0, getEffectiveDefense(defender) + terrainDefense);
  return Math.max(
    1,
    attacker.atk + attacker.buff + power - defense,
  );
}

export function isBattleOver(units: Unit[]): 'player' | 'enemy' | null {
  const playersAlive = units.some((unit) => unit.team === 'player' && unit.currentHp > 0);
  const enemiesAlive = units.some((unit) => unit.team === 'enemy' && unit.currentHp > 0);
  if (!playersAlive) return 'enemy';
  if (!enemiesAlive) return 'player';
  return null;
}
