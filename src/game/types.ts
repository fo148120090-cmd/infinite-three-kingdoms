export type Faction = 'Wei' | 'Shu' | 'Wu' | 'Warlords';
export type Screen = 'home' | 'tower' | 'generals' | 'inventory' | 'summon' | 'formation' | 'battle';
export type Terrain = 'plain' | 'forest' | 'hill' | 'water' | 'fort';
export type Status = 'none' | 'stun' | 'burn' | 'slow' | 'guard';

export type General = {
  id: string;
  name: string;
  title: string;
  faction: Faction;
  role: string;
  hp: number;
  atk: number;
  defense: number;
  range: number;
  move: number;
  skill: string;
  skillPower: number;
  ultimate: string;
  ultimatePower: number;
  equipment: string;
  grade: number;
  tsName: string;
  tsTitle: string;
};

export type Equip = {
  level: number;
  rarity: number;
  equipped: boolean;
  optionA: number;
  optionB: number;
};

export type Save = {
  floor: number;
  gold: number;
  gems: number;
  level: number;
  materials: number;
  owned: string[];
  equipment: Record<string, Equip>;
  stars: Record<string, number>;
  fragments: Record<string, number>;
  tsSkins: Record<string, boolean>;
  formation: string[];
};

export type Unit = General & {
  team: 'player' | 'enemy';
  x: number;
  y: number;
  currentHp: number;
  maxHp: number;
  acted: boolean;
  rage: number;
  buff: number;
  movePoints: number;
  status: Status;
  statusTurns: number;
};
