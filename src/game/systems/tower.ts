import { getMonsterRegion } from '../data/monsters';

export type TowerModifier = 'normal' | 'ambush' | 'highGround' | 'berserk' | 'ironWall' | 'flameField';

export type TowerInfo = {
  floor: number;
  isBoss: boolean;
  bossId?: string;
  modifier: TowerModifier;
  regionId: string;
  regionName: string;
  regionDescription: string;
  terrainTheme: string;
  monsterIds: string[];
  goldReward: number;
  materialReward: number;
  gemReward: number;
};

export function getTowerInfo(floor: number): TowerInfo {
  const isBoss = floor % 10 === 0;
  const region = getMonsterRegion(floor);
  const modifier: TowerModifier = isBoss
    ? (floor / 10) % 3 === 1 ? 'berserk' : (floor / 10) % 3 === 2 ? 'ironWall' : 'flameField'
    : floor % 3 === 1 ? 'ambush' : floor % 3 === 2 ? 'highGround' : 'normal';

  return {
    floor,
    isBoss,
    bossId: isBoss ? region.bossId : undefined,
    modifier,
    regionId: region.id,
    regionName: region.name,
    regionDescription: region.description,
    terrainTheme: region.terrain,
    monsterIds: region.monsters,
    goldReward: 100 + floor * 10,
    materialReward: 10 + Math.floor(floor / 5),
    gemReward: isBoss ? 30 : 5,
  };
}
