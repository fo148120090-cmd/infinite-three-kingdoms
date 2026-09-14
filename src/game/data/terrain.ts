import type { Terrain } from '../types';

export const BOARD_WIDTH = 7;
export const BOARD_HEIGHT = 6;

export const TERRAIN: Terrain[] = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, i) =>
  i === 17 || i === 18 || i === 24 ? 'forest' :
  i === 11 || i === 12 ? 'hill' :
  i === 26 || i === 27 ? 'water' :
  i === 32 ? 'fort' : 'plain'
);

export const TERRAIN_COST: Record<Terrain, number> = {
  plain: 1,
  forest: 2,
  hill: 1,
  water: 99,
  fort: 1,
};

export const isPassable = (terrain: Terrain) => terrain !== 'water';
