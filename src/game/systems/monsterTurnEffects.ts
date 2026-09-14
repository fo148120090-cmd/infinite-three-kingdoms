import type { Unit } from '../types';
import { getMonsterRegionRule, isMonsterHazardActive } from './monsterRegionRules';
import { applyMonsterBossPattern } from './monsterBoss';

export type MonsterTurnEffect = {
  unitId: string;
  message: string;
  damage?: number;
};

/** Applies region hazards at the start of the monster turn. */
export function applyMonsterRegionTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  const rule = getMonsterRegionRule(floor);
  if (rule.hazard === 'none') return [];
  const effects: MonsterTurnEffect[] = [];
  for (const unit of units) {
    if (unit.currentHp <= 0) continue;
    if (!isMonsterHazardActive(floor, unit.x, unit.y, turn)) continue;
    if (rule.hazard === 'poison') {
      const damage = Math.max(2, Math.floor(unit.maxHp * 0.04));
      unit.currentHp = Math.max(0, unit.currentHp - damage);
      unit.status = 'burn';
      unit.statusTurns = Math.max(unit.statusTurns, 1);
      effects.push({ unitId: unit.id, damage, message: `${unit.name}이(가) 독기에 노출되어 ${damage} 피해를 받았습니다.` });
    } else if (rule.hazard === 'flame') {
      const damage = Math.max(3, Math.floor(unit.maxHp * 0.05));
      unit.currentHp = Math.max(0, unit.currentHp - damage);
      unit.status = 'burn';
      unit.statusTurns = Math.max(unit.statusTurns, 1);
      effects.push({ unitId: unit.id, damage, message: `${unit.name}이(가) 화염 지대에서 ${damage} 피해를 받았습니다.` });
    } else if (rule.hazard === 'web') {
      unit.movePoints = Math.max(1, unit.movePoints - 1);
      unit.status = 'slow';
      unit.statusTurns = Math.max(unit.statusTurns, 1);
      effects.push({ unitId: unit.id, message: `${unit.name}이(가) 거미줄에 걸려 이동력이 감소했습니다.` });
    } else if (rule.hazard === 'mud') {
      unit.movePoints = Math.max(1, unit.movePoints - 1);
      effects.push({ unitId: unit.id, message: `${unit.name}이(가) 미궁의 장애물 때문에 이동이 제한됩니다.` });
    }
  }
  return effects;
}

/** Applies a region boss pattern without coupling the rule to React UI. */
export function applyMonsterBossTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  if (floor % 10 !== 0) return [];
  const boss = units.find(unit => unit.team === 'enemy' && unit.currentHp > 0 && unit.grade >= 6);
  if (!boss) return [];
  const result = applyMonsterBossPattern(boss, floor, turn);
  return result.applied ? [{ unitId: boss.id, message: result.message }] : [];
}

export function applyMonsterTurnEffects(units: Unit[], floor: number, turn: number): MonsterTurnEffect[] {
  return [
    ...applyMonsterRegionTurnEffects(units, floor, turn),
    ...applyMonsterBossTurnEffects(units, floor, turn),
  ];
}
