import type { General } from '../types';

export type FormationBonus = {
  attackPct: number;
  hpPct: number;
  skillPowerPct: number;
  critPct: number;
  labels: string[];
  label: string;
};

export function getFormationBonus(generals: General[]): FormationBonus {
  const counts = generals.reduce<Record<string, number>>((acc, g) => {
    acc[g.faction] = (acc[g.faction] ?? 0) + 1;
    return acc;
  }, {});

  const bonuses: FormationBonus = {
    attackPct: 0,
    hpPct: 0,
    skillPowerPct: 0,
    critPct: 0,
    labels: [],
    label: '기본 진형',
  };

  if ((counts.Shu ?? 0) >= 3) {
    bonuses.hpPct += 8;
    bonuses.labels.push('촉의 결속 · 최대 HP +8%');
  }
  if ((counts.Wei ?? 0) >= 2) {
    bonuses.attackPct += 6;
    bonuses.labels.push('위의 공세 · 공격력 +6%');
  }
  if ((counts.Wu ?? 0) >= 2) {
    bonuses.skillPowerPct += 6;
    bonuses.labels.push('오의 연계 · 스킬 위력 +6%');
  }
  if ((counts.Warlords ?? 0) >= 2) {
    bonuses.critPct += 5;
    bonuses.labels.push('군웅의 투기 · 치명타 +5%');
  }

  bonuses.label = bonuses.labels.join(' / ') || '기본 진형';
  return bonuses;
}
