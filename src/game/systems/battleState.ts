import type { Terrain, Unit } from '../types';
import { BOARD_WIDTH } from '../data/constants';
import { canTargetEnemy, calculateDamage, getReachableCells, isBattleOver, isInRange } from './battleRules';
import { resolveGeneralSkill } from './skillRules';
import { resolveEnemyTurn } from './enemyAi';
import { applyBattleDamageReduction } from './battleModifiers';
import { applyMonsterTurnEffects } from './monsterTurnEffects';

export type BattleTurn = 'player' | 'enemy';
export type BattlePhase = 'player' | 'enemy' | 'victory' | 'defeat';
export type BattleState = { units: Unit[]; turn: BattleTurn; phase: BattlePhase; selectedId: string | null; targetId: string | null; log: string[] };
export type BattleActionResult = { state: BattleState; success: boolean; message: string };

const cloneUnits = (units: Unit[]) => units.map((unit) => ({ ...unit }));
const cellKey = (x: number, y: number) => `${x},${y}`;
const canAct = (unit: Unit) => unit.currentHp > 0 && !(unit.status === 'stun' && unit.statusTurns > 0);

function finalize(state: BattleState, message: string): BattleState {
  const outcome = isBattleOver(state.units);
  if (outcome === 'player') return { ...state, phase: 'victory', log: [...state.log, message, '전투 승리!'] };
  if (outcome === 'enemy') return { ...state, phase: 'defeat', log: [...state.log, message, '전투 패배...'] };
  return { ...state, log: [...state.log, message] };
}

function advanceStatuses(unit: Unit): Unit {
  if (unit.statusTurns <= 0 || unit.status === 'none') return unit;
  const statusDamage = unit.status === 'burn' ? Math.max(1, Math.floor(unit.maxHp * 0.06)) : 0;
  const nextTurns = Math.max(0, unit.statusTurns - 1);
  return { ...unit, currentHp: Math.max(0, unit.currentHp - statusDamage), statusTurns: nextTurns, status: nextTurns === 0 ? 'none' : unit.status };
}

export function createBattleState(units: Unit[], log: string[] = ['전투를 시작합니다.']): BattleState {
  const safeUnits = cloneUnits(units).map((unit) => ({ ...unit, acted: unit.team === 'enemy', movePoints: unit.move }));
  const outcome = isBattleOver(safeUnits);
  return { units: safeUnits, turn: 'player', phase: outcome === 'player' ? 'victory' : outcome === 'enemy' ? 'defeat' : 'player', selectedId: safeUnits.find((unit) => unit.team === 'player' && canAct(unit))?.id ?? null, targetId: null, log };
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
  if (!selected || state.phase !== 'player' || selected.acted || selected.movePoints <= 0 || !canAct(selected)) return [];
  const occupied = new Set(state.units.filter((unit) => unit.currentHp > 0).map((unit) => cellKey(unit.x, unit.y)));
  const mover = selected.status === 'slow' && selected.statusTurns > 0 ? { ...selected, movePoints: Math.max(1, Math.ceil(selected.move / 2)) } : selected;
  return getReachableCells(mover, terrain, occupied);
}

export function moveBattleUnit(state: BattleState, terrain: Terrain[], x: number, y: number): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 이동할 수 없습니다.' };
  const selected = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!selected || selected.acted || selected.movePoints <= 0 || !canAct(selected)) return { state, success: false, message: selected?.status === 'stun' ? '기절 상태라 행동할 수 없습니다.' : '이동할 장수를 선택하세요.' };
  const destination = getSelectedReachableCells(state, terrain).find((cell) => cell.x === x && cell.y === y);
  if (!destination) return { state, success: false, message: '이동할 수 없는 칸입니다.' };
  const units = cloneUnits(state.units).map((unit) => unit.id === selected.id ? { ...unit, x, y, movePoints: Math.max(0, unit.movePoints - destination.cost) } : unit);
  return { state: { ...state, units }, success: true, message: `${selected.name} 이동` };
}

export function attackBattleTarget(state: BattleState, terrain: Terrain[]): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 공격할 수 없습니다.' };
  const attacker = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  const target = state.units.find((unit) => unit.id === state.targetId && unit.team === 'enemy' && unit.currentHp > 0);
  if (!attacker || !target || !canAct(attacker) || !canTargetEnemy(attacker, target)) return { state, success: false, message: attacker?.status === 'stun' ? '기절 상태라 공격할 수 없습니다.' : '공격 가능한 적을 선택하세요.' };
  const tile = terrain[target.y * BOARD_WIDTH + target.x];
  if (!tile) return { state, success: false, message: '전장 지형 정보를 찾을 수 없습니다.' };
  const rawDamage = calculateDamage(attacker, target, tile);
  const damage = applyBattleDamageReduction(target, rawDamage);
  const units = cloneUnits(state.units).map((unit) => unit.id === attacker.id ? { ...unit, acted: true } : unit.id === target.id ? { ...unit, currentHp: Math.max(0, unit.currentHp - damage) } : unit);
  return { state: finalize({ ...state, units, targetId: null }, `${attacker.name}의 공격 → ${target.name} ${damage} 피해`), success: true, message: '공격 완료' };
}

export function useBattleSkill(state: BattleState, terrain: Terrain[]): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 스킬을 사용할 수 없습니다.' };
  const caster = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!caster || !canAct(caster)) return { state, success: false, message: caster?.status === 'stun' ? '기절 상태라 스킬을 사용할 수 없습니다.' : '지금은 스킬을 사용할 수 없습니다.' };
  const result = resolveGeneralSkill(state.units, state.selectedId ?? '', state.targetId, terrain);
  if (!result.success) return { state, success: false, message: result.message };
  return { state: finalize({ ...state, units: result.units, targetId: null }, result.message), success: true, message: result.message };
}

export function waitBattleUnit(state: BattleState): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '지금은 대기할 수 없습니다.' };
  const selected = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!selected || selected.acted || !canAct(selected)) return { state, success: false, message: selected?.status === 'stun' ? '기절 상태라 행동할 수 없습니다.' : '대기할 장수를 선택하세요.' };
  const units = cloneUnits(state.units).map((unit) => unit.id === selected.id ? { ...unit, acted: true } : unit);
  return { state: finalize({ ...state, units, targetId: null }, `${selected.name} 대기`), success: true, message: '대기 완료' };
}

export function canEndPlayerTurn(state: BattleState): boolean {
  return state.phase === 'player' && !state.units.some((unit) => unit.team === 'player' && unit.currentHp > 0 && !unit.acted && canAct(unit));
}

export function endPlayerTurn(state: BattleState, terrain: Terrain[], floor = 1): BattleActionResult {
  if (state.phase !== 'player') return { state, success: false, message: '플레이어 턴이 아닙니다.' };

  const workingUnits = cloneUnits(state.units);
  const bossEffects = applyMonsterTurnEffects(workingUnits, floor, state.turn === 'enemy' ? 1 : 0);
  const enemyResult = resolveEnemyTurn(workingUnits, terrain);
  const effectMessages = bossEffects.map((effect) => effect.message);
  const reset = enemyResult.units.map((unit) => unit.team === 'player' && unit.currentHp > 0
    ? { ...advanceStatuses(unit), acted: false, movePoints: unit.status === 'slow' && unit.statusTurns > 0 ? Math.max(1, Math.ceil(unit.move / 2)) : unit.move }
    : advanceStatuses(unit));
  const enemyMessages = [...effectMessages, ...enemyResult.messages];
  const enemyLog = enemyMessages.length ? enemyMessages.join(' / ') : '몬스터가 행동하지 않았습니다.';
  const interim: BattleState = { ...state, units: reset, turn: 'player', phase: 'player', targetId: null, log: [...state.log, '몬스터 턴', enemyLog] };
  const outcome = isBattleOver(reset);
  if (outcome) return { state: finalize(interim, outcome === 'player' ? '전투 승리!' : '전투 패배...'), success: true, message: enemyLog };
  const selected = reset.find((unit) => unit.team === 'player' && canAct(unit));
  return { state: { ...interim, selectedId: selected?.id ?? null }, success: true, message: enemyLog };
}

export function getBattleTargetable(state: BattleState): Unit[] {
  const attacker = state.units.find((unit) => unit.id === state.selectedId && unit.team === 'player' && unit.currentHp > 0);
  if (!attacker || state.phase !== 'player' || attacker.acted || !canAct(attacker)) return [];
  return state.units.filter((unit) => unit.team === 'enemy' && unit.currentHp > 0 && isInRange(attacker, unit, attacker.range));
}
