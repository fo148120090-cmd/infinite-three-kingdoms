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
  attackRange: boolean;
  skillRange: boolean;
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
  const attackRange = actionable ? new Set(terrain.map((_, index) => {
    const x = index % BOARD_WIDTH, y = Math.floor(index / BOARD_WIDTH);
    return Math.abs(x - selected!.x) + Math.abs(y - selected!.y) <= selected!.range ? `${x},${y}` : '';
  }).filter(Boolean)) : new Set<string>();
  const skillRange = actionable ? new Set(terrain.map((_, index) => {
    const x = index % BOARD_WIDTH, y = Math.floor(index / BOARD_WIDTH);
    const distance = Math.abs(x - selected!.x) + Math.abs(y - selected!.y);
    const name = selected!.skill;
    if (name === '인덕의 격려' || name === '강동의 결의' || name === '간웅의 명령') return '';
    if (name === '맹격' || name === '호통') return distance <= 1 ? `${x},${y}` : '';
    if (name === '용진') return distance <= selected!.range && (x === selected!.x || y === selected!.y) ? `${x},${y}` : '';
    return distance <= selected!.range ? `${x},${y}` : '';
  }).filter(Boolean)) : new Set<string>();

  return terrain.map((tile, index) => {
    const x = index % BOARD_WIDTH;
    const y = Math.floor(index / BOARD_WIDTH);
    const unit = units.find((candidate) => candidate.currentHp > 0 && candidate.x === x && candidate.y === y) ?? null;
    const targetable = Boolean(actionable && unit && unit.team === 'enemy' && isInRange(selected!, unit, selected!.range));
    const skillTargetable = Boolean(actionable && unit && unit.team === 'enemy' && skillTargetIds.has(unit.id));
    const cellKey = `${x},${y}`;
    return {
      x,
      y,
      terrain: tile,
      unit,
      reachable: reachable.has(`${x},${y}`),
      targetable,
      skillTargetable,
      attackRange: attackRange.has(cellKey),
      skillRange: skillRange.has(cellKey),
      selected: unit?.id === selectedId,
    };
  });
}
