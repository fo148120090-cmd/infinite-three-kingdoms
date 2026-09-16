import type { Terrain, Unit } from '../types';
import { getReachableCells, isInRange, calculateDamage, BOARD_WIDTH } from './battleRules';
import { applyBattleDamageReduction } from './battleModifiers';
import { useMonsterSkill } from './monsterSkillRules';

export type EnemyTurnResult = { units: Unit[]; messages: string[] };
const distance = (a: Unit, b: Unit) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const livingPlayers = (units: Unit[]) => units.filter((u) => u.team === 'player' && u.currentHp > 0);

function chooseTarget(enemy: Unit, units: Unit[]): Unit | undefined {
  const players = livingPlayers(units);
  if (!players.length) return undefined;
  if (enemy.role === 'assassin') return [...players].sort((a, b) => a.currentHp - b.currentHp || distance(enemy, a) - distance(enemy, b))[0];
  return [...players].sort((a, b) => distance(enemy, a) - distance(enemy, b) || a.currentHp - b.currentHp)[0];
}

function attack(enemy: Unit, target: Unit, terrain: Terrain[], messages: string[]) {
  const tile = terrain[target.y * BOARD_WIDTH + target.x];
  if (!tile) return;
  const rawDamage = calculateDamage(enemy, target, tile, 0);
  const damage = applyBattleDamageReduction(target, rawDamage);
  target.currentHp = Math.max(0, target.currentHp - damage);
  messages.push(`${enemy.name} → ${target.name} ${damage} 피해`);
}

function rangedDestination(target: Unit, reachable: ReturnType<typeof getReachableCells>, range: number) {
  return [...reachable].sort((a, b) => {
    const da = Math.abs(a.x - target.x) + Math.abs(a.y - target.y);
    const db = Math.abs(b.x - target.x) + Math.abs(b.y - target.y);
    return Math.abs(da - range) - Math.abs(db - range) || a.cost - b.cost;
  })[0];
}

export function resolveEnemyTurn(units: Unit[], terrain: Terrain[], turn = 0): EnemyTurnResult {
  const next = units.map((u) => ({ ...u }));
  const messages: string[] = [];

  for (const enemy of next.filter((u) => u.team === 'enemy' && u.currentHp > 0)) {
    if (enemy.status === 'stun' && enemy.statusTurns > 0) {
      messages.push(`${enemy.name} 기절로 행동 불가`);
      continue;
    }
    const target = chooseTarget(enemy, next);
    if (!target) break;
    const occupied = new Set(next.filter((u) => u.currentHp > 0 && u.id !== enemy.id).map((u) => `${u.x},${u.y}`));
    const movePoints = enemy.status === 'slow' && enemy.statusTurns > 0 ? Math.max(1, Math.floor(enemy.move * 0.5)) : enemy.move;
    const moveUnit = { ...enemy, movePoints };

    if (isInRange(enemy, target, enemy.range)) {
      const skill = useMonsterSkill(enemy, target, next, terrain, turn);
      if (skill.used) {
        messages.push(skill.message);
        continue;
      }
      attack(enemy, target, terrain, messages);
      continue;
    }

    const reachable = getReachableCells(moveUnit, terrain, occupied);
    let destination;
    if (enemy.role === 'ranged' || enemy.role === 'caster') destination = rangedDestination(target, reachable, enemy.range);
    else {
      reachable.sort((a, b) => {
        const da = Math.abs(a.x - target.x) + Math.abs(a.y - target.y);
        const db = Math.abs(b.x - target.x) + Math.abs(b.y - target.y);
        return da - db || a.cost - b.cost;
      });
      destination = reachable[0];
    }
    if (!destination) continue;
    enemy.x = destination.x;
    enemy.y = destination.y;

    const skill = useMonsterSkill(enemy, target, next, terrain, turn);
    if (skill.used) messages.push(skill.message);
    else if (isInRange(enemy, target, enemy.range)) attack(enemy, target, terrain, messages);
    else messages.push(`${enemy.name} ${enemy.role === 'ranged' || enemy.role === 'caster' ? '원거리 위치 확보' : '접근'}`);
  }
  return { units: next, messages };
}
