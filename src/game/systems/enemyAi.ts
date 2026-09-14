import type { Terrain, Unit } from '../types';
import { getReachableCells, isInRange, calculateDamage, BOARD_WIDTH } from './battleRules';

export type EnemyTurnResult = {
  units: Unit[];
  messages: string[];
};

const distance = (a: Unit, b: Unit) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function nearestPlayer(enemy: Unit, units: Unit[]): Unit | undefined {
  return units
    .filter((u) => u.team === 'player' && u.currentHp > 0)
    .sort((a, b) => distance(enemy, a) - distance(enemy, b) || a.currentHp - b.currentHp)[0];
}

/**
 * Resolves one monster turn using simple role-aware priorities.
 * No auto-battle toggle is exposed to the player; this is only the enemy AI.
 */
export function resolveEnemyTurn(units: Unit[], terrain: Terrain[]): EnemyTurnResult {
  const next = units.map((u) => ({ ...u }));
  const messages: string[] = [];

  for (const enemy of next.filter((u) => u.team === 'enemy' && u.currentHp > 0)) {
    const target = nearestPlayer(enemy, next);
    if (!target) break;

    if (isInRange(enemy, target, enemy.range)) {
      const tile = terrain[target.y * BOARD_WIDTH + target.x];
      const damage = calculateDamage(enemy, target, tile, 0);
      target.currentHp = Math.max(0, target.currentHp - damage);
      messages.push(`${enemy.name} → ${target.name} ${damage} 피해`);
      continue;
    }

    const occupied = new Set(next.filter((u) => u.currentHp > 0 && u.id !== enemy.id).map((u) => `${u.x},${u.y}`));
    const reachable = getReachableCells(enemy, terrain, occupied);
    reachable.sort((a, b) => {
      const da = Math.abs(a.x - target.x) + Math.abs(a.y - target.y);
      const db = Math.abs(b.x - target.x) + Math.abs(b.y - target.y);
      return da - db || a.cost - b.cost;
    });

    const destination = reachable[0];
    if (destination) {
      enemy.x = destination.x;
      enemy.y = destination.y;
      if (isInRange(enemy, target, enemy.range)) {
        const tile = terrain[target.y * BOARD_WIDTH + target.x];
        const damage = calculateDamage(enemy, target, tile, 0);
        target.currentHp = Math.max(0, target.currentHp - damage);
        messages.push(`${enemy.name} 이동 후 공격 → ${target.name} ${damage} 피해`);
      }
    }
  }

  return { units: next, messages };
}
