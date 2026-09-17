import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH, calculateDamage, isInRange } from './battleRules';
import { applyBattleDamageReduction } from './battleModifiers';

export type MonsterSkillResult = { used: boolean; message: string };

const livingPlayers = (units: Unit[]) => units.filter((unit) => unit.team === 'player' && unit.currentHp > 0);
const dist = (a: Unit, b: Unit) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function damageTarget(enemy: Unit, target: Unit, terrain: Terrain[], power: number): number {
  const tile = terrain[target.y * BOARD_WIDTH + target.x];
  if (!tile) return 0;
  // calculateDamage already includes enemy.buff in the attacker term.
  const raw = calculateDamage(enemy, target, tile, power);
  return applyBattleDamageReduction(target, raw);
}

export function shouldUseMonsterSkill(enemy: Unit, target: Unit, turn: number): boolean {
  if (!enemy.skill || enemy.skillPower <= 0 || !isInRange(enemy, target, enemy.range)) return false;
  if (enemy.role === 'boss') return true;
  if (enemy.role === 'caster') return true;
  if (enemy.role === 'assassin') return target.currentHp <= target.maxHp * 0.65 || turn % 3 === 0;
  if (enemy.role === 'ranged') return turn % 2 === 0;
  if (enemy.role === 'tank') return enemy.currentHp <= enemy.maxHp * 0.5 || turn % 3 === 1;
  return turn % 3 === 0;
}

export function useMonsterSkill(enemy: Unit, target: Unit, units: Unit[], terrain: Terrain[], turn: number): MonsterSkillResult {
  if (!shouldUseMonsterSkill(enemy, target, turn)) return { used: false, message: '' };
  const players = livingPlayers(units);
  const name = enemy.skill;

  if (name.includes('주술') || name.includes('군령')) {
    const weaken = Math.max(1, Math.floor(enemy.skillPower * 0.4));
    for (const player of players) player.buff = Math.max(0, player.buff - weaken);
    const damage = damageTarget(enemy, target, terrain, enemy.skillPower);
    target.currentHp = Math.max(0, target.currentHp - damage);
    return { used: true, message: `${enemy.name}의 ${name} → ${target.name} ${damage} 피해 · 공격 약화` };
  }

  if (name.includes('독') || name.includes('저주')) {
    const damage = damageTarget(enemy, target, terrain, enemy.skillPower);
    target.currentHp = Math.max(0, target.currentHp - damage);
    target.status = 'slow';
    target.statusTurns = Math.max(target.statusTurns, 2);
    return { used: true, message: `${enemy.name}의 ${name} → ${target.name} ${damage} 피해 · 감속 2턴` };
  }

  if (name.includes('화염') || name.includes('불') || name.includes('화염 물기')) {
    const damage = damageTarget(enemy, target, terrain, enemy.skillPower);
    target.currentHp = Math.max(0, target.currentHp - damage);
    target.status = 'burn';
    target.statusTurns = Math.max(target.statusTurns, 2);
    return { used: true, message: `${enemy.name}의 ${name} → ${target.name} ${damage} 피해 · 화상 2턴` };
  }

  if (name.includes('방어') || name.includes('방패') || name.includes('철벽') || name.includes('수호') || name.includes('용린')) {
    enemy.status = 'guard';
    enemy.statusTurns = 2;
    return { used: true, message: `${enemy.name}의 ${name} → 방어 태세 2턴` };
  }

  if (name.includes('분쇄') || name.includes('강타') || name.includes('참격') || name.includes('베기') || name.includes('일격') || name.includes('처형') || name.includes('심판') || name.includes('붕괴') || name.includes('낙뢰') || name.includes('숨결') || name.includes('독무')) {
    const damage = damageTarget(enemy, target, terrain, enemy.skillPower);
    target.currentHp = Math.max(0, target.currentHp - damage);
    if (enemy.role === 'boss' || name.includes('낙뢰') || name.includes('붕괴') || name.includes('심판')) {
      for (const player of players.filter((player) => dist(player, target) <= 1 && player.id !== target.id)) {
        const splash = Math.max(1, Math.floor(damage * 0.45));
        player.currentHp = Math.max(0, player.currentHp - splash);
      }
    }
    return { used: true, message: `${enemy.name}의 ${name} → ${target.name} ${damage} 피해` };
  }

  const damage = damageTarget(enemy, target, terrain, enemy.skillPower);
  target.currentHp = Math.max(0, target.currentHp - damage);
  return { used: true, message: `${enemy.name}의 ${name} → ${target.name} ${damage} 피해` };
}
