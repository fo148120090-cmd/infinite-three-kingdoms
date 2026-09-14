import type { General, Unit } from '../types';
import { getMonsterEncounter, type Monster } from '../data/monsters';

/**
 * Converts tower monsters into battle-compatible enemy units.
 * The adapter deliberately keeps the existing Unit shape so the current
 * battle UI can migrate without changing the player/general model.
 */
export function createMonsterEnemy(
  monster: Monster,
  index: number,
  floor: number,
): Unit {
  const scale = 1 + Math.max(0, floor - 1) * 0.035;
  const hp = Math.floor(monster.hp * scale);
  const atk = Math.floor(monster.atk * scale);

  const placeholder: General = {
    id: monster.id,
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
    grade: monster.boss ? 5 : 1,
    tsName: '',
    tsTitle: '',
  };

  return {
    ...placeholder,
    team: 'enemy',
    x: 5 - (index % 2),
    y: 1 + Math.floor(index / 2),
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

export function createMonsterEnemies(floor: number): Unit[] {
  return getMonsterEncounter(floor).map((monster, index) => createMonsterEnemy(monster, index, floor));
}
