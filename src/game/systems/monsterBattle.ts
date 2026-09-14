import type { General, Unit } from '../types';
import { getMonsterEncounter, getMonsterRegion, type Monster } from '../data/monsters';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../data/constants';

export function getMonsterFloorScale(floor: number): number {
  return 1 + Math.max(0, floor - 1) * 0.035;
}

export function createMonsterEnemy(monster: Monster, index: number, floor: number): Unit {
  const scale = getMonsterFloorScale(floor);
  const hp = Math.floor(monster.hp * scale);
  const atk = Math.floor(monster.atk * scale);
  const placeholder: General = {
    id: `${monster.id}-${index}`,
    name: monster.name,
    title: monster.tribe,
    faction: 'Warlords',
    role: monster.role,
    hp,
    atk,
    range: monster.range,
    move: monster.move,
    skill: monster.skill,
    skillPower: Math.floor(monster.skillPower * scale),
    ultimate: '',
    ultimatePower: 0,
    equipment: '',
    grade: monster.boss ? 6 : 1,
    tsName: '',
    tsTitle: '',
  };
  return {
    ...placeholder,
    team: 'enemy',
    x: BOARD_WIDTH - 1 - (index % 2),
    y: Math.min(BOARD_HEIGHT - 1, 1 + Math.floor(index / 2)),
    maxHp: hp,
    currentHp: hp,
    acted: false,
    rage: 0,
    buff: 0,
    movePoints: monster.move,
    status: 'none',
    statusTurns: 0,
  };
}

/**
 * Builds the enemy wave for the current tower floor.
 * Normal floors use the region's three regular monster types; boss floors
 * use the boss encounter supplied by the monster data layer.
 */
export function createMonsterEnemies(floor: number): Unit[] {
  const encounter = getMonsterEncounter(floor);
  if (floor % 10 === 0) {
    return encounter.map((monster, index) => createMonsterEnemy(monster, index, floor));
  }

  const region = getMonsterRegion(floor);
  const ids = [region.monsters[0], region.monsters[1], region.monsters[0], region.monsters[2]];
  return ids
    .map(id => encounter.find(monster => monster.id === id))
    .filter((monster): monster is Monster => Boolean(monster))
    .map((monster, index) => createMonsterEnemy(monster, index, floor));
}