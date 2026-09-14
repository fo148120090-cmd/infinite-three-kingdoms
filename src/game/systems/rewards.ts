import type { TowerInfo } from './tower';

export type TowerReward = {
  gold: number;
  gems: number;
  materials: number;
  label: string;
};

export type RewardChoice = 'gold' | 'gems' | 'materials';

export function getTowerReward(info: TowerInfo, choice: RewardChoice): TowerReward {
  const base = {
    gold: info.goldReward,
    gems: info.gemReward,
    materials: info.materialReward,
  };

  if (choice === 'gold') return { gold: base.gold * 2, gems: 0, materials: 0, label: '금화 보급' };
  if (choice === 'gems') return { gold: 0, gems: base.gems * 2, materials: 0, label: '보옥 보급' };
  return { gold: 0, gems: 0, materials: base.materials * 2, label: '강화 재료 보급' };
}

export function getRewardChoices(info: TowerInfo): Array<{ choice: RewardChoice; amount: number; label: string }> {
  return [
    { choice: 'gold', amount: info.goldReward * 2, label: '금화 보급' },
    { choice: 'gems', amount: info.gemReward * 2, label: '보옥 보급' },
    { choice: 'materials', amount: info.materialReward * 2, label: '강화 재료 보급' },
  ];
}
