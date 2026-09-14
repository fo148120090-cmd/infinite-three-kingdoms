import type { General } from '../types';

export type RelationshipBonus = {
  ids: string[];
  label: string;
  attackPct: number;
  hpPct: number;
  skillPowerPct: number;
  critPct: number;
};

const RELATIONSHIPS: RelationshipBonus[] = [
  { ids: ['liu-bei', 'guan-yu', 'zhang-fei'], label: '도원결의 · 공격력 +8%, 최대 HP +8%', attackPct: 8, hpPct: 8, skillPowerPct: 0, critPct: 0 },
  { ids: ['cao-cao', 'xiahou-dun'], label: '위의 맹장 · 공격력 +7%', attackPct: 7, hpPct: 0, skillPowerPct: 0, critPct: 0 },
  { ids: ['sun-quan', 'zhou-yu'], label: '강동의 동맹 · 스킬 위력 +8%', attackPct: 0, hpPct: 0, skillPowerPct: 8, critPct: 0 },
  { ids: ['lu-bu', 'diao-chan'], label: '적월의 인연 · 치명타 +6%', attackPct: 0, hpPct: 0, skillPowerPct: 0, critPct: 6 },
];

export function getActiveRelationships(generals: General[]): RelationshipBonus[] {
  const ids = new Set(generals.map(g => g.id));
  return RELATIONSHIPS.filter(r => r.ids.every(id => ids.has(id)));
}

export function getRelationshipBonus(generals: General[]) {
  return getActiveRelationships(generals).reduce(
    (total, bonus) => ({
      attackPct: total.attackPct + bonus.attackPct,
      hpPct: total.hpPct + bonus.hpPct,
      skillPowerPct: total.skillPowerPct + bonus.skillPowerPct,
      critPct: total.critPct + bonus.critPct,
    }),
    { attackPct: 0, hpPct: 0, skillPowerPct: 0, critPct: 0 },
  );
}
