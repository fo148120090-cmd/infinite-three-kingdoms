import type { Unit } from '../types';
import { getMonsterEncounter, getMonsterRegion, type Monster } from '../data/monsters';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../data/constants';

export type MonsterBattleV2Options = { floor: number; statScale?: number };

export function getMonsterFloorScale(floor: number): number {
  return 1 + Math.max(0, floor - 1) * 0.035;
}

export function createMonsterUnitV2(monster: Monster, index: number, floor: number, options: MonsterBattleV2Options): Unit {
  const scale = options.statScale ?? getMonsterFloorScale(floor);
  const hp = Math.floor(monster.hp * scale);
  const atk = Math.floor(monster.atk * scale);
  return {
    id: `${monster.id}-${index}`,
    name: monster.name,
    title: monster.tribe,
    faction: 'Warlords', role: monster.role,
    hp, atk, range: monster.range, move: monster.move,
    skill: monster.skill, skillPower: Math.floor(monster.skillPower * scale),
    ultimate: '', ultimatePower: 0, equipment: '', grade: monster.boss ? 6 : 1,
    tsName: '', tsTitle: '', team: 'enemy',
    x: BOARD_WIDTH - 1 - (index % 2), y: Math.min(BOARD_HEIGHT - 1, 1 + Math.floor(index / 2)),
    currentHp: hp, maxHp: hp, acted: false, rage: 0, buff: 0, movePoints: monster.move,
    status: 'none', statusTurns: 0,
  };
}

export function createMonsterBattleUnitsV2(floor: number, options: Omit<MonsterBattleV2Options, 'floor'> = {}): Unit[] {
  const encounter = getMonsterEncounter(floor);
  if (floor % 10 === 0) return encounter.map((m, i) => createMonsterUnitV2(m, i, floor, { ...options, floor }));
  const region = getMonsterRegion(floor);
  const composition = [region.monsters[0], region.monsters[1], region.monsters[0], region.monsters[2]].filter(Boolean);
  return composition.map((id, i) => encounter.find(m => m.id === id)).filter((m): m is Monster => Boolean(m)).map((m, i) => createMonsterUnitV2(m, i, floor, { ...options, floor }));
}
