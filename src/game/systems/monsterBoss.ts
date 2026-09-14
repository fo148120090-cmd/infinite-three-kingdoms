import type { Unit } from '../types';
import { getMonsterRegion } from '../data/monsters';

export type MonsterBossPattern = 'enrage' | 'guard' | 'flame' | 'poison' | 'summon';

export type MonsterBossTurnResult = {
  pattern: MonsterBossPattern;
  message: string;
  applied: boolean;
};

/**
 * Returns a deterministic boss pattern for the tower region.
 * This system is intentionally UI-agnostic so the battle screen can call it
 * without coupling monster rules to React state.
 */
export function getMonsterBossPattern(floor: number, turn: number): MonsterBossPattern {
  const region = getMonsterRegion(floor);
  if (!region || floor % 10 !== 0) return 'enrage';
  const cycle = Math.floor(turn / 2) % 3;
  if (region.id === 'demon' || region.id === 'dragon') return cycle === 0 ? 'flame' : cycle === 1 ? 'enrage' : 'guard';
  if (region.id === 'undead' || region.id === 'spider' || region.id === 'lizard') return cycle === 0 ? 'poison' : cycle === 1 ? 'guard' : 'enrage';
  return cycle === 0 ? 'guard' : cycle === 1 ? 'enrage' : 'summon';
}

export function applyMonsterBossPattern(boss: Unit, floor: number, turn: number): MonsterBossTurnResult {
  if (floor % 10 !== 0 || boss.currentHp <= 0) return { pattern: 'enrage', message: '', applied: false };
  const pattern = getMonsterBossPattern(floor, turn);
  switch (pattern) {
    case 'guard':
      boss.buff = Math.max(boss.buff, Math.floor(boss.atk * 0.25));
      return { pattern, message: `${boss.name}가 방어 태세에 들어갔습니다.`, applied: true };
    case 'enrage':
      boss.buff += Math.max(1, Math.floor(boss.atk * 0.2));
      return { pattern, message: `${boss.name}가 격노하여 공격력이 상승했습니다.`, applied: true };
    case 'flame':
      boss.buff += Math.max(1, Math.floor(boss.atk * 0.15));
      return { pattern, message: `${boss.name}가 화염의 힘을 끌어올렸습니다.`, applied: true };
    case 'poison':
      boss.buff += Math.max(1, Math.floor(boss.atk * 0.1));
      return { pattern, message: `${boss.name}가 독기를 내뿜습니다.`, applied: true };
    case 'summon':
      boss.buff += Math.max(1, Math.floor(boss.atk * 0.1));
      return { pattern, message: `${boss.name}가 부하를 부르는 힘을 모읍니다.`, applied: true };
  }
}
