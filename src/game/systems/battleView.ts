import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH, getReachableCells, isInRange } from './battleRules';

export type BattleCellView = {
  x: number;
  y: number;
  terrain: Terrain;
  unit: Unit | null;
  reachable: boolean;
  targetable: boolean;
  selected: boolean;
};

export function buildBattleCellViews(
  units: Unit[],
  terrain: Terrain[],
  selectedId: string | null,
): BattleCellView[] {
  const selected = units.find((unit) => unit.id === selectedId) ?? null;
  const occupied = new Set(units.filter((unit) => unit.currentHp > 0).map((unit) => `${unit.x},${unit.y}`));
  const reachable = selected && selected.team === 'player' && !selected.acted
    ? new Set(getReachableCells(selected, terrain, occupied).map((cell) => `${cell.x},${cell.y}`))
    : new Set<string>();

  return terrain.map((tile, index) => {
    const x = index % BOARD_WIDTH;
    const y = Math.floor(index / BOARD_WIDTH);
    const unit = units.find((candidate) => candidate.currentHp > 0 && candidate.x === x && candidate.y === y) ?? null;
    const targetable = Boolean(selected && unit && unit.team === 'enemy' && isInRange(selected, unit, selected.range) && !selected.acted);
    return {
      x,
      y,
      terrain: tile,
      unit,
      reachable: reachable.has(`${x},${y}`),
      targetable,
      selected: unit?.id === selectedId,
    };
  });
}
