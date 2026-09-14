import type { Terrain } from '../types';

/**
 * 10×10 battle field.
 * The board size is fixed, but terrain is regenerated from a seed for every battle.
 * Deployment rows (0-1 / 8-9) stay open so random terrain never creates an unfair spawn.
 */
export const BATTLE_FIELD_WIDTH = 10;
export const BATTLE_FIELD_HEIGHT = 10;

export type BattleFieldSeed = number;

const DEPLOYMENT_ROWS = new Set([0, 1, 8, 9]);
const TERRAIN_POOL: Terrain[] = ['forest', 'forest', 'hill', 'hill', 'fort', 'water'];

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Generate a deterministic terrain layout for the supplied seed. */
export function createBattleField(seed: BattleFieldSeed): Terrain[] {
  const random = seededRandom(seed);
  const field: Terrain[] = Array(BATTLE_FIELD_WIDTH * BATTLE_FIELD_HEIGHT).fill('plain');
  const candidates: number[] = [];

  for (let y = 2; y <= 7; y += 1) {
    for (let x = 0; x < BATTLE_FIELD_WIDTH; x += 1) {
      candidates.push(y * BATTLE_FIELD_WIDTH + x);
    }
  }

  const shuffled = shuffle(candidates, random);
  const counts: Record<Terrain, number> = {
    plain: 0,
    forest: 10,
    hill: 7,
    water: 4,
    fort: 4,
  };

  let cursor = 0;
  for (const terrain of TERRAIN_POOL) {
    const amount = counts[terrain];
    for (let i = 0; i < amount; i += 1) {
      const index = shuffled[cursor++];
      if (index !== undefined) field[index] = terrain;
    }
  }

  // Keep the two central fort cells as a tactical landmark while allowing
  // the surrounding terrain to change every battle.
  const fortCells = [4 * BATTLE_FIELD_WIDTH + 4, 4 * BATTLE_FIELD_WIDTH + 5, 5 * BATTLE_FIELD_WIDTH + 4, 5 * BATTLE_FIELD_WIDTH + 5];
  for (const index of fortCells) field[index] = 'fort';

  // Guarantee a simple crossing through the center so water cannot split the map.
  const crossing = [3 * BATTLE_FIELD_WIDTH + 3, 3 * BATTLE_FIELD_WIDTH + 4, 3 * BATTLE_FIELD_WIDTH + 5, 6 * BATTLE_FIELD_WIDTH + 4, 6 * BATTLE_FIELD_WIDTH + 5];
  for (const index of crossing) {
    if (field[index] === 'water') field[index] = random() > 0.5 ? 'forest' : 'plain';
  }

  // Deployment rows are always plain by design.
  for (const y of DEPLOYMENT_ROWS) {
    for (let x = 0; x < BATTLE_FIELD_WIDTH; x += 1) {
      field[y * BATTLE_FIELD_WIDTH + x] = 'plain';
    }
  }

  return field;
}

export function createBattleFieldSeed(): BattleFieldSeed {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/** Backward-compatible default field for systems that only need a terrain sample. */
export const FIXED_BATTLE_FIELD: Terrain[] = createBattleField(0x3a5f21);

if (FIXED_BATTLE_FIELD.length !== BATTLE_FIELD_WIDTH * BATTLE_FIELD_HEIGHT) {
  throw new Error('Battle field must contain exactly 100 cells.');
}
