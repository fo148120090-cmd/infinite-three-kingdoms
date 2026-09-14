import type { Unit } from '../types';
import { getManhattanDistance, isInRange } from './movement';

export type EnemyAction =
  | { type: 'attack'; targetId: string }
  | { type: 'move'; x: number; y: number }
  | { type: 'wait' };

export function chooseEnemyAction(enemy: Unit, players: Unit[]): EnemyAction {
  const living = players.filter(p => p.currentHp > 0);
  if (!living.length) return { type: 'wait' };

  const target = [...living].sort((a, b) => getManhattanDistance(enemy, a) - getManhattanDistance(enemy, b))[0];
  if (isInRange(enemy, target)) return { type: 'attack', targetId: target.id };

  const dx = Math.sign(target.x - enemy.x);
  const dy = Math.sign(target.y - enemy.y);
  const candidates = [
    { x: enemy.x + dx, y: enemy.y },
    { x: enemy.x, y: enemy.y + dy },
  ];
  const move = candidates.find(p => p.x >= 0 && p.x < 7 && p.y >= 0 && p.y < 6);
  return move ? { type: 'move', ...move } : { type: 'wait' };
}
