import type { Unit } from '../types';
import { applyMonsterBossPattern, getMonsterBossPattern } from './monsterBoss';

export type MonsterTurnEffect = {
  unitId: string;
  message: string;
  damage?: number;
};

/** Applies the boss pattern at the start of every monster turn. Region hazards remain excluded. */
export function applyMonsterBossTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  if (floor % 10 !== 0) return [];
  const boss = units.find((unit) => unit.team === 'enemy' && unit.currentHp > 0 && unit.role === 'boss');
  if (!boss) return [];

  const result = applyMonsterBossPattern(boss, floor, turn);
  if (!result.applied) return [];

  const effects: MonsterTurnEffect[] = [{ unitId: boss.id, message: result.message }];
  const players = units.filter((unit) => unit.team === 'player' && unit.currentHp > 0);
  const pattern = getMonsterBossPattern(floor, turn);

  if (pattern === 'flame') {
    for (const player of players) {
      player.status = 'burn';
      player.statusTurns = Math.max(player.statusTurns, 2);
    }
    effects.push({ unitId: boss.id, message: '화염의 기운이 모든 장수에게 화상을 부여합니다.' });
  }

  if (pattern === 'poison') {
    for (const player of players) {
      player.status = 'slow';
      player.statusTurns = Math.max(player.statusTurns, 2);
    }
    effects.push({ unitId: boss.id, message: '독기가 모든 장수의 움직임을 2턴간 둔화합니다.' });
  }

  return effects;
}

/** Monster turn effects are boss-pattern effects only; no map-region hazards are applied. */
export function applyMonsterTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  return applyMonsterBossTurnEffects(units, floor, turn);
}
