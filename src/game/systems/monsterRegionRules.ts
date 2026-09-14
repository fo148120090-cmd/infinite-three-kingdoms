import { getMonsterRegion } from '../data/monsters';
import type { Terrain } from '../types';

export type MonsterRegionRule = {
  regionId: string;
  terrainTheme: string;
  primaryTerrain: Terrain;
  movementPenalty: number;
  hazard: 'none' | 'poison' | 'flame' | 'web' | 'mud';
};

export function getMonsterRegionRule(floor: number): MonsterRegionRule {
  const region = getMonsterRegion(floor);
  const id = region?.id ?? 'goblin';
  if (id === 'lizard') return { regionId: id, terrainTheme: 'swamp', primaryTerrain: 'water', movementPenalty: 1, hazard: 'poison' };
  if (id === 'undead') return { regionId: id, terrainTheme: 'graveyard', primaryTerrain: 'forest', movementPenalty: 0, hazard: 'poison' };
  if (id === 'spider') return { regionId: id, terrainTheme: 'web cave', primaryTerrain: 'forest', movementPenalty: 1, hazard: 'web' };
  if (id === 'demon') return { regionId: id, terrainTheme: 'fire wasteland', primaryTerrain: 'plain', movementPenalty: 0, hazard: 'flame' };
  if (id === 'dragon') return { regionId: id, terrainTheme: 'lava ruins', primaryTerrain: 'hill', movementPenalty: 0, hazard: 'flame' };
  if (id === 'minotaur') return { regionId: id, terrainTheme: 'narrow labyrinth', primaryTerrain: 'fort', movementPenalty: 1, hazard: 'mud' };
  if (id === 'orc') return { regionId: id, terrainTheme: 'orc fortress', primaryTerrain: 'fort', movementPenalty: 0, hazard: 'none' };
  if (id === 'gnoll') return { regionId: id, terrainTheme: 'rocky wasteland', primaryTerrain: 'hill', movementPenalty: 0, hazard: 'none' };
  return { regionId: id, terrainTheme: region?.terrain ?? 'goblin village', primaryTerrain: 'plain', movementPenalty: 0, hazard: 'none' };
}

export function isMonsterHazardActive(floor: number, x: number, y: number, turn: number): boolean {
  const rule = getMonsterRegionRule(floor);
  if (rule.hazard === 'none') return false;
  return (x * 3 + y * 5 + turn) % 7 === 0;
}
