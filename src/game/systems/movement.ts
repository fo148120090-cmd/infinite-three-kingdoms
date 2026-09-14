import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../data/constants';

export const TERRAIN_COST: Record<Terrain, number> = {
  plain: 1,
  forest: 2,
  hill: 1,
  water: 99,
  fort: 1,
};

export function isInsideBoard(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

export function getMovementCost(terrain: Terrain): number {
  return TERRAIN_COST[terrain];
}

export function canEnterTerrain(terrain: Terrain): boolean {
  return TERRAIN_COST[terrain] < 99;
}

export function getManhattanDistance(a: Pick<Unit, 'x' | 'y'>, b: Pick<Unit, 'x' | 'y'>): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isInRange(attacker: Pick<Unit, 'x' | 'y' | 'range'>, target: Pick<Unit, 'x' | 'y'>): boolean {
  return getManhattanDistance(attacker, target) <= attacker.range;
}

export function getReachableCells(
  unit: Pick<Unit, 'x' | 'y' | 'movePoints'>,
  terrainAt: (x: number, y: number) => Terrain,
  occupied: (x: number, y: number) => boolean,
): Array<{ x: number; y: number; cost: number }> {
  const result: Array<{ x: number; y: number; cost: number }> = [];
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  const best = new Map<string, number>([[`${unit.x},${unit.y}`, 0]]);
  const directions = [[1,0],[-1,0],[0,1],[0,-1]];

  while (queue.length) {
    const current = queue.shift()!;
    for (const [dx, dy] of directions) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (!isInsideBoard(x, y) || occupied(x, y)) continue;
      const terrain = terrainAt(x, y);
      if (!canEnterTerrain(terrain)) continue;
      const cost = current.cost + getMovementCost(terrain);
      if (cost > unit.movePoints) continue;
      const key = `${x},${y}`;
      const previous = best.get(key);
      if (previous !== undefined && previous <= cost) continue;
      best.set(key, cost);
      queue.push({ x, y, cost });
      result.push({ x, y, cost });
    }
  }
  return result;
}
