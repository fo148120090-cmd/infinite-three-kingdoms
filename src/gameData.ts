export type Rarity = '★3'|'★4'|'★5'|'★6';
export type Equipment = { id:string; generalId:string; name:string; description:string; atk:number; hp:number };
export const equipment: Equipment[] = [
 {id:'guan-yu-green-dragon',generalId:'guan-yu',name:'청룡언월도',description:'적 처치 후 1칸 추가 이동. 궁극기 피해 증가.',atk:12,hp:20},
 {id:'zhang-fei-serpent-spear',generalId:'zhang-fei',name:'장팔사모',description:'피격 시 분노 획득 증가. 호통 효과 강화.',atk:6,hp:45},
 {id:'zhao-yun-dragon-spear',generalId:'zhao-yun',name:'용담창',description:'이동 후 공격 피해 증가. 연속 공격 확률 증가.',atk:10,hp:18},
 {id:'zhuge-feather-fan',generalId:'zhuge-liang',name:'백우선',description:'책략 사거리 +1. 스킬 효과 지속시간 증가.',atk:8,hp:12},
 {id:'lu-bu-fangtian',generalId:'lu-bu',name:'방천화극',description:'단일 대상 피해 대폭 증가. 처치 시 추가 공격.',atk:18,hp:25},
 {id:'cao-cao-yitian',generalId:'cao-cao',name:'의천검',description:'적에게 적용되는 공격력 감소 효과 강화.',atk:10,hp:15},
 {id:'diao-chan-golden',generalId:'diao-chan',name:'금선연',description:'매혹 성공 시 대상의 다음 행동을 확정적으로 봉쇄.',atk:5,hp:20},
];

export const towerRules = {
 bossEvery: 10,
 majorBossEvery: 50,
 storyEvery: 100,
 firstClearGold: 500,
 firstClearGems: 5,
 bossGems: 30,
};

export const summonRules = {
 singleCost: 30,
 tenCost: 270,
 duplicateShards: 20,
 pityAt: 80,
};
