import type { Terrain, Unit } from '../types';
import { buildBattleCellViews } from './battleView';

export const TERRAIN_LABEL: Record<Terrain, string> = {
  plain: '평지',
  forest: '숲',
  hill: '고지',
  water: '물',
  fort: '요새',
};

export type BattlePresentation = {
  cells: ReturnType<typeof buildBattleCellViews>;
  selected: Unit | null;
  playerUnits: Unit[];
  enemyUnits: Unit[];
};

export function buildBattlePresentation(units: Unit[], terrain: Terrain[], selectedId: string | null): BattlePresentation {
  return {
    cells: buildBattleCellViews(units, terrain, selectedId),
    selected: units.find((unit) => unit.id === selectedId) ?? null,
    playerUnits: units.filter((unit) => unit.team === 'player'),
    enemyUnits: units.filter((unit) => unit.team === 'enemy'),
  };
}
