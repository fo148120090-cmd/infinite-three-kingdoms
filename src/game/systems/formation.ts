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

  const roleCounts = generals.reduce<Record<string, number>>((acc, g) => {
    acc[g.role] = (acc[g.role] ?? 0) + 1;
    return acc;
  }, {});

  if ((roleCounts['지원'] ?? 0) >= 2) {
    bonuses.hpPct += 4;
    bonuses.labels.push('지원 연계 · 최대 HP +4%');
  }
  if ((roleCounts['전사'] ?? 0) >= 2) {
    bonuses.attackPct += 4;
    bonuses.labels.push('전사 연계 · 공격력 +4%');
  }
  if ((roleCounts['수호'] ?? 0) >= 2) {
    bonuses.hpPct += 6;
    bonuses.labels.push('수호 진형 · 최대 HP +6%');
  }
  if ((roleCounts['기병'] ?? 0) >= 2) {
    bonuses.critPct += 3;
    bonuses.labels.push('기병 기동 · 치명타 +3%');
  }
  if ((roleCounts['책사'] ?? 0) >= 2) {
    bonuses.skillPowerPct += 5;
    bonuses.labels.push('책사 연계 · 스킬 위력 +5%');
  }

  bonuses.label = bonuses.labels.join(' / ') || '기본 진형';
  return bonuses;
}
