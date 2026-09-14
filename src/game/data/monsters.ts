export type MonsterRole = 'melee' | 'ranged' | 'tank' | 'caster' | 'assassin' | 'boss';

export type Monster = {
  id: string;
  name: string;
  tribe: string;
  role: MonsterRole;
  hp: number;
  atk: number;
  range: number;
  move: number;
  skill: string;
  skillPower: number;
  boss?: boolean;
};

export type MonsterRegion = {
  id: string;
  name: string;
  floors: [number, number];
  description: string;
  terrain: string;
  monsters: string[];
  bossId: string;
};

export const MONSTERS: Monster[] = [
  { id: 'goblin-warrior', name: '고블린 전사', tribe: '고블린', role: 'melee', hp: 80, atk: 18, range: 1, move: 3, skill: '난폭한 베기', skillPower: 8 },
  { id: 'goblin-archer', name: '고블린 궁수', tribe: '고블린', role: 'ranged', hp: 55, atk: 16, range: 3, move: 2, skill: '독화살', skillPower: 6 },
  { id: 'goblin-shaman', name: '고블린 주술사', tribe: '고블린', role: 'caster', hp: 60, atk: 13, range: 3, move: 2, skill: '전투의 주술', skillPower: 5 },
  { id: 'goblin-chief', name: '고블린 족장', tribe: '고블린', role: 'boss', hp: 360, atk: 34, range: 1, move: 3, skill: '족장의 포효', skillPower: 18, boss: true },

  { id: 'gnoll-warrior', name: '놀 전사', tribe: '놀', role: 'melee', hp: 105, atk: 22, range: 1, move: 3, skill: '야성의 일격', skillPower: 10 },
  { id: 'gnoll-hunter', name: '놀 사냥꾼', tribe: '놀', role: 'ranged', hp: 70, atk: 20, range: 3, move: 3, skill: '사냥꾼의 화살', skillPower: 8 },
  { id: 'gnoll-shaman', name: '놀 주술사', tribe: '놀', role: 'caster', hp: 75, atk: 17, range: 3, move: 2, skill: '피의 저주', skillPower: 9 },
  { id: 'gnoll-chief', name: '놀 족장', tribe: '놀', role: 'boss', hp: 430, atk: 39, range: 1, move: 3, skill: '야성의 군령', skillPower: 20, boss: true },

  { id: 'orc-warrior', name: '오크 전사', tribe: '오크', role: 'melee', hp: 135, atk: 27, range: 1, move: 2, skill: '분쇄', skillPower: 12 },
  { id: 'orc-berserker', name: '오크 광전사', tribe: '오크', role: 'assassin', hp: 115, atk: 34, range: 1, move: 3, skill: '광폭 베기', skillPower: 15 },
  { id: 'orc-shaman', name: '오크 주술사', tribe: '오크', role: 'caster', hp: 90, atk: 22, range: 3, move: 2, skill: '전쟁의 저주', skillPower: 11 },
  { id: 'orc-warchief', name: '오크 족장', tribe: '오크', role: 'boss', hp: 520, atk: 45, range: 1, move: 2, skill: '대지 분쇄', skillPower: 24, boss: true },

  { id: 'lizard-spearman', name: '리자드맨 창병', tribe: '리자드맨', role: 'melee', hp: 120, atk: 25, range: 2, move: 3, skill: '습지 찌르기', skillPower: 10 },
  { id: 'lizard-hunter', name: '리자드맨 사냥꾼', tribe: '리자드맨', role: 'ranged', hp: 75, atk: 23, range: 3, move: 3, skill: '독침', skillPower: 10 },
  { id: 'lizard-priest', name: '리자드맨 주술사', tribe: '리자드맨', role: 'caster', hp: 85, atk: 20, range: 3, move: 2, skill: '습지의 저주', skillPower: 12 },
  { id: 'lizard-priest-king', name: '리자드맨 제사장', tribe: '리자드맨', role: 'boss', hp: 580, atk: 43, range: 3, move: 2, skill: '고대 신의 심판', skillPower: 26, boss: true },

  { id: 'skeleton', name: '해골병', tribe: '언데드', role: 'melee', hp: 105, atk: 24, range: 1, move: 3, skill: '뼈의 일격', skillPower: 8 },
  { id: 'skeleton-archer', name: '해골 궁수', tribe: '언데드', role: 'ranged', hp: 70, atk: 22, range: 3, move: 2, skill: '저주의 화살', skillPower: 10 },
  { id: 'wraith', name: '망령', tribe: '언데드', role: 'assassin', hp: 85, atk: 30, range: 1, move: 4, skill: '영혼 절단', skillPower: 13 },
  { id: 'death-knight', name: '망자의 기사', tribe: '언데드', role: 'boss', hp: 680, atk: 48, range: 1, move: 3, skill: '죽음의 일격', skillPower: 28, boss: true },

  { id: 'giant-spider', name: '거대거미', tribe: '거미', role: 'melee', hp: 110, atk: 27, range: 1, move: 4, skill: '독니', skillPower: 12 },
  { id: 'poison-spider', name: '독거미', tribe: '거미', role: 'assassin', hp: 65, atk: 25, range: 1, move: 4, skill: '맹독 물기', skillPower: 14 },
  { id: 'spider-guard', name: '거미 수호자', tribe: '거미', role: 'tank', hp: 170, atk: 21, range: 1, move: 2, skill: '거미줄 방패', skillPower: 6 },
  { id: 'spider-queen', name: '거대 거미 여왕', tribe: '거미', role: 'boss', hp: 760, atk: 50, range: 2, move: 3, skill: '여왕의 독무', skillPower: 30, boss: true },

  { id: 'minotaur', name: '미노타우로스', tribe: '미노타우로스', role: 'melee', hp: 180, atk: 35, range: 1, move: 2, skill: '도끼 강타', skillPower: 15 },
  { id: 'labyrinth-guard', name: '미궁 수호병', tribe: '미노타우로스', role: 'tank', hp: 230, atk: 29, range: 1, move: 2, skill: '철벽 방어', skillPower: 8 },
  { id: 'minotaur-hunter', name: '미궁 추적자', tribe: '미노타우로스', role: 'ranged', hp: 105, atk: 30, range: 3, move: 3, skill: '투척 도끼', skillPower: 12 },
  { id: 'minotaur-king', name: '미노타우로스 왕', tribe: '미노타우로스', role: 'boss', hp: 880, atk: 58, range: 1, move: 2, skill: '미궁의 대격노', skillPower: 34, boss: true },

  { id: 'imp', name: '임프', tribe: '악마', role: 'ranged', hp: 80, atk: 31, range: 3, move: 3, skill: '지옥불', skillPower: 16 },
  { id: 'hellhound', name: '지옥견', tribe: '악마', role: 'assassin', hp: 125, atk: 38, range: 1, move: 4, skill: '화염 물기', skillPower: 18 },
  { id: 'demon-warrior', name: '악마 전사', tribe: '악마', role: 'melee', hp: 200, atk: 40, range: 1, move: 3, skill: '마검 참격', skillPower: 18 },
  { id: 'hell-general', name: '지옥의 장군', tribe: '악마', role: 'boss', hp: 1020, atk: 66, range: 2, move: 3, skill: '지옥의 심판', skillPower: 40, boss: true },

  { id: 'drake', name: '드레이크', tribe: '용족', role: 'melee', hp: 240, atk: 46, range: 1, move: 3, skill: '화염 발톱', skillPower: 22 },
  { id: 'dragonfang', name: '용아병', tribe: '용족', role: 'tank', hp: 280, atk: 39, range: 1, move: 2, skill: '용린 방패', skillPower: 10 },
  { id: 'dragon-mage', name: '용족 술사', tribe: '용족', role: 'caster', hp: 150, atk: 45, range: 3, move: 2, skill: '고룡의 숨결', skillPower: 25 },
  { id: 'ancient-dragon-warden', name: '고룡의 수호자', tribe: '용족', role: 'boss', hp: 1200, atk: 78, range: 2, move: 3, skill: '고대 용화염', skillPower: 48, boss: true },

  { id: 'tower-knight', name: '천탑 수호기사', tribe: '천탑', role: 'tank', hp: 300, atk: 50, range: 1, move: 2, skill: '수호의 검', skillPower: 18 },
  { id: 'tower-mage', name: '천탑 마도사', tribe: '천탑', role: 'caster', hp: 180, atk: 56, range: 4, move: 2, skill: '천탑의 낙뢰', skillPower: 30 },
  { id: 'tower-reaper', name: '천탑 처형자', tribe: '천탑', role: 'assassin', hp: 210, atk: 64, range: 1, move: 4, skill: '처형', skillPower: 28 },
  { id: 'tower-demon-lord', name: '천탑의 마왕', tribe: '천탑', role: 'boss', hp: 1600, atk: 92, range: 2, move: 3, skill: '천탑 붕괴', skillPower: 55, boss: true },
];

export const MONSTER_REGIONS: MonsterRegion[] = [
  { id: 'goblin', name: '고블린 부락', floors: [1, 10], description: '목책과 진흙길로 이루어진 고블린 소굴.', terrain: 'village', monsters: ['goblin-warrior', 'goblin-archer', 'goblin-shaman'], bossId: 'goblin-chief' },
  { id: 'gnoll', name: '놀 부족', floors: [11, 20], description: '거친 황야를 떠도는 놀 부족의 전쟁터.', terrain: 'wasteland', monsters: ['gnoll-warrior', 'gnoll-hunter', 'gnoll-shaman'], bossId: 'gnoll-chief' },
  { id: 'orc', name: '오크족', floors: [21, 30], description: '거대한 목책과 요새를 세운 오크 군단.', terrain: 'fortress', monsters: ['orc-warrior', 'orc-berserker', 'orc-shaman'], bossId: 'orc-warchief' },
  { id: 'lizard', name: '리자드맨 습지', floors: [31, 40], description: '독성 늪과 고대 신전을 지배하는 리자드맨.', terrain: 'swamp', monsters: ['lizard-spearman', 'lizard-hunter', 'lizard-priest'], bossId: 'lizard-priest-king' },
  { id: 'undead', name: '언데드 묘지', floors: [41, 50], description: '죽은 자들이 끝없이 되살아나는 묘지.', terrain: 'graveyard', monsters: ['skeleton', 'skeleton-archer', 'wraith'], bossId: 'death-knight' },
  { id: 'spider', name: '거미 동굴', floors: [51, 60], description: '거미줄과 독기로 뒤덮인 거대한 둥지.', terrain: 'cave', monsters: ['giant-spider', 'poison-spider', 'spider-guard'], bossId: 'spider-queen' },
  { id: 'minotaur', name: '미노타우로스 미궁', floors: [61, 70], description: '좁은 통로와 돌벽으로 이루어진 미궁.', terrain: 'labyrinth', monsters: ['minotaur', 'labyrinth-guard', 'minotaur-hunter'], bossId: 'minotaur-king' },
  { id: 'demon', name: '악마 황무지', floors: [71, 80], description: '화염과 마기가 들끓는 지옥의 전초기지.', terrain: 'hell', monsters: ['imp', 'hellhound', 'demon-warrior'], bossId: 'hell-general' },
  { id: 'dragon', name: '용족 유적', floors: [81, 90], description: '고대 용족의 유적과 둥지.', terrain: 'ruins', monsters: ['drake', 'dragonfang', 'dragon-mage'], bossId: 'ancient-dragon-warden' },
  { id: 'tower', name: '천탑 정상', floors: [91, 100], description: '온갖 종족의 정예가 모이는 천탑 최상층.', terrain: 'tower', monsters: ['tower-knight', 'tower-mage', 'tower-reaper'], bossId: 'tower-demon-lord' },
];

export function getMonster(id: string): Monster | undefined {
  return MONSTERS.find(monster => monster.id === id);
}

export function getMonsterRegion(floor: number): MonsterRegion {
  const normalized = Math.max(1, Math.min(100, floor));
  return MONSTER_REGIONS.find(region => normalized >= region.floors[0] && normalized <= region.floors[1]) ?? MONSTER_REGIONS[0];
}

export function getMonsterEncounter(floor: number): Monster[] {
  const region = getMonsterRegion(floor);
  if (floor % 10 === 0) {
    const boss = getMonster(region.bossId);
    return boss ? [boss] : [];
  }
  return region.monsters.map(getMonster).filter((monster): monster is Monster => Boolean(monster));
}
