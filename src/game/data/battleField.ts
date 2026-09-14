import type { Terrain } from '../types';

/**
 * Fixed 10×10 tower battle field.
 * The layout is intentionally shared by every tower floor so players learn
 * one stable battlefield rather than adapting to a newly generated map.
 */
export const BATTLE_FIELD_WIDTH = 10;
export const BATTLE_FIELD_HEIGHT = 10;

const rows: Terrain[][] = [
  ['plain','plain','plain','forest','forest','plain','plain','plain','hill','hill'],
  ['plain','plain','forest','forest','plain','plain','plain','hill','hill','plain'],
  ['plain','forest','forest','plain','plain','plain','hill','hill','plain','plain'],
  ['plain','forest','plain','plain','fort','fort','plain','plain','plain','plain'],
  ['plain','plain','plain','fort','fort','plain','plain','forest','forest','plain'],
  ['plain','plain','plain','plain','plain','plain','forest','forest','plain','plain'],
  ['plain','plain','water','water','plain','plain','plain','forest','plain','plain'],
  ['plain','plain','water','water','plain','hill','hill','plain','plain','plain'],
  ['hill','plain','plain','plain','plain','plain','plain','plain','plain','hill'],
  ['hill','hill','plain','plain','plain','plain','plain','plain','hill','hill'],
];

export const FIXED_BATTLE_FIELD: Terrain[] = rows.flat();

if (FIXED_BATTLE_FIELD.length !== BATTLE_FIELD_WIDTH * BATTLE_FIELD_HEIGHT) {
  throw new Error('Fixed battle field must contain exactly 100 cells.');
}
