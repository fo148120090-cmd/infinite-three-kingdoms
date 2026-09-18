import type { Terrain, Unit } from '../types';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../data/constants';

export { BOARD_WIDTH, BOARD_HEIGHT };

export const TERRAIN_COST: Record<Terrain, number> = {
  plain: 1,
  forest: 1,
  hill: 1,
  water: 1,
  fort: 1,
};

export const TERRAIN_ATTACK_BONUS: Record<Terrain, number> = {
  plain: 0,
  forest: 0,
  hill: 0,
  water: 0,
  fort: 0,
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
  attacker: Pick<Unit, 'atk' | 'buff'>,
  defender: Pick<Unit, 'defense' | 'role' | 'status'>,
  _terrainType: Terrain,
  power = 0,
): number {
  const terrainBonus = 0;
  const defense = getEffectiveDefense(defender);
  return Math.max(
    1,
    attacker.atk + attacker.buff + power + terrainBonus - defense,
  );
}

export function isBattleOver(units: Unit[]): 'player' | 'enemy' | null {
  const playersAlive = units.some((unit) => unit.team === 'player' && unit.currentHp > 0);
  const enemiesAlive = units.some((unit) => unit.team === 'enemy' && unit.currentHp > 0);
  if (!playersAlive) return 'enemy';
  if (!enemiesAlive) return 'player';
  return null;
}
