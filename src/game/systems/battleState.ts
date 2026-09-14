import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH } from '../data/constants';
import { canTargetEnemy, calculateDamage, getReachableCells, isBattleOver, isInRange } from './battleRules';
import { resolveGeneralSkill } from './skillRules';
import { resolveEnemyTurn } from './enemyAi';

export type BattleTurn = 'player' | 'enemy';
export type BattlePhase = 'player' | 'enemy' | 'victory' | 'defeat';

export type BattleState = {
  units: Unit[];
  turn: BattleTurn;
  phase: BattlePhase;
  selectedId: string | null;
  targetId: string | null;
  log: string[];
};

export type BattleActionResult = {
  state: BattleState;
  success: boolean;
  message: string;
};

const cloneUnits = (units: Unit[]) => units.map((unit) => ({ ...unit }));
const cellKey = (x: number, y: number) => `${x},${y}`;

function finalize(state: BattleState, message: string): BattleState {
  const outcome = isBattleOver(state.units);
  if (outcome === 'player') return { ...state, phase: 'victory', log: [...state.log, message, '전투 승리!'] };
  if (outcome === 'enemy') return { ...state, phase: 'defeat', log: [...state.log, message, '전투 패배...'] };
  return { ...state, log: [...state.log, message] };
}

export function createBattleState(units: Unit[], log: string[] = ['전투를 시작합니다.']): BattleState {
  const safeUnits = cloneUnits(units).map((unit) => ({
    ...unit,
    acted: unit.team === 'enemy',
    movePoints: unit.move,
  }));
  const outcome = isBattleOver(safeUnits);
  return {
    units: safeUnits,
    turn: 'player',
    phase: outcome === 'player' ? 'victory' : outcome === 'enemy' ? 'defeat' : 'player',
    selectedId: safeUnits.find((unit) => unit.team === 'player' && unit.currentHp > 0)?.id ?? null,
    targetId: null,
    log,
  };
}

export function selectBattleUnit(state: BattleState, id: string | null): BattleState {
  if (state.phase !== 'player') return state;
  const unit = id ? state.units.find((candidate) => candidate.id === id && candidate.currentHp > 0) : undefined;
  if (!unit) return { ...state, selectedId: null, targetId: null };
  if (unit.team === 'enemy') return { ...state, targetId: unit.id };
  return { ...state, selectedId: unit.id, targetId: null };
}

export function selectBattleTarget(state: BattleState, id: string | null): BattleState {
  if (state.phase !== 'player') return state;
  if (!id) return { ...state, targetId: null };
  const target = state.units.find((unit) => unit.id === id && unit.team === 'enemy' && unit.currentHp > 0);
  return target ? { ...state, targetId: target.id } : state;
}

export function getSelectedReachableCells(state: BattleState, terrain: Terrain[]) {
  const selected = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!selected || state.phase !== 'player' || selected.acted || selected.movePoints <= 0) return [];
  const occupied = new Set(state.units.filter((unit) => unit.currentHp > 0).map((unit) => cellKey(unit.x, unit.y)));
  return getReachableCells(selected, terrain, occupied);
}

export function moveBattleUnit(state: BattleState, terrain: Terrain[], x: number, y: number): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 이동할 수 없습니다.' };
  const selected = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!selected || selected.acted || selected.movePoints <= 0) return { state, success: false, message: '이동할 장수를 선택하세요.' };
  const reachable = getSelectedReachableCells(state, terrain);
  const destination = reachable.find((cell) => cell.x === x && cell.y === y);
  if (!destination) return { state, success: false, message: '이동할 수 없는 칸입니다.' };

  const units = cloneUnits(state.units).map((unit) => unit.id === selected.id
    ? { ...unit, x, y, movePoints: Math.max(0, unit.movePoints - destination.cost) }
    : unit);
  return { state: { ...state, units }, success: true, message: `${selected.name} 이동` };
}

export function attackBattleTarget(state: BattleState, terrain: Terrain[]): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 공격할 수 없습니다.' };
  const attacker = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  const target = state.units.find((unit) => unit.id === state.targetId && unit.team === 'enemy' && unit.currentHp > 0);
  if (!attacker || !target || !canTargetEnemy(attacker, target)) return { state, success: false, message: '공격 가능한 적을 선택하세요.' };

  // The battle field is fixed at 10×10; never use the legacy 7-column index here.
  const tile = terrain[target.y * BOARD_WIDTH + target.x];
  if (!tile) return { state, success: false, message: '전장 지형 정보를 찾을 수 없습니다.' };
  const damage = calculateDamage(attacker, target, tile);
  const units = cloneUnits(state.units).map((unit) => {
    if (unit.id === attacker.id) return { ...unit, acted: true };
    if (unit.id === target.id) return { ...unit, currentHp: Math.max(0, unit.currentHp - damage) };
    return unit;
  });
  const next = finalize({ ...state, units, targetId: null }, `${attacker.name}의 공격 → ${target.name} ${damage} 피해`);
  return { state: next, success: true, message: '공격 완료' };
}

export function useBattleSkill(state: BattleState, terrain: Terrain[]): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 스킬을 사용할 수 없습니다.' };
  const result = resolveGeneralSkill(state.units, state.selectedId ?? '', state.targetId, terrain);
  if (!result.success) return { state, success: false, message: result.message };
  const next = finalize({ ...state, units: result.units, targetId: null }, result.message);
  return { state: next, success: true, message: result.message };
}

export function waitBattleUnit(state: BattleState): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 대기할 수 없습니다.' };
  const selected = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!selected || selected.acted) return { state, success: false, message: '대기할 장수를 선택하세요.' };
  const units = cloneUnits(state.units).map((unit) => unit.id === selected.id ? { ...unit, acted: true } : unit);
  return { state: finalize({ ...state, units, targetId: null }, `${selected.name} 대기`), success: true, message: '대기 완료' };
}

export function canEndPlayerTurn(state: BattleState): boolean {
  return state.phase === 'player' && !state.units.some((unit) => unit.team === 'player' && unit.currentHp > 0 && !unit.acted);
}

export function endPlayerTurn(state: BattleState, terrain: Terrain[]): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '플레이어 턴이 아닙니다.' };
  const enemyResult = resolveEnemyTurn(state.units, terrain);
  const reset = enemyResult.units.map((unit) => unit.team === 'player' && unit.currentHp > 0
    ? { ...unit, acted: false, movePoints: unit.move, statusTurns: Math.max(0, unit.statusTurns - 1), status: unit.statusTurns <= 1 ? 'none' : unit.status }
    : unit);
  const enemyMessages = enemyResult.messages.length ? enemyResult.messages.join(' / ') : '몬스터가 행동하지 않았습니다.';
  const interim: BattleState = { ...state, units: reset, turn: 'player', phase: 'player', targetId: null, log: [...state.log, '몬스터 턴', enemyMessages] };
  const outcome = isBattleOver(reset);
  if (outcome) return { state: finalize(interim, outcome === 'player' ? '전투 승리!' : '전투 패배...'), success: true, message: enemyMessages };
  const selected = reset.find((unit) => unit.team === 'player' && unit.currentHp > 0);
  return { state: { ...interim, selectedId: selected?.id ?? null }, success: true, message: enemyMessages };
}

export function getBattleTargetable(state: BattleState): Unit[] {
  const attacker = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!attacker || state.phase !== 'player' || attacker.acted) return [];
  return state.units.filter((unit) => unit.team === 'enemy' && unit.currentHp > 0 && isInRange(attacker, unit, attacker.range));
}
