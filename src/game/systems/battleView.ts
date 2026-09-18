import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH, getReachableCells, isInRange } from './battleRules';
import { getGeneralSkillTargetIds } from './skillRules';

export type BattleCellView = {
  x: number;
  y: number;
  terrain: Terrain;
  unit: Unit | null;
  reachable: boolean;
  targetable: boolean;
  skillTargetable: boolean;
  selected: boolean;
};

const canAct = (unit: Unit) => unit.currentHp > 0 && !(unit.status === 'stun' && unit.statusTurns > 0);

export function buildBattleCellViews(
  units: Unit[],
  terrain: Terrain[],
  selectedId: string | null,
): BattleCellView[] {
  const selected = units.find((unit) => unit.id === selectedId) ?? null;
  const occupied = new Set(units.filter((unit) => unit.currentHp > 0).map((unit) => `${unit.x},${unit.y}`));
  const actionable = Boolean(selected && selected.team === 'player' && canAct(selected) && !selected.acted);
  const mover = actionable && selected?.status === 'slow' && selected.statusTurns > 0
    ? { ...selected, movePoints: Math.min(selected.movePoints, Math.max(1, Math.ceil(selected.move / 2))) }
    : selected;
  const reachable = actionable && mover && mover.movePoints > 0
    ? new Set(getReachableCells(mover, terrain, occupied).map((cell) => `${cell.x},${cell.y}`))
    : new Set<string>();
  const skillTargetIds = actionable ? new Set(getGeneralSkillTargetIds(units, selected!.id, terrain)) : new Set<string>();

  return terrain.map((tile, index) => {
    const x = index % BOARD_WIDTH;
    const y = Math.floor(index / BOARD_WIDTH);
    const unit = units.find((candidate) => candidate.currentHp > 0 && candidate.x === x && candidate.y === y) ?? null;
    const targetable = Boolean(actionable && unit && unit.team === 'enemy' && isInRange(selected!, unit, selected!.range));
    const skillTargetable = Boolean(actionable && unit && unit.team === 'enemy' && skillTargetIds.has(unit.id));
    return {
      x,
      y,
      terrain: tile,
      unit,
      reachable: reachable.has(`${x},${y}`),
      targetable,
      skillTargetable,
      selected: unit?.id === selectedId,
    };
  });
}
