export type TowerFloorKind = 'normal' | 'boss';

export type TowerFloorRule = {
  floor: number;
  block: number;
  kind: TowerFloorKind;
  reward: {
    gold: number;
    gems: number;
    materials: number;
  };
};

export const TOWER_MAX_FLOOR = 100;
export const TOWER_BLOCK_SIZE = 10;

export function getTowerBlock(floor: number): number {
  return Math.max(1, Math.min(10, Math.ceil(floor / TOWER_BLOCK_SIZE)));
}

export function isTowerBossFloor(floor: number): boolean {
  return floor > 0 && floor <= TOWER_MAX_FLOOR && floor % TOWER_BLOCK_SIZE === 0;
}

export function getTowerFloorRule(floor: number): TowerFloorRule {
  const safeFloor = Math.max(1, Math.min(TOWER_MAX_FLOOR, Math.floor(floor)));
  const boss = isTowerBossFloor(safeFloor);
  const block = getTowerBlock(safeFloor);

  return {
    floor: safeFloor,
    block,
    kind: boss ? 'boss' : 'normal',
    reward: {
      gold: boss ? 1500 + block * 150 : 500 + block * 40,
      gems: boss ? 30 + block * 2 : 5 + Math.floor(block / 2),
      materials: boss ? 30 + block * 3 : 10 + block,
    },
  };
}

export function getNextTowerFloor(floor: number): number | null {
  if (floor >= TOWER_MAX_FLOOR) return null;
  return Math.max(1, Math.floor(floor) + 1);
}

export function getTowerClearReward(floor: number) {
  return getTowerFloorRule(floor).reward;
}
